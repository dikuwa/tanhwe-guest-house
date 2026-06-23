import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authorizeRequest } from "@/lib/auth-middleware";
import { getDb } from "@/lib/db";
import { activityLogs, bookings, followUps } from "@/lib/db/schema";

const createInput = z
  .object({
    bookingId: z.union([z.string().uuid(), z.literal("")]).optional(),
    customerId: z.union([z.string().uuid(), z.literal("")]).optional(),
    type: z.enum(["deposit", "arrival", "balance", "quote", "manual"]),
    title: z.string().trim().min(3).max(160),
    notes: z.string().trim().max(2000).optional(),
    dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    priority: z.enum(["low", "normal", "high", "urgent"]),
    assignedTo: z.union([z.string().uuid(), z.literal("")]).optional(),
  })
  .refine((value) => value.bookingId || value.customerId, {
    message: "Choose a booking or customer",
  });

export async function POST(request: NextRequest) {
  const session = await authorizeRequest(request.headers, ["owner", "admin"]);
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = createInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Please check the follow-up" },
      { status: 400 }
    );
  let customerId = parsed.data.customerId || null;
  if (parsed.data.bookingId) {
    const booking = await getDb().query.bookings.findFirst({
      where: eq(bookings.id, parsed.data.bookingId),
      columns: { customerId: true },
    });
    if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    customerId = booking.customerId;
  }
  const id = crypto.randomUUID();
  await getDb().transaction(async (tx) => {
    await tx
      .insert(followUps)
      .values({
        id,
        bookingId: parsed.data.bookingId || null,
        customerId,
        type: parsed.data.type,
        title: parsed.data.title,
        notes: parsed.data.notes || null,
        dueDate: new Date(`${parsed.data.dueDate}T12:00:00Z`),
        priority: parsed.data.priority,
        assignedTo: parsed.data.assignedTo || null,
      });
    await tx
      .insert(activityLogs)
      .values({
        id: crypto.randomUUID(),
        userId: session.user.id,
        action: "created",
        entity: "follow-up",
        entityId: id,
        details: parsed.data.title,
      });
  });
  return NextResponse.json({ id }, { status: 201 });
}
