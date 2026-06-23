import { eq, inArray } from "drizzle-orm";
import { closeDb, getDb } from "../lib/db";
import {
  activityLogs,
  bookingRooms,
  bookings,
  customers,
  followUps,
  reminderLogs,
  roomAmenities,
  rooms,
} from "../lib/db/schema";

const dateValue = (date: Date) => date.toISOString().slice(0, 10);

async function main() {
  const base = process.env.VERIFY_BASE_URL ?? "http://localhost:3000";
  const origin = new URL(base).origin;
  const cronSecret = process.env.CRON_SECRET;
  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD || !cronSecret) {
    throw new Error("Admin and cron verification environment is incomplete");
  }

  const login = await fetch(`${base}/api/auth/sign-in/email`, {
    method: "POST",
    headers: { "content-type": "application/json", origin },
    body: JSON.stringify({
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
    }),
  });
  if (!login.ok) throw new Error(`Login failed (${login.status})`);
  const cookie = login.headers
    .getSetCookie()
    .map((value) => value.split(";")[0])
    .join("; ");
  const headers = { "content-type": "application/json", cookie, origin };

  const stamp = Date.now();
  const tomorrow = new Date();
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  const checkout = new Date(tomorrow);
  checkout.setUTCDate(checkout.getUTCDate() + 1);
  const phone = `081${String(stamp).slice(-7)}`;
  let roomId = "";
  let bookingId = "";
  let customerId = "";
  let generatedFollowUpIds: string[] = [];

  async function jsonRequest(path: string, init: RequestInit) {
    const response = await fetch(`${base}${path}`, {
      ...init,
      headers: { ...headers, ...init.headers },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(`${path} failed (${response.status}): ${JSON.stringify(data)}`);
    }
    return data;
  }

  try {
    const room = await jsonRequest("/api/admin/rooms", {
      method: "POST",
      body: JSON.stringify({
        name: "Cron Verification Room",
        slug: `cron-verification-${stamp}`,
        type: "Verification",
        description: "Temporary cron verification record",
        pricePerNight: 600,
        availableUnits: 1,
        maxGuests: 2,
        breakfastIncluded: false,
        featured: false,
        status: "active",
        amenities: [],
      }),
    });
    roomId = room.id;

    const booking = await jsonRequest("/api/admin/bookings", {
      method: "POST",
      body: JSON.stringify({
        roomId,
        checkIn: dateValue(tomorrow),
        checkOut: dateValue(checkout),
        roomsCount: 1,
        guestsCount: 1,
        fullName: `Cron Verification ${stamp}`,
        phone,
        whatsapp: phone,
        email: `cron-verification-${stamp}@example.com`,
        status: "confirmed",
      }),
    });
    bookingId = booking.id;
    const savedBooking = await getDb().query.bookings.findFirst({
      where: eq(bookings.id, bookingId),
    });
    if (!savedBooking) throw new Error("Cron verification booking was not persisted");
    customerId = savedBooking.customerId;

    const cronHeaders = { authorization: `Bearer ${cronSecret}` };
    const first = await fetch(`${base}/api/cron/reminders`, { headers: cronHeaders });
    const firstData = (await first.json()) as { created?: number };
    if (!first.ok || firstData.created !== 2) {
      throw new Error(`First cron run should create 2 tasks: ${JSON.stringify(firstData)}`);
    }

    const second = await fetch(`${base}/api/cron/reminders`, { headers: cronHeaders });
    const secondData = (await second.json()) as { created?: number };
    if (!second.ok || secondData.created !== 0) {
      throw new Error(`Second cron run should create 0 tasks: ${JSON.stringify(secondData)}`);
    }

    generatedFollowUpIds = (
      await getDb()
        .select({ id: followUps.id })
        .from(followUps)
        .where(eq(followUps.bookingId, bookingId))
    ).map((item) => item.id);
    if (generatedFollowUpIds.length !== 2) {
      throw new Error(
        `Expected exactly 2 persisted follow-ups, found ${generatedFollowUpIds.length}`
      );
    }

    console.log("Cron authentication and reminder idempotency verification passed.");
  } finally {
    if (bookingId) await getDb().delete(reminderLogs).where(eq(reminderLogs.bookingId, bookingId));
    if (generatedFollowUpIds.length) {
      await getDb()
        .delete(activityLogs)
        .where(inArray(activityLogs.entityId, generatedFollowUpIds));
    }
    if (bookingId) await getDb().delete(followUps).where(eq(followUps.bookingId, bookingId));
    if (bookingId) {
      await getDb().delete(activityLogs).where(eq(activityLogs.entityId, bookingId));
      await getDb().delete(bookingRooms).where(eq(bookingRooms.bookingId, bookingId));
      await getDb().delete(bookings).where(eq(bookings.id, bookingId));
    }
    if (customerId) await getDb().delete(customers).where(eq(customers.id, customerId));
    if (roomId) {
      await getDb().delete(activityLogs).where(eq(activityLogs.entityId, roomId));
      await getDb().delete(roomAmenities).where(eq(roomAmenities.roomId, roomId));
      await getDb().delete(rooms).where(eq(rooms.id, roomId));
    }
    await closeDb();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
