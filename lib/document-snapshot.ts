import "server-only";

import { eq } from "drizzle-orm";
import { dateToDateOnly } from "@/lib/date-only";
import { getDb } from "@/lib/db";
import { bookings, documents } from "@/lib/db/schema";

type DbLike = Pick<ReturnType<typeof getDb>, "query" | "select" | "update">;

const FINAL_DOCUMENT_STATUSES = new Set(["paid", "void", "cancelled"]);

export async function getBookingDocumentSnapshot(db: DbLike, bookingId: string) {
  const booking = await db.query.bookings.findFirst({
    where: eq(bookings.id, bookingId),
    with: { customer: true, rooms: true },
  });
  if (!booking) return null;

  return {
    booking,
    snapshot: {
      bookingNumber: booking.bookingNumber,
      customer: {
        name: booking.customer.fullName,
        phone: booking.customer.phone,
        whatsapp: booking.customer.whatsapp,
        email: booking.customer.email,
        address: booking.customer.address,
      },
      stay: {
        checkIn: dateToDateOnly(booking.checkIn),
        checkOut: dateToDateOnly(booking.checkOut),
        nights: booking.nights,
      },
      rooms: booking.rooms.map((room) => ({
        name: room.roomNameSnapshot,
        pricePerNight: room.pricePerNight,
        roomsCount: room.roomsCount,
        nights: room.nights,
        subtotal: room.subtotal,
        checkIn: dateToDateOnly(room.checkIn ?? booking.checkIn),
        checkOut: dateToDateOnly(room.checkOut ?? booking.checkOut),
        guestsCount: room.guestsCount,
      })),
      subtotal: booking.subtotal,
      extras: booking.extrasTotal,
      discount: booking.discount,
      total: booking.total,
      amountPaid: booking.amountPaid,
      balanceDue: booking.balanceDue,
    },
  };
}

export async function refreshMutableBookingDocuments(db: DbLike, bookingId: string) {
  const data = await getBookingDocumentSnapshot(db, bookingId);
  if (!data) return;

  const rows = await db
    .select({
      id: documents.id,
      type: documents.type,
      status: documents.status,
    })
    .from(documents)
    .where(eq(documents.bookingId, bookingId));

  for (const document of rows) {
    if (document.type === "receipt") continue;
    if (FINAL_DOCUMENT_STATUSES.has(document.status)) continue;

    await db
      .update(documents)
      .set({
        customerId: data.booking.customerId,
        total: data.booking.total,
        amountPaid: data.booking.amountPaid,
        balanceDue: data.booking.balanceDue,
        snapshot: JSON.stringify(data.snapshot),
        updatedAt: new Date(),
      })
      .where(eq(documents.id, document.id));
  }
}
