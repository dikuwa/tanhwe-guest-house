import { NextRequest, NextResponse } from "next/server";
import { and, eq, gt, inArray, lt, not, sql } from "drizzle-orm";
import { z } from "zod";
import { calculateNights, checkRoomAvailability, parseStayDate } from "@/lib/availability";
import { allowPublicRequest } from "@/lib/public-rate-limit";
import { getDb } from "@/lib/db";
import { bookingRooms, bookingRoomUnits, bookings, customers, roomUnits } from "@/lib/db/schema";
import { findConfidentCustomerMatch } from "@/lib/customer-data";
import { notifyOps } from "@/lib/notifications";

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const schema = z.object({
  roomId: z.string().min(1).max(128),
  checkIn: date,
  checkOut: date,
  roomsCount: z.coerce.number().int().min(1).max(10),
  guestsCount: z.coerce.number().int().min(1).max(30),
  fullName: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(7).max(30),
  whatsapp: z.union([z.string().trim().min(7).max(30), z.literal("")]).optional(),
  email: z.union([z.string().trim().email(), z.literal("")]).optional(),
  notes: z.string().trim().max(1000).optional(),
  preferredContact: z.enum(["whatsapp", "phone", "email"]).default("whatsapp"),
});

async function assignRoomUnits(
  tx: Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0],
  bookingId: string,
  bookingRoomId: string,
  roomId: string,
  checkIn: Date,
  checkOut: Date,
  roomsCount: number
) {
  const assigned = await tx
    .select({ unitId: bookingRoomUnits.roomUnitId })
    .from(bookingRoomUnits)
    .innerJoin(bookings, eq(bookingRoomUnits.bookingId, bookings.id))
    .where(
      and(
        inArray(bookings.status, ["confirmed", "checked-in"]),
        lt(bookings.checkIn, checkOut),
        gt(bookings.checkOut, checkIn)
      )
    );
  const assignedIds = assigned.map((a) => a.unitId);

  const availableUnits = await tx
    .select({ id: roomUnits.id, displayName: roomUnits.displayName })
    .from(roomUnits)
    .where(
      and(
        eq(roomUnits.roomId, roomId),
        eq(roomUnits.isActive, true),
        inArray(roomUnits.operationalStatus, ["available", "cleaning"])
      )
    );

  const free = availableUnits.filter((u) => !assignedIds.includes(u.id)).slice(0, roomsCount);

  if (free.length < roomsCount) {
    throw new Error("Not enough available room units");
  }

  for (const unit of free) {
    await tx.insert(bookingRoomUnits).values({
      id: crypto.randomUUID(),
      bookingId,
      bookingRoomId,
      roomUnitId: unit.id,
    });
  }
}

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

  const waNumber = body.data.whatsapp || body.data.phone;
  const matchedCustomer = await findConfidentCustomerMatch({ ...body.data, whatsapp: waNumber });
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
        whatsapp: waNumber,
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
    const bookingRoomId = crypto.randomUUID();
    await tx.insert(bookingRooms).values({
      id: bookingRoomId,
      bookingId,
      roomId: availability.room.id,
      roomNameSnapshot: availability.room.name,
      pricePerNight: availability.pricePerNight,
      roomsCount: body.data.roomsCount,
      nights: availability.nights,
      subtotal: availability.subtotal,
    });

    try {
      await assignRoomUnits(
        tx,
        bookingId,
        bookingRoomId,
        availability.room.id,
        checkIn,
        checkOut,
        body.data.roomsCount
      );
    } catch {
      throw new Error("This room type is no longer fully available for the selected dates. Please choose another room type or adjust the dates.");
    }
  });

  await notifyOps({
    type: "booking_requested",
    title: `New booking request: ${bookingNumber}`,
    description: `${body.data.fullName} — ${availability.room.name}`,
    bookingId,
    link: `/admin/bookings/${bookingId}`,
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
