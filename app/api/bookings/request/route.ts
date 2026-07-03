import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import {
  calculateNights,
  checkRoomAvailability,
  checkRoomTypeAvailability,
  assignRoomUnitsForBooking,
  parseStayDate,
} from "@/lib/availability";
import { allowPublicRequest } from "@/lib/public-rate-limit";
import { getDb } from "@/lib/db";
import { bookingRooms, bookings, customers, rooms as roomTable, roomTypes } from "@/lib/db/schema";
import { findConfidentCustomerMatch } from "@/lib/customer-data";
import { notifyOps } from "@/lib/notifications";
import { normalizeNamibianPhone } from "@/lib/phone";

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const phone = z.string().trim().min(7).max(30).refine((value) => Boolean(normalizeNamibianPhone(value)), {
  message: "Please enter a valid phone number",
});

const legacySchema = z.object({
  roomId: z.string().min(1).max(128),
  checkIn: date,
  checkOut: date,
  roomsCount: z.coerce.number().int().min(1).max(10),
  guestsCount: z.coerce.number().int().min(1).max(30),
  fullName: z.string().trim().min(2).max(100),
  phone,
  whatsapp: z.union([phone, z.literal("")]).optional(),
  email: z.union([z.string().trim().email(), z.literal("")]).optional(),
  notes: z.string().trim().max(1000).optional(),
  preferredContact: z.enum(["whatsapp", "phone", "email"]).default("whatsapp"),
});

const lineSchema = z.object({
  roomTypeId: z.string().min(1).max(128),
  roomId: z.string().min(1).max(128).optional(),
  quantity: z.coerce.number().int().min(1).max(10),
  guestsCount: z.coerce.number().int().min(1).max(30),
  checkIn: date,
  checkOut: date,
});

const multiRoomSchema = z.object({
  lines: z.array(lineSchema).min(1).max(10),
  fullName: z.string().trim().min(2).max(100),
  phone,
  whatsapp: z.union([phone, z.literal("")]).optional(),
  email: z.union([z.string().trim().email(), z.literal("")]).optional(),
  notes: z.string().trim().max(1000).optional(),
  preferredContact: z.enum(["whatsapp", "phone", "email"]).default("whatsapp"),
});

const schema = z.union([multiRoomSchema, legacySchema]);

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

  const rawLines =
    "lines" in body.data
      ? body.data.lines
      : [
          {
            roomId: body.data.roomId,
            quantity: body.data.roomsCount,
            guestsCount: body.data.guestsCount,
            checkIn: body.data.checkIn,
            checkOut: body.data.checkOut,
          },
        ];

  const lineResults: {
    roomType: typeof roomTypes.$inferSelect | null;
    roomName: string;
    checkIn: Date;
    checkOut: Date;
    nights: number;
    pricePerNight: number;
    subtotal: number;
    quantity: number;
    guestsCount: number;
    roomIds: string[];
    roomTypeId: string | null;
  }[] = [];

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    const checkIn = parseStayDate(line.checkIn);
    const checkOut = parseStayDate(line.checkOut);
    const nights = calculateNights(checkIn, checkOut);
    if (nights < 1) {
      return NextResponse.json(
        { error: `Line ${i + 1}: Check-out must be after check-in` },
        { status: 400 }
      );
    }

    if ("roomTypeId" in line) {
      const availability = await checkRoomTypeAvailability({
        roomTypeId: line.roomTypeId,
        checkIn,
        checkOut,
        quantity: line.quantity,
      });

      if (!availability.available || !("roomType" in availability)) {
        if (line.roomId && availability.reason === "Room type is unavailable") {
          const roomAvailability = await checkRoomAvailability({
            roomId: line.roomId,
            checkIn,
            checkOut,
            roomsCount: line.quantity,
          });

          if (!roomAvailability.available || !("room" in roomAvailability)) {
            return NextResponse.json(
              { error: roomAvailability.reason ?? "Room is unavailable for those dates" },
              { status: 409 }
            );
          }

          if (line.guestsCount > roomAvailability.room.maxGuests * line.quantity) {
            return NextResponse.json(
              {
                error: `${roomAvailability.room.name} allows up to ${roomAvailability.room.maxGuests * line.quantity} guest(s) for ${line.quantity} room(s).`,
              },
              { status: 400 }
            );
          }

          lineResults.push({
            roomType: null,
            roomName: roomAvailability.room.name,
            roomTypeId: roomAvailability.room.roomTypeId,
            checkIn,
            checkOut,
            nights: roomAvailability.nights,
            pricePerNight: roomAvailability.pricePerNight,
            subtotal: roomAvailability.subtotal,
            quantity: line.quantity,
            guestsCount: line.guestsCount,
            roomIds: [roomAvailability.room.id],
          });
          continue;
        }

        return NextResponse.json(
          { error: `${availability.reason ?? "Room type is unavailable for those dates"}` },
          { status: 409 }
        );
      }

      if (line.guestsCount > availability.roomType.maxGuests * line.quantity) {
        return NextResponse.json(
          {
            error: `${availability.roomType.name} allows up to ${availability.roomType.maxGuests * line.quantity} guest(s) for ${line.quantity} room(s).`,
          },
          { status: 400 }
        );
      }

      lineResults.push({
        roomType: availability.roomType,
        roomName: availability.roomType.name,
        roomTypeId: availability.roomType.id,
        checkIn,
        checkOut,
        nights: availability.nights,
        pricePerNight: availability.pricePerNight,
        subtotal: availability.subtotal,
        quantity: line.quantity,
        guestsCount: line.guestsCount,
        roomIds: availability.roomIds,
      });
    } else {
      const availability = await checkRoomAvailability({
        roomId: line.roomId,
        checkIn,
        checkOut,
        roomsCount: line.quantity,
      });

      if (!availability.available || !("room" in availability)) {
        return NextResponse.json(
          { error: availability.reason ?? "Room is unavailable for those dates" },
          { status: 409 }
        );
      }

      const publicRoom = await getDb().query.rooms.findFirst({
        where: eq(roomTable.id, line.roomId),
        with: { roomType: true },
      });

      if (line.guestsCount > availability.room.maxGuests * line.quantity) {
        return NextResponse.json(
          {
            error: `${availability.room.name} allows up to ${availability.room.maxGuests * line.quantity} guest(s) for ${line.quantity} room(s).`,
          },
          { status: 400 }
        );
      }

      lineResults.push({
        roomType: publicRoom?.roomType ?? null,
        roomName: publicRoom?.roomType?.name ?? availability.room.name,
        roomTypeId: publicRoom?.roomTypeId ?? null,
        checkIn,
        checkOut,
        nights: availability.nights,
        pricePerNight: availability.pricePerNight,
        subtotal: availability.subtotal,
        quantity: line.quantity,
        guestsCount: line.guestsCount,
        roomIds: [availability.room.id],
      });
    }
  }

  const canonicalPhone = normalizeNamibianPhone(body.data.phone) ?? body.data.phone;
  const waNumber = body.data.whatsapp || body.data.phone;
  const canonicalWhatsapp = normalizeNamibianPhone(waNumber) ?? waNumber;
  const matchedCustomer = await findConfidentCustomerMatch({
    ...body.data,
    phone: canonicalPhone,
    whatsapp: canonicalWhatsapp,
  });
  const customerId = matchedCustomer?.id ?? crypto.randomUUID();
  const bookingId = crypto.randomUUID();
  const bookingNumber = `TG-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
  const notes = [body.data.notes, `Preferred contact: ${body.data.preferredContact}`]
    .filter(Boolean)
    .join("\n");
  const checkIn = lineResults.reduce(
    (earliest, line) => (line.checkIn < earliest ? line.checkIn : earliest),
    lineResults[0].checkIn
  );
  const checkOut = lineResults.reduce(
    (latest, line) => (line.checkOut > latest ? line.checkOut : latest),
    lineResults[0].checkOut
  );
  const totalNights = calculateNights(checkIn, checkOut);
  const totalGuests = lineResults.reduce((sum, line) => sum + line.guestsCount, 0);
  const subtotal = lineResults.reduce((sum, line) => sum + line.subtotal, 0);

  try {
    await getDb().transaction(async (tx) => {
      if (!matchedCustomer)
        await tx.insert(customers).values({
          id: customerId,
          fullName: body.data.fullName,
          phone: canonicalPhone,
          whatsapp: canonicalWhatsapp,
          email: body.data.email || null,
        });
      await tx.insert(bookings).values({
        id: bookingId,
        bookingNumber,
        customerId,
        checkIn,
        checkOut,
        nights: totalNights,
        guestsCount: totalGuests,
        status: "pending",
        source: "website",
        subtotal,
        total: subtotal,
        balanceDue: subtotal,
        notes,
      });

      for (const line of lineResults) {
        const bookingRoomId = crypto.randomUUID();
        await tx.insert(bookingRooms).values({
          id: bookingRoomId,
          bookingId,
          roomId: line.roomIds[0],
          roomTypeId: line.roomTypeId,
          roomNameSnapshot: line.roomName,
          pricePerNight: line.pricePerNight,
          roomsCount: line.quantity,
          nights: line.nights,
          subtotal: line.subtotal,
          checkIn: line.checkIn,
          checkOut: line.checkOut,
          guestsCount: line.guestsCount,
        });

        try {
          await assignRoomUnitsForBooking(
            tx,
            bookingId,
            bookingRoomId,
            line.roomIds,
            line.checkIn,
            line.checkOut,
            line.quantity
          );
        } catch {
          throw new Error(
            `${line.roomName} has fewer available units for the selected dates. Please reduce the quantity, select another room type, or change the dates.`
          );
        }
      }
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "This room is no longer available for the selected dates.";
    return NextResponse.json({ error: message }, { status: 409 });
  }

  const totalRooms = lineResults.reduce((sum, line) => sum + line.quantity, 0);
  const roomTypeNames = [...new Set(lineResults.map((line) => line.roomName))];
  void notifyOps({
    type: "booking_requested",
    title: `New booking request: ${bookingNumber}`,
    description: `${body.data.fullName} · ${totalRooms} room${totalRooms === 1 ? "" : "s"} · ${roomTypeNames.join(", ")}`,
    bookingId,
    link: `/admin/bookings/${bookingId}`,
  }).catch((error) => {
    console.error("Booking notification failed", error);
  });

  return NextResponse.json(
    {
      success: true,
      bookingNumber,
      fullName: body.data.fullName,
      totalRooms,
      roomTypes: roomTypeNames,
      total: subtotal,
      message: "Your request has been received. We will confirm availability with you shortly.",
    },
    { status: 201 }
  );
}
