import { NextRequest, NextResponse } from "next/server";
import { eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { authorizeRequest } from "@/lib/auth-middleware";
import { checkRoomAvailability, checkRoomTypeAvailability, assignRoomUnitsForBooking } from "@/lib/availability";
import { getDb } from "@/lib/db";
import { activityLogs, bookingRooms, bookingRoomUnits, bookings, customers, roomTypes } from "@/lib/db/schema";
import { notifyOps } from "@/lib/notifications";
import { calculateBookingTotals, calculateNights, parseStayDate } from "@/lib/booking-calculations";
import { normalizeNamibianPhone } from "@/lib/phone";
import { refreshMutableBookingDocuments } from "@/lib/document-snapshot";

const statuses = [
  "pending",
  "confirmed",
  "checked-in",
  "checked-out",
  "cancelled",
  "no-show",
] as const;
const transitions: Record<(typeof statuses)[number], readonly string[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["checked-in", "cancelled", "no-show"],
  "checked-in": ["checked-out"],
  "checked-out": [],
  cancelled: [],
  "no-show": [],
};

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await authorizeRequest(request.headers, ["owner", "admin", "staff"]);
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = z
    .object({ status: z.enum(statuses) })
    .safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  const { id } = await params;
  const current = await getDb().query.bookings.findFirst({ where: eq(bookings.id, id) });
  if (!current) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  if (!transitions[current.status as keyof typeof transitions]?.includes(parsed.data.status))
    return NextResponse.json(
      { error: `Cannot move ${current.status} booking to ${parsed.data.status}` },
      { status: 409 }
    );
  if (parsed.data.status === "confirmed") {
    const reservedRooms = await getDb()
      .select({
        roomId: bookingRooms.roomId,
        roomsCount: bookingRooms.roomsCount,
        checkIn: bookingRooms.checkIn,
        checkOut: bookingRooms.checkOut,
      })
      .from(bookingRooms)
      .where(eq(bookingRooms.bookingId, id));
    for (const reservedRoom of reservedRooms) {
      const availability = await checkRoomAvailability({
        roomId: reservedRoom.roomId,
        checkIn: reservedRoom.checkIn ?? current.checkIn,
        checkOut: reservedRoom.checkOut ?? current.checkOut,
        roomsCount: reservedRoom.roomsCount,
        excludeBookingId: id,
      });
      if (!availability.available)
        return NextResponse.json(
          { error: "This room is no longer available for the requested dates" },
          { status: 409 }
        );
    }
  }
  await getDb().transaction(async (tx) => {
    await tx
      .update(bookings)
      .set({ status: parsed.data.status, updatedAt: new Date() })
      .where(eq(bookings.id, id));
    await tx.insert(activityLogs).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      action: "status_updated",
      entity: "booking",
      entityId: id,
      details: `${current.status} → ${parsed.data.status}`,
    });
  });
  // Notify ops users of status change
  if (parsed.data.status !== current.status) {
    await notifyOps({
      type: "booking_status",
      title: `Booking ${parsed.data.status}: ${current.bookingNumber}`,
      description: `${current.status} → ${parsed.data.status}`,
      bookingId: id,
      link: `/admin/bookings/${id}`,
      actorId: session.user.id,
    });
  }
  return NextResponse.json({ success: true });
}

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).transform((v) => parseStayDate(v));
const phone = z.string().trim().min(7).max(30).refine((value) => Boolean(normalizeNamibianPhone(value)), {
  message: "Please enter a valid phone number",
});

const editLineSchema = z.object({
  id: z.string().uuid().optional(),
  roomTypeId: z.string().uuid(),
  quantity: z.coerce.number().int().min(1).max(20),
  guestsCount: z.coerce.number().int().min(1).max(100),
  checkIn: date,
  checkOut: date,
  pricePerNight: z.coerce.number().int().min(0).optional(),
});

const editInputSchema = z.object({
  customerId: z.string().uuid(),
  fullName: z.string().trim().min(2).max(100),
  phone,
  whatsapp: z.union([phone, z.literal("")]).optional(),
  email: z.union([z.string().trim().email(), z.literal("")]).optional(),
  notes: z.string().trim().max(2000).optional(),
  lines: z.array(editLineSchema).min(1).max(10),
  extras: z.coerce.number().int().min(0).optional(),
  discount: z.coerce.number().int().min(0).optional(),
});

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await authorizeRequest(request.headers, ["owner", "admin"]);
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const parsed = editInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json(
      { error: first?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const db = getDb();
  const existing = await db.query.bookings.findFirst({
    where: eq(bookings.id, id),
    with: { rooms: true },
  });
  if (!existing) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

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
      excludeBookingId: id,
    });

    if (!availability.available) {
      return NextResponse.json(
        { error: `Line ${i + 1}: ${availability.reason}` },
        { status: 409 }
      );
    }

    if (line.guestsCount > availability.roomType.maxGuests * line.quantity) {
      return NextResponse.json(
        {
          error: `Line ${i + 1}: ${availability.roomType.name} allows up to ${availability.roomType.maxGuests} guest(s) per room`,
        },
        { status: 400 }
      );
    }

    const pricePerNight = line.pricePerNight && line.pricePerNight > 0
      ? line.pricePerNight
      : availability.pricePerNight;
    const subtotal = calculateBookingTotals({
      lines: [{ pricePerNight, roomsCount: line.quantity, nights }],
    }).roomSubtotal;

    lineResults.push({
      roomType: availability.roomType,
      checkIn: line.checkIn,
      checkOut: line.checkOut,
      nights: availability.nights,
      pricePerNight,
      subtotal,
      quantity: line.quantity,
      guestsCount: line.guestsCount,
      roomIds: availability.roomIds,
    });
  }

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
  const extras = parsed.data.extras ?? existing.extrasTotal;
  const discount = parsed.data.discount ?? existing.discount;
  const totals = calculateBookingTotals({
    lines: lineResults.map((line) => ({
      pricePerNight: line.pricePerNight,
      roomsCount: line.quantity,
      nights: line.nights,
    })),
    extras,
    discount,
    amountPaid: existing.amountPaid,
  });

  try {
    await db.transaction(async (tx) => {
      const selectedCustomer = await tx.query.customers.findFirst({
        where: eq(customers.id, parsed.data.customerId),
      });
      if (!selectedCustomer) throw new Error("Selected guest was not found");

      // Update the booking record
      await tx
        .update(bookings)
        .set({
          checkIn,
          checkOut,
          nights: totalNights,
          guestsCount: totalGuests,
          customerId: selectedCustomer.id,
          subtotal: totals.roomSubtotal,
          extrasTotal: totals.extrasTotal,
          discount: totals.discount,
          total: totals.total,
          amountPaid: totals.amountPaid,
          balanceDue: totals.balanceDue,
          notes: parsed.data.notes || null,
          updatedAt: new Date(),
        })
        .where(eq(bookings.id, id));

      // Remove existing booking rooms and their unit assignments
      const existingRoomIds = existing.rooms.map((r) => r.id);
      if (existingRoomIds.length > 0) {
        await tx
          .delete(bookingRoomUnits)
          .where(inArray(bookingRoomUnits.bookingRoomId, existingRoomIds));
        await tx
          .delete(bookingRooms)
          .where(eq(bookingRooms.bookingId, id));
      }

      // Insert new booking rooms
      for (const line of lineResults) {
        const bookingRoomId = crypto.randomUUID();
        await tx.insert(bookingRooms).values({
          id: bookingRoomId,
          bookingId: id,
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
          id,
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
        action: "updated",
        entity: "booking",
        entityId: id,
        details: existing.bookingNumber,
      });
      await refreshMutableBookingDocuments(tx, id);
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Update failed";
    return NextResponse.json({ error: message }, { status: 409 });
  }

  await notifyOps({
    type: "booking_updated",
    title: `Booking updated: ${existing.bookingNumber}`,
    description: `${parsed.data.fullName} · ${lineResults.length} room line(s) · N$${totals.total}`,
    link: `/admin/bookings/${id}`,
  });

  return NextResponse.json({ id, bookingNumber: existing.bookingNumber });
}
