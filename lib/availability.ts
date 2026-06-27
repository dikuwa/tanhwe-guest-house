import "server-only";

import { and, count, eq, gt, inArray, lt, sql } from "drizzle-orm";
import { getDb } from "./db";
import { bookingRooms, bookingRoomUnits, bookings, roomBlockedDates, roomTypes, roomUnits, rooms } from "./db/schema";
import { calculateNights } from "./booking-calculations";

export { calculateNights, parseStayDate } from "./booking-calculations";

export async function checkRoomAvailability(input: {
  roomId: string;
  checkIn: Date;
  checkOut: Date;
  roomsCount: number;
}) {
  const db = getDb();
  const room = await db.query.rooms.findFirst({ where: eq(rooms.id, input.roomId) });
  if (!room || room.status !== "active")
    return { available: false, reason: "Room is unavailable" } as const;

  const blocked = await db.query.roomBlockedDates.findFirst({
    where: and(
      eq(roomBlockedDates.roomId, room.id),
      lt(roomBlockedDates.startDate, input.checkOut),
      gt(roomBlockedDates.endDate, input.checkIn)
    ),
  });
  if (blocked) return { available: false, reason: "Selected dates are blocked" } as const;

  // Count eligible room units (active, not maintenance/blocked/inactive)
  const [unitCount] = await db
    .select({ count: count() })
    .from(roomUnits)
    .where(
      and(
        eq(roomUnits.roomId, room.id),
        eq(roomUnits.isActive, true),
        inArray(roomUnits.operationalStatus, ["available", "cleaning"])
      )
    );

  // Count room units assigned to overlapping active bookings
  const [assignedCount] = await db
    .select({ count: count() })
    .from(bookingRoomUnits)
    .innerJoin(bookings, eq(bookingRoomUnits.bookingId, bookings.id))
    .innerJoin(bookingRooms, eq(bookingRoomUnits.bookingRoomId, bookingRooms.id))
    .where(
      and(
        eq(bookingRooms.roomId, room.id),
        inArray(bookings.status, ["confirmed", "checked-in"]),
        lt(bookings.checkIn, input.checkOut),
        gt(bookings.checkOut, input.checkIn)
      )
    );

  // Count old-style booking rooms (without room_unit assignments) for overlapping bookings
  const [oldReserved] = await db
    .select({ count: sql<number>`coalesce(sum(${bookingRooms.roomsCount}), 0)::int` })
    .from(bookingRooms)
    .innerJoin(bookings, eq(bookingRooms.bookingId, bookings.id))
    .leftJoin(bookingRoomUnits, eq(bookingRooms.id, bookingRoomUnits.bookingRoomId))
    .where(
      and(
        eq(bookingRooms.roomId, room.id),
        inArray(bookings.status, ["confirmed", "checked-in"]),
        lt(bookings.checkIn, input.checkOut),
        gt(bookings.checkOut, input.checkIn),
        sql`${bookingRoomUnits.id} is null`
      )
    );

  const totalUnits = Math.max(1, unitCount?.count ?? room.availableUnits);
  const reservedUnits = (assignedCount?.count ?? 0) + (oldReserved?.count ?? 0);
  const remainingUnits = Math.max(0, totalUnits - reservedUnits);
  const nights = calculateNights(input.checkIn, input.checkOut);

  return {
    available: remainingUnits >= input.roomsCount,
    remainingUnits,
    nights,
    pricePerNight: room.pricePerNight,
    subtotal: room.pricePerNight * input.roomsCount * nights,
    room,
  } as const;
}

export async function checkRoomTypeAvailability(input: {
  roomTypeId: string;
  checkIn: Date;
  checkOut: Date;
  quantity: number;
}) {
  const db = getDb();

  const roomType = await db.query.roomTypes.findFirst({ where: eq(roomTypes.id, input.roomTypeId) });
  if (!roomType || roomType.status !== "active")
    return { available: false, reason: "Room type is unavailable" } as const;

  // Find all active rooms of this type
  const typeRooms = await db
    .select({ id: rooms.id, pricePerNight: rooms.pricePerNight, availableUnits: rooms.availableUnits })
    .from(rooms)
    .where(and(eq(rooms.roomTypeId, input.roomTypeId), eq(rooms.status, "active")));

  if (typeRooms.length === 0)
    return { available: false, reason: "No rooms available for this type" } as const;

  const roomIds = typeRooms.map((r) => r.id);

  // Check blocked dates across all rooms of this type
  const blocked = await db.query.roomBlockedDates.findFirst({
    where: and(
      inArray(roomBlockedDates.roomId, roomIds),
      lt(roomBlockedDates.startDate, input.checkOut),
      gt(roomBlockedDates.endDate, input.checkIn)
    ),
  });
  if (blocked) return { available: false, reason: "Selected dates are blocked" } as const;

  // Count eligible room units across all rooms of this type
  const [unitCount] = await db
    .select({ count: count() })
    .from(roomUnits)
    .where(
      and(
        inArray(roomUnits.roomId, roomIds),
        eq(roomUnits.isActive, true),
        inArray(roomUnits.operationalStatus, ["available", "cleaning"])
      )
    );

  // Count room units assigned to overlapping active bookings for any of these rooms
  const [assignedCount] = await db
    .select({ count: count() })
    .from(bookingRoomUnits)
    .innerJoin(bookings, eq(bookingRoomUnits.bookingId, bookings.id))
    .innerJoin(bookingRooms, eq(bookingRoomUnits.bookingRoomId, bookingRooms.id))
    .where(
      and(
        inArray(bookingRooms.roomId, roomIds),
        inArray(bookings.status, ["confirmed", "checked-in"]),

        lt(bookings.checkIn, input.checkOut),
        gt(bookings.checkOut, input.checkIn)
      )
    );

  // Count old-style booking rooms (without room_unit assignments)
  const [oldReserved] = await db
    .select({ count: sql<number>`coalesce(sum(${bookingRooms.roomsCount}), 0)::int` })
    .from(bookingRooms)
    .innerJoin(bookings, eq(bookingRooms.bookingId, bookings.id))
    .leftJoin(bookingRoomUnits, eq(bookingRooms.id, bookingRoomUnits.bookingRoomId))
    .where(
      and(
        inArray(bookingRooms.roomId, roomIds),
        inArray(bookings.status, ["confirmed", "checked-in"]),
        lt(bookings.checkIn, input.checkOut),
        gt(bookings.checkOut, input.checkIn),
        sql`${bookingRoomUnits.id} is null`
      )
    );

  const totalUnits = Math.max(1, unitCount?.count ?? typeRooms.reduce((s, r) => s + r.availableUnits, 0));
  const reservedUnits = (assignedCount?.count ?? 0) + (oldReserved?.count ?? 0);
  const remainingUnits = Math.max(0, totalUnits - reservedUnits);
  const nights = calculateNights(input.checkIn, input.checkOut);
  const pricePerNight = typeRooms[0].pricePerNight;

  return {
    available: remainingUnits >= input.quantity,
    remainingUnits,
    nights,
    pricePerNight,
    subtotal: pricePerNight * input.quantity * nights,
    roomType,
    roomIds,
  } as const;
}

type Tx = Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0];

export async function assignRoomUnitsForBooking(
  tx: Tx,
  bookingId: string,
  bookingRoomId: string,
  roomIds: string[],
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
        inArray(roomUnits.roomId, roomIds),
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
