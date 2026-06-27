import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { authorizeRequest } from "@/lib/auth-middleware";
import { calculateNights, checkRoomTypeAvailability, assignRoomUnitsForBooking } from "@/lib/availability";
import { getDb } from "@/lib/db";
import { activityLogs, bookingRooms, bookings, customers, roomTypes } from "@/lib/db/schema";
import { notifyOps } from "@/lib/notifications";
import { findConfidentCustomerMatch } from "@/lib/customer-data";

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).transform((v) => new Date(`${v}T00:00:00.000Z`));

const lineSchema = z.object({
  roomTypeId: z.string().uuid(),
  quantity: z.coerce.number().int().min(1).max(20),
  guestsCount: z.coerce.number().int().min(1).max(100),
  checkIn: date,
  checkOut: date,
});

const input = z.object({
  lines: z.array(lineSchema).min(1).max(10),
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
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json(
      { error: first?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const db = getDb();

  // Validate and check availability for each line
  const lineResults: {
    roomType: typeof roomTypes.$inferSelect;
    checkIn: Date;
    checkOut: Date;
    nights: number;
    pricePerNight: number;
    subtotal: number;
    quantity: number;
    guestsCount: number;
    roomIds: string[];
  }[] = [];

  for (let i = 0; i < parsed.data.lines.length; i++) {
    const line = parsed.data.lines[i];
    const nights = calculateNights(line.checkIn, line.checkOut);
    if (nights < 1) {
      return NextResponse.json(
        { error: `Line ${i + 1}: Check-out must be at least one day after check-in` },
        { status: 400 }
      );
    }

    const availability = await checkRoomTypeAvailability({
      roomTypeId: line.roomTypeId,
      checkIn: line.checkIn,
      checkOut: line.checkOut,
      quantity: line.quantity,
    });

    if (!availability.available) {
      return NextResponse.json(
        { error: `Line ${i + 1}: ${availability.reason}` },
        { status: 409 }
      );
    }

    lineResults.push({
      roomType: availability.roomType,
      checkIn: line.checkIn,
      checkOut: line.checkOut,
      nights: availability.nights,
      pricePerNight: availability.pricePerNight,
      subtotal: availability.subtotal,
      quantity: line.quantity,
      guestsCount: line.guestsCount,
      roomIds: availability.roomIds,
    });
  }

  // Find or create customer
  const customer = await findConfidentCustomerMatch({
    phone: parsed.data.phone,
    whatsapp: parsed.data.whatsapp || parsed.data.phone,
    email: parsed.data.email || null,
  });

  const checkIn = lineResults.reduce(
    (earliest, l) => (l.checkIn < earliest ? l.checkIn : earliest),
    lineResults[0].checkIn
  );
  const checkOut = lineResults.reduce(
    (latest, l) => (l.checkOut > latest ? l.checkOut : latest),
    lineResults[0].checkOut
  );
  const totalNights = calculateNights(checkIn, checkOut);
  const totalGuests = lineResults.reduce((s, l) => s + l.guestsCount, 0);
  const subtotal = lineResults.reduce((s, l) => s + l.subtotal, 0);

  if (totalNights < 1) {
    return NextResponse.json(
      { error: "Invalid overall stay dates" },
      { status: 400 }
    );
  }

  const bookingId = crypto.randomUUID();
  const bookingNumber = `TG-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;

  try {
    await db.transaction(async (tx) => {
      let customerId: string;
      if (customer) {
        customerId = customer.id;
      } else {
        customerId = crypto.randomUUID();
        await tx.insert(customers).values({
          id: customerId,
          fullName: parsed.data.fullName,
          phone: parsed.data.phone,
          whatsapp: parsed.data.whatsapp || parsed.data.phone,
          email: parsed.data.email || null,
        });
      }

      await tx.insert(bookings).values({
        id: bookingId,
        bookingNumber,
        customerId,
        checkIn,
        checkOut,
        nights: totalNights,
        guestsCount: totalGuests,
        status: parsed.data.status,
        source: "admin",
        subtotal,
        total: subtotal,
        balanceDue: subtotal,
        notes: parsed.data.notes || null,
        createdBy: session.user.id,
      });

      for (const line of lineResults) {
        const bookingRoomId = crypto.randomUUID();
        await tx.insert(bookingRooms).values({
          id: bookingRoomId,
          bookingId,
          roomId: line.roomIds[0],
          roomTypeId: line.roomType.id,
          roomNameSnapshot: line.roomType.name,
          pricePerNight: line.pricePerNight,
          roomsCount: line.quantity,
          nights: line.nights,
          subtotal: line.subtotal,
          checkIn: line.checkIn,
          checkOut: line.checkOut,
          guestsCount: line.guestsCount,
        });

        await assignRoomUnitsForBooking(
          tx,
          bookingId,
          bookingRoomId,
          line.roomIds,
          line.checkIn,
          line.checkOut,
          line.quantity
        );
      }

      await tx.insert(activityLogs).values({
        id: crypto.randomUUID(),
        userId: session.user.id,
        action: "created",
        entity: "booking",
        entityId: bookingId,
        details: bookingNumber,
      });
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Booking failed";
    return NextResponse.json({ error: message }, { status: 409 });
  }

  await notifyOps({
    type: "booking_created",
    title: `New booking: ${bookingNumber}`,
    description: `${parsed.data.fullName} · ${lineResults.length} room line(s) · N$${subtotal}`,
    link: `/admin/bookings/${bookingId}`,
  });

  return NextResponse.json({ id: bookingId, bookingNumber }, { status: 201 });
}
