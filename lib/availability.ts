import "server-only";

import { and, count, eq, gt, inArray, lt, not, sql } from "drizzle-orm";
import { getDb } from "./db";
import { bookingRooms, bookingRoomUnits, bookings, roomBlockedDates, roomUnits, rooms } from "./db/schema";
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
