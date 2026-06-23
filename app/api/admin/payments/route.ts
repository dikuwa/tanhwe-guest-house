import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authorizeRequest } from "@/lib/auth-middleware";
import { getDb } from "@/lib/db";
import { activityLogs, bookings, payments } from "@/lib/db/schema";

const input = z.object({
  bookingId: z.string().uuid(),
  amount: z.coerce.number().int().positive().max(10_000_000),
  paymentMethod: z.enum(["cash", "bank-transfer", "card", "other"]),
  transactionId: z.string().trim().max(100).optional(),
  notes: z.string().trim().max(1000).optional(),
});

export async function POST(request: NextRequest) {
  const session = await authorizeRequest(request.headers, ["owner", "admin"]);
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = input.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "Please check the payment details" }, { status: 400 });
  const amount = parsed.data.amount;
  const id = crypto.randomUUID();
  const result = await getDb().transaction(async (tx) => {
    const [booking] = await tx
      .select()
      .from(bookings)
      .where(eq(bookings.id, parsed.data.bookingId))
      .for("update");
    if (!booking) return { error: "Booking not found", status: 404 } as const;
    if (amount > booking.balanceDue)
      return { error: "Payment cannot exceed the outstanding balance", status: 409 } as const;
    const amountPaid = booking.amountPaid + amount;
    const balanceDue = Math.max(booking.total - amountPaid, 0);
    const paymentStatus = balanceDue === 0 ? "paid" : "partially-paid";
    await tx
      .insert(payments)
      .values({
        id,
        bookingId: booking.id,
        amount,
        paymentMethod: parsed.data.paymentMethod,
        status: "completed",
        transactionId: parsed.data.transactionId || null,
        paidAt: new Date(),
        recordedBy: session.user.id,
        notes: parsed.data.notes || null,
      });
    await tx
      .update(bookings)
      .set({ amountPaid, balanceDue, paymentStatus, updatedAt: new Date() })
      .where(eq(bookings.id, booking.id));
    await tx
      .insert(activityLogs)
      .values({
        id: crypto.randomUUID(),
        userId: session.user.id,
        action: "recorded",
        entity: "payment",
        entityId: id,
        details: `${booking.bookingNumber}: ${amount}`,
      });
    return { paymentStatus, balanceDue } as const;
  });
  if ("error" in result)
    return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ id, ...result }, { status: 201 });
}
