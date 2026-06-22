import "server-only";

import { asc, desc, eq, gte, sql } from "drizzle-orm";
import { getDb } from "./db";
import { bookings, customers, rooms } from "./db/schema";

export async function getAdminRooms() {
  return getDb().query.rooms.findMany({
    orderBy: [asc(rooms.name)],
    with: { images: true, amenities: true },
  });
}

export async function getAdminRoom(id: string) {
  return getDb().query.rooms.findFirst({
    where: eq(rooms.id, id),
    with: { images: true, amenities: true },
  });
}

export async function getAdminBookings() {
  return getDb().query.bookings.findMany({
    orderBy: [desc(bookings.createdAt)],
    with: { customer: true, rooms: true },
    limit: 250,
  });
}

export async function getDashboardData() {
  const db = getDb();
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const [[roomCount], [pendingCount], [upcomingCount], recent] = await Promise.all([
    db
      .select({ value: sql<number>`count(*)::int` })
      .from(rooms)
      .where(eq(rooms.status, "active")),
    db
      .select({ value: sql<number>`count(*)::int` })
      .from(bookings)
      .where(eq(bookings.status, "pending")),
    db
      .select({ value: sql<number>`count(*)::int` })
      .from(bookings)
      .where(gte(bookings.checkIn, today)),
    db
      .select({
        id: bookings.id,
        bookingNumber: bookings.bookingNumber,
        status: bookings.status,
        checkIn: bookings.checkIn,
        total: bookings.total,
        fullName: customers.fullName,
      })
      .from(bookings)
      .innerJoin(customers, eq(bookings.customerId, customers.id))
      .orderBy(desc(bookings.createdAt))
      .limit(6),
  ]);
  return {
    activeRooms: roomCount.value,
    pendingBookings: pendingCount.value,
    upcomingBookings: upcomingCount.value,
    recent,
  };
}

export async function getActiveRoomOptions() {
  return getDb()
    .select({
      id: rooms.id,
      name: rooms.name,
      pricePerNight: rooms.pricePerNight,
      maxGuests: rooms.maxGuests,
      availableUnits: rooms.availableUnits,
    })
    .from(rooms)
    .where(eq(rooms.status, "active"))
    .orderBy(asc(rooms.name));
}
