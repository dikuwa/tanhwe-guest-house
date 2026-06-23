import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authorizeRequest } from "@/lib/auth-middleware";
import { getDb } from "@/lib/db";
import { activityLogs, bookings, documents } from "@/lib/db/schema";

const input = z.object({
  bookingId: z.string().uuid(),
  type: z.enum(["quote", "invoice", "receipt"]),
  expiresAt: z.union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.literal("")]).optional(),
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
  const booking = await getDb().query.bookings.findFirst({
    where: eq(bookings.id, parsed.data.bookingId),
    with: { customer: true, rooms: true },
  });
  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  if (parsed.data.type === "receipt" && booking.amountPaid <= 0)
    return NextResponse.json(
      { error: "Record a payment before issuing a receipt" },
      { status: 409 }
    );
  const prefix = { quote: "QUO", invoice: "INV", receipt: "REC" }[parsed.data.type];
  const number = `${prefix}-${new Date().getUTCFullYear()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  const id = crypto.randomUUID();
  const snapshot = JSON.stringify({
    bookingNumber: booking.bookingNumber,
    customer: {
      name: booking.customer.fullName,
      phone: booking.customer.phone,
      email: booking.customer.email,
    },
    stay: {
      checkIn: booking.checkIn.toISOString(),
      checkOut: booking.checkOut.toISOString(),
      nights: booking.nights,
    },
    rooms: booking.rooms.map((room) => ({
      name: room.roomNameSnapshot,
      pricePerNight: room.pricePerNight,
      roomsCount: room.roomsCount,
      nights: room.nights,
      subtotal: room.subtotal,
    })),
    subtotal: booking.subtotal,
    extras: booking.extrasTotal,
    discount: booking.discount,
    total: booking.total,
    amountPaid: booking.amountPaid,
    balanceDue: booking.balanceDue,
  });
  await getDb().transaction(async (tx) => {
    await tx.insert(documents).values({
      id,
      bookingId: booking.id,
      customerId: booking.customerId,
      type: parsed.data.type,
      number,
      total: booking.total,
      amountPaid: booking.amountPaid,
      balanceDue: booking.balanceDue,
      snapshot,
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
    await tx
      .insert(activityLogs)
      .values({
        id: crypto.randomUUID(),
        userId: session.user.id,
        action: "issued",
        entity: "document",
        entityId: id,
        details: number,
      });
  });
  return NextResponse.json({ id, number }, { status: 201 });
}
