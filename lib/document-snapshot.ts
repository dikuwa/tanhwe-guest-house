import "server-only";

import { eq } from "drizzle-orm";
import { dateToDateOnly } from "@/lib/date-only";
import { getDb } from "@/lib/db";
import { bookings, documents, payments } from "@/lib/db/schema";

type DbLike = Pick<ReturnType<typeof getDb>, "query" | "select" | "update">;

export type FolioLineSnapshot = {
  kind: "service" | "custom" | "discount";
  name: string;
  description?: string | null;
  qty: number;
  unitPrice: number;
  lineTotal: number;
  sortOrder?: number;
};

export type BookingSnapshot = {
  bookingNumber: string;
  customer: {
    name: string;
    phone: string;
    whatsapp?: string;
    email?: string | null;
    address?: string | null;
  };
  stay: {
    checkIn: string;
    checkOut: string;
    nights: number;
  };
  rooms: Array<{
    name: string;
    pricePerNight: number;
    roomsCount: number;
    nights: number;
    subtotal: number;
    checkIn?: string;
    checkOut?: string;
    guestsCount?: number | null;
  }>;
  subtotal: number;
  extras: number;
  discount: number;
  total: number;
  amountPaid: number;
  balanceDue: number;
  folioLines?: FolioLineSnapshot[];
  payments?: Array<{
    id: string;
    amount: number;
    paymentMethod: string;
    status: string;
    transactionId?: string | null;
    paidAt: Date | null;
    notes?: string | null;
    createdAt: Date;
  }>;
};

const FINAL_DOCUMENT_STATUSES = new Set(["paid", "void", "cancelled"]);

export async function getBookingDocumentSnapshot(db: DbLike, bookingId: string) {
  const booking = await db.query.bookings.findFirst({
    where: eq(bookings.id, bookingId),
    with: { customer: true, rooms: true, folioLines: true },
  });
  if (!booking) return null;

  const snapshot: BookingSnapshot = {
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
  };

  // Include folio lines in the snapshot if they exist
  if (booking.folioLines && booking.folioLines.length > 0) {
    snapshot.folioLines = booking.folioLines
      .map((l) => ({
        kind: l.kind as "service" | "custom" | "discount",
        name: l.name,
        description: l.description,
        qty: l.qty,
        unitPrice: l.unitPrice,
        lineTotal: l.lineTotal,
        sortOrder: l.sortOrder,
      }))
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }

  // Include payment details for receipts
  const bookingPayments = await db
    .select()
    .from(payments)
    .where(eq(payments.bookingId, bookingId))
    .orderBy(payments.createdAt);

  if (bookingPayments.length > 0) {
    snapshot.payments = bookingPayments.map((p) => ({
      id: p.id,
      amount: p.amount,
      paymentMethod: p.paymentMethod,
      status: p.status,
      transactionId: p.transactionId,
      paidAt: p.paidAt,
      notes: p.notes,
      createdAt: p.createdAt,
    }));
  }

  return {
    booking,
    snapshot,
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
