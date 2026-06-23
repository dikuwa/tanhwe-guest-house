import "server-only";

import { and, eq, gt, inArray, lt, sql } from "drizzle-orm";
import { getDb } from "./db";
import { bookingRooms, bookings, roomBlockedDates, rooms } from "./db/schema";
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

  const [reserved] = await db
    .select({ count: sql<number>`coalesce(sum(${bookingRooms.roomsCount}), 0)::int` })
    .from(bookingRooms)
    .innerJoin(bookings, eq(bookingRooms.bookingId, bookings.id))
    .where(
      and(
        eq(bookingRooms.roomId, room.id),
        inArray(bookings.status, ["confirmed", "checked-in"]),
        lt(bookings.checkIn, input.checkOut),
        gt(bookings.checkOut, input.checkIn)
      )
    );

  const remainingUnits = Math.max(0, room.availableUnits - (reserved?.count ?? 0));
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
