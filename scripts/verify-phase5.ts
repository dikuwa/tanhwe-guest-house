import { eq } from "drizzle-orm";
import { closeDb, getDb } from "../lib/db";
import {
  activityLogs,
  bookingRooms,
  bookings,
  customers,
  roomAmenities,
  rooms,
} from "../lib/db/schema";

async function main() {
  const base = process.env.VERIFY_BASE_URL ?? "http://localhost:3000";
  const origin = process.env.NEXT_PUBLIC_SITE_URL;
  if (!origin || !process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD)
    throw new Error("Verification environment is incomplete");
  const login = await fetch(`${base}/api/auth/sign-in/email`, {
    method: "POST",
    headers: { "content-type": "application/json", origin },
    body: JSON.stringify({ email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD }),
  });
  if (!login.ok) throw new Error(`Login failed (${login.status})`);
  const cookie = login.headers
    .getSetCookie()
    .map((value) => value.split(";")[0])
    .join("; ");
  const headers = { "content-type": "application/json", cookie, origin };
  let roomId = "",
    bookingId = "",
    customerId = "";
  try {
    const slug = `phase5-check-${Date.now()}`;
    const created = await fetch(`${base}/api/admin/rooms`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: "Phase 5 Check",
        slug,
        type: "Test",
        description: "Temporary verification",
        pricePerNight: 500,
        availableUnits: 1,
        maxGuests: 2,
        breakfastIncluded: false,
        featured: false,
        status: "active",
        amenities: ["Wi-Fi"],
      }),
    });
    const roomData = await created.json();
    if (!created.ok) throw new Error(`Room create failed: ${JSON.stringify(roomData)}`);
    roomId = roomData.id;
    const updated = await fetch(`${base}/api/admin/rooms/${roomId}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({
        name: "Phase 5 Check Updated",
        slug,
        type: "Test",
        description: "Temporary verification",
        pricePerNight: 550,
        availableUnits: 1,
        maxGuests: 2,
        breakfastIncluded: true,
        featured: false,
        status: "active",
        amenities: ["Wi-Fi", "Breakfast"],
      }),
    });
    if (!updated.ok) throw new Error(`Room update failed (${updated.status})`);
    const made = await fetch(`${base}/api/admin/bookings`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        roomId,
        checkIn: "2032-07-10",
        checkOut: "2032-07-12",
        roomsCount: 1,
        guestsCount: 2,
        fullName: "Phase Test Guest",
        phone: "0810000000",
        whatsapp: "0810000000",
        email: "phase-test@example.com",
        status: "confirmed",
      }),
    });
    const bookingData = await made.json();
    if (!made.ok) throw new Error(`Booking create failed: ${JSON.stringify(bookingData)}`);
    bookingId = bookingData.id;
    const saved = await getDb().query.bookings.findFirst({ where: eq(bookings.id, bookingId) });
    customerId = saved?.customerId ?? "";
    const moved = await fetch(`${base}/api/admin/bookings/${bookingId}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ status: "checked-in" }),
    });
    if (!moved.ok) throw new Error(`Status update failed (${moved.status})`);
    console.log("Phase 5 authenticated end-to-end verification passed.");
  } finally {
    const db = getDb();
    if (bookingId) {
      await db.delete(activityLogs).where(eq(activityLogs.entityId, bookingId));
      await db.delete(bookingRooms).where(eq(bookingRooms.bookingId, bookingId));
      await db.delete(bookings).where(eq(bookings.id, bookingId));
    }
    if (customerId) await db.delete(customers).where(eq(customers.id, customerId));
    if (roomId) {
      await db.delete(activityLogs).where(eq(activityLogs.entityId, roomId));
      await db.delete(roomAmenities).where(eq(roomAmenities.roomId, roomId));
      await db.delete(rooms).where(eq(rooms.id, roomId));
    }
    await closeDb();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
