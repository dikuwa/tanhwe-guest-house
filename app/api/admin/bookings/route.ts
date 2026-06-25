import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authorizeRequest } from "@/lib/auth-middleware";
import { calculateNights, checkRoomAvailability, parseStayDate } from "@/lib/availability";
import { getDb } from "@/lib/db";
import { activityLogs, bookingRooms, bookings, customers } from "@/lib/db/schema";
import { notifyOps } from "@/lib/notifications";
import { findConfidentCustomerMatch } from "@/lib/customer-data";

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const input = z.object({
  roomId: z.string().uuid(),
  checkIn: date,
  checkOut: date,
  roomsCount: z.coerce.number().int().min(1).max(20),
  guestsCount: z.coerce.number().int().min(1).max(100),
  fullName: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(7).max(30),
  whatsapp: z.union([z.string().trim().min(7).max(30), z.literal("")]).optional(),
  email: z.union([z.string().trim().email(), z.literal("")]).optional(),
  notes: z.string().trim().max(2000).optional(),
  status: z.enum(["pending", "confirmed"]).default("confirmed"),
});

export async function POST(request: NextRequest) {
  const session = await authorizeRequest(request.headers, ["owner", "admin"]);
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = input.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "Please check the booking details" }, { status: 400 });
  const checkIn = parseStayDate(parsed.data.checkIn),
    checkOut = parseStayDate(parsed.data.checkOut);
  if (calculateNights(checkIn, checkOut) < 1)
    return NextResponse.json({ error: "Check-out must be after check-in" }, { status: 400 });
  const availability = await checkRoomAvailability({
    roomId: parsed.data.roomId,
    checkIn,
    checkOut,
    roomsCount: parsed.data.roomsCount,
  });
  if (!availability.available || !("room" in availability))
    return NextResponse.json(
      { error: availability.reason ?? "Room is unavailable for those dates" },
      { status: 409 }
    );
  const waNumber = parsed.data.whatsapp || parsed.data.phone;
  const matchedCustomer = await findConfidentCustomerMatch({ ...parsed.data, whatsapp: waNumber });
  const customerId = matchedCustomer?.id ?? crypto.randomUUID(),
    bookingId = crypto.randomUUID();
  const bookingNumber = `TG-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
  await getDb().transaction(async (tx) => {
    if (!matchedCustomer)
      await tx.insert(customers).values({
        id: customerId,
        fullName: parsed.data.fullName,
        phone: parsed.data.phone,
        whatsapp: waNumber,
        email: parsed.data.email || null,
      });
    await tx.insert(bookings).values({
      id: bookingId,
      bookingNumber,
      customerId,
      checkIn,
      checkOut,
      nights: availability.nights,
      guestsCount: parsed.data.guestsCount,
      status: parsed.data.status,
      source: "admin",
      subtotal: availability.subtotal,
      total: availability.subtotal,
      balanceDue: availability.subtotal,
      notes: parsed.data.notes || null,
      createdBy: session.user.id,
    });
    await tx.insert(bookingRooms).values({
      id: crypto.randomUUID(),
      bookingId,
      roomId: availability.room.id,
      roomNameSnapshot: availability.room.name,
      pricePerNight: availability.pricePerNight,
      roomsCount: parsed.data.roomsCount,
      nights: availability.nights,
      subtotal: availability.subtotal,
    });
    await tx.insert(activityLogs).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      action: "created",
      entity: "booking",
      entityId: bookingId,
      details: bookingNumber,
    });
  });
  // Notify ops users
  await notifyOps({
    type: "booking_created",
    title: `New booking: ${bookingNumber}`,
    description: `${parsed.data.fullName} — ${availability.room.name}`,
    bookingId,
    link: `/admin/bookings/${bookingId}`,
    actorId: session.user.id,
  });
  return NextResponse.json({ id: bookingId, bookingNumber }, { status: 201 });
}
