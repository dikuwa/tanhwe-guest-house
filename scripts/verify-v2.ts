import { eq, inArray } from "drizzle-orm";
import { closeDb, getDb } from "../lib/db";
import {
  activityLogs,
  bookingRooms,
  bookings,
  customers,
  documents,
  followUps,
  payments,
  reminderLogs,
  roomAmenities,
  rooms,
} from "../lib/db/schema";

async function main() {
  const base = process.env.VERIFY_BASE_URL ?? "http://localhost:3000";
  const origin = new URL(base).origin;
  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
    throw new Error("Verification environment is incomplete");
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
  const phone = `081${String(stamp).slice(-7)}`;
  let roomId = "";
  let bookingId = "";
  let customerId = "";
  const documentIds: string[] = [];
  const followUpIds: string[] = [];
  const paymentIds: string[] = [];

  async function jsonRequest(path: string, init: RequestInit) {
    const response = await fetch(`${base}${path}`, {
      ...init,
      headers: { ...headers, ...init.headers },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok)
      throw new Error(`${path} failed (${response.status}): ${JSON.stringify(data)}`);
    return data;
  }

  try {
    const room = await jsonRequest("/api/admin/rooms", {
      method: "POST",
      body: JSON.stringify({
        name: "V2 Verification Room",
        slug: `v2-verification-${stamp}`,
        type: "Verification",
        description: "Temporary production verification record",
        pricePerNight: 700,
        availableUnits: 1,
        maxGuests: 2,
        breakfastIncluded: true,
        featured: false,
        status: "active",
        amenities: ["Wi-Fi"],
      }),
    });
    roomId = room.id;

    const booking = await jsonRequest("/api/admin/bookings", {
      method: "POST",
      body: JSON.stringify({
        roomId,
        checkIn: "2034-08-10",
        checkOut: "2034-08-12",
        roomsCount: 1,
        guestsCount: 2,
        fullName: `V2 Verification ${stamp}`,
        phone,
        whatsapp: phone,
        email: `v2-verification-${stamp}@example.com`,
        status: "confirmed",
      }),
    });
    bookingId = booking.id;
    const savedBooking = await getDb().query.bookings.findFirst({
      where: eq(bookings.id, bookingId),
    });
    if (!savedBooking) throw new Error("Created booking was not persisted");
    customerId = savedBooking.customerId;

    await jsonRequest(`/api/admin/customers/${customerId}`, {
      method: "PATCH",
      body: JSON.stringify({
        fullName: `V2 Verification Updated ${stamp}`,
        phone,
        whatsapp: phone,
        email: `v2-verification-${stamp}@example.com`,
        notes: "Temporary verification record",
      }),
    });

    const invoice = await jsonRequest("/api/admin/documents", {
      method: "POST",
      body: JSON.stringify({ bookingId, type: "invoice" }),
    });
    documentIds.push(invoice.id);
    const pdf = await fetch(`${base}/api/admin/documents/${invoice.id}/pdf`, { headers });
    if (!pdf.ok || pdf.headers.get("content-type") !== "application/pdf") {
      throw new Error(`PDF verification failed (${pdf.status})`);
    }

    const payment = await jsonRequest("/api/admin/payments", {
      method: "POST",
      body: JSON.stringify({ bookingId, amount: 700, paymentMethod: "cash" }),
    });
    paymentIds.push(payment.id);

    const receipt = await jsonRequest("/api/admin/documents", {
      method: "POST",
      body: JSON.stringify({ bookingId, type: "receipt" }),
    });
    documentIds.push(receipt.id);

    const followUp = await jsonRequest("/api/admin/follow-ups", {
      method: "POST",
      body: JSON.stringify({
        bookingId,
        type: "arrival",
        title: "Temporary V2 arrival verification",
        dueDate: "2034-08-08",
        priority: "normal",
      }),
    });
    followUpIds.push(followUp.id);
    await jsonRequest(`/api/admin/follow-ups/${followUp.id}`, { method: "PATCH" });

    const reports = await fetch(`${base}/admin/reports?from=2034-08-01&to=2034-08-31`, {
      headers: { cookie },
      redirect: "manual",
    });
    if (!reports.ok) throw new Error(`Reports verification failed (${reports.status})`);

    console.log("V2 authenticated production verification passed.");
  } finally {
    const db = getDb();
    if (bookingId) await db.delete(reminderLogs).where(eq(reminderLogs.bookingId, bookingId));
    if (documentIds.length) await db.delete(documents).where(inArray(documents.id, documentIds));
    if (followUpIds.length) await db.delete(followUps).where(inArray(followUps.id, followUpIds));
    if (paymentIds.length) await db.delete(payments).where(inArray(payments.id, paymentIds));
    if (bookingId) {
      await db.delete(activityLogs).where(eq(activityLogs.entityId, bookingId));
      await db.delete(bookingRooms).where(eq(bookingRooms.bookingId, bookingId));
      await db.delete(bookings).where(eq(bookings.id, bookingId));
    }
    for (const id of [...documentIds, ...followUpIds, ...paymentIds]) {
      await db.delete(activityLogs).where(eq(activityLogs.entityId, id));
    }
    if (customerId) {
      await db.delete(activityLogs).where(eq(activityLogs.entityId, customerId));
      await db.delete(customers).where(eq(customers.id, customerId));
    }
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
