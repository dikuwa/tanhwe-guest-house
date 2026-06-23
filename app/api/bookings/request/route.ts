import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { calculateNights, checkRoomAvailability, parseStayDate } from "@/lib/availability";
import { allowPublicRequest } from "@/lib/public-rate-limit";
import { getDb } from "@/lib/db";
import { bookingRooms, bookings, customers } from "@/lib/db/schema";
import { findConfidentCustomerMatch } from "@/lib/customer-data";

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const schema = z.object({
  roomId: z.string().min(1).max(128),
  checkIn: date,
  checkOut: date,
  roomsCount: z.coerce.number().int().min(1).max(10),
  guestsCount: z.coerce.number().int().min(1).max(30),
  fullName: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(7).max(30),
  whatsapp: z.string().trim().min(7).max(30),
  email: z.union([z.string().trim().email(), z.literal("")]).optional(),
  notes: z.string().trim().max(1000).optional(),
  preferredContact: z.enum(["whatsapp", "phone", "email"]).default("whatsapp"),
});

export async function POST(request: NextRequest) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 32 * 1024)
    return NextResponse.json({ error: "Request is too large" }, { status: 413 });

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!allowPublicRequest(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please call or WhatsApp us." },
      { status: 429 }
    );
  }

  const body = schema.safeParse(await request.json().catch(() => null));
  if (!body.success)
    return NextResponse.json({ error: "Please check the booking details" }, { status: 400 });

  const checkIn = parseStayDate(body.data.checkIn);
  const checkOut = parseStayDate(body.data.checkOut);
  if (calculateNights(checkIn, checkOut) < 1) {
    return NextResponse.json({ error: "Check-out must be after check-in" }, { status: 400 });
  }

  const availability = await checkRoomAvailability({ ...body.data, checkIn, checkOut });
  if (!availability.available || !("room" in availability)) {
    return NextResponse.json(
      { error: availability.reason ?? "Room is unavailable for those dates" },
      { status: 409 }
    );
  }

  const matchedCustomer = await findConfidentCustomerMatch(body.data);
  const customerId = matchedCustomer?.id ?? crypto.randomUUID();
  const bookingId = crypto.randomUUID();
  const bookingNumber = `TG-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
  const notes = [body.data.notes, `Preferred contact: ${body.data.preferredContact}`]
    .filter(Boolean)
    .join("\n");

  await getDb().transaction(async (tx) => {
    if (!matchedCustomer)
      await tx.insert(customers).values({
        id: customerId,
        fullName: body.data.fullName,
        phone: body.data.phone,
        whatsapp: body.data.whatsapp,
        email: body.data.email || null,
      });
    await tx.insert(bookings).values({
      id: bookingId,
      bookingNumber,
      customerId,
      checkIn,
      checkOut,
      nights: availability.nights,
      guestsCount: body.data.guestsCount,
      status: "pending",
      source: "website",
      subtotal: availability.subtotal,
      total: availability.subtotal,
      balanceDue: availability.subtotal,
      notes,
    });
    await tx.insert(bookingRooms).values({
      id: crypto.randomUUID(),
      bookingId,
      roomId: availability.room.id,
      roomNameSnapshot: availability.room.name,
      pricePerNight: availability.pricePerNight,
      roomsCount: body.data.roomsCount,
      nights: availability.nights,
      subtotal: availability.subtotal,
    });
  });

  return NextResponse.json(
    {
      success: true,
      bookingNumber,
      message: "Your request has been received. We will confirm availability with you shortly.",
    },
    { status: 201 }
  );
}
