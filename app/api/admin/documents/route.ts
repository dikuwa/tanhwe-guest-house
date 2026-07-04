import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authorizeRequest } from "@/lib/auth-middleware";
import { getDb } from "@/lib/db";
import { activityLogs, documents } from "@/lib/db/schema";
import { getBookingDocumentSnapshot, type FolioLineSnapshot } from "@/lib/document-snapshot";
import { calculateFolioTotals } from "@/lib/folio";

const folioLineSchema = z.object({
  kind: z.enum(["service", "custom", "discount"]),
  name: z.string().trim().min(1).max(200),
  qty: z.coerce.number().int().min(1).max(100),
  unitPrice: z.coerce.number().int().min(0).max(100000000),
});

const input = z.object({
  bookingId: z.string().uuid(),
  type: z.enum(["quote", "invoice", "receipt"]),
  expiresAt: z.union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.literal("")]).optional(),
  folioLines: z.array(folioLineSchema).optional(),
});

export async function POST(request: NextRequest) {
  const session = await authorizeRequest(request.headers, ["owner", "admin"]);
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = input.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { error: "Please choose a booking and document type" },
      { status: 400 }
    );
  const db = getDb();
  const data = await getBookingDocumentSnapshot(db, parsed.data.bookingId);
  if (!data) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  const { booking, snapshot } = data;
  if (parsed.data.type === "receipt" && booking.amountPaid <= 0)
    return NextResponse.json(
      { error: "Record a payment before issuing a receipt" },
      { status: 409 }
    );

  // Merge document-specific folio lines into the snapshot
  let documentTotal = booking.total;
  let documentAmountPaid = booking.amountPaid;
  let documentBalanceDue = booking.balanceDue;
  let documentFolioLines = snapshot.folioLines ?? [];

  if (parsed.data.folioLines && parsed.data.folioLines.length > 0) {
    const docFolioSnapshot: FolioLineSnapshot[] = parsed.data.folioLines.map((l, i) => ({
      kind: l.kind,
      name: l.name,
      qty: l.qty,
      unitPrice: l.unitPrice,
      lineTotal: l.qty * l.unitPrice,
      sortOrder: i,
    }));
    const docFolioTotals = calculateFolioTotals(
      parsed.data.folioLines.map((l) => ({
        kind: l.kind,
        qty: l.qty,
        unitPrice: l.unitPrice,
      }))
    );

    // Merge lines: booking folio lines first, then document-specific lines
    documentFolioLines = [...documentFolioLines, ...docFolioSnapshot];

    // Recalculate totals
    const bookingExtras = snapshot.extras;
    const bookingDiscount = snapshot.discount;
    const mergedExtras = bookingExtras + docFolioTotals.folioChargesTotal;
    const mergedDiscount = bookingDiscount + docFolioTotals.discountTotal;
    documentTotal = Math.max(0, snapshot.subtotal + mergedExtras - mergedDiscount);
    documentBalanceDue = Math.max(0, documentTotal - documentAmountPaid);

    // Update snapshot fields for the merged data
    snapshot.extras = mergedExtras;
    snapshot.discount = mergedDiscount;
    snapshot.total = documentTotal;
    snapshot.balanceDue = documentBalanceDue;
    snapshot.folioLines = documentFolioLines;
  }

  const prefix = { quote: "QUO", invoice: "INV", receipt: "REC" }[parsed.data.type];
  const number = `${prefix}-${new Date().getUTCFullYear()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  const id = crypto.randomUUID();
  await db.transaction(async (tx) => {
    await tx.insert(documents).values({
      id,
      bookingId: booking.id,
      customerId: booking.customerId,
      type: parsed.data.type,
      number,
      total: documentTotal,
      amountPaid: documentAmountPaid,
      balanceDue: documentBalanceDue,
      snapshot: JSON.stringify(snapshot),
      status:
        parsed.data.type === "quote"
          ? "issued"
          : parsed.data.type === "receipt"
            ? "paid"
            : booking.paymentStatus,
      expiresAt:
        parsed.data.type === "quote" && parsed.data.expiresAt
          ? new Date(`${parsed.data.expiresAt}T23:59:59Z`)
          : null,
      createdBy: session.user.id,
    });
    await tx.insert(activityLogs).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      action: "issued",
      entity: "document",
      entityId: id,
      details: number,
    });
  });
  return NextResponse.json({ id, number, total: documentTotal, balanceDue: documentBalanceDue }, { status: 201 });
}
