import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MessageCircle, Pencil, Phone } from "lucide-react";
import { eq } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookingStatus } from "@/components/admin/booking-status";
import { getDb } from "@/lib/db";
import { bookingFolioLines, bookingRoomUnits, bookings, payments, roomUnits } from "@/lib/db/schema";
import { requireRole } from "@/lib/auth-middleware";
import { whatsappHref } from "@/lib/phone";
import { calculateBookingFinancialSummary } from "@/lib/folio";

const money = new Intl.NumberFormat("en-NA", {
  style: "currency",
  currency: "NAD",
  maximumFractionDigits: 0,
});

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireRole(["owner", "admin", "staff"]);
  const { id } = await params;
  const booking = await getDb().query.bookings.findFirst({
    where: eq(bookings.id, id),
    with: { customer: true, rooms: true, folioLines: true },
  });
  if (!booking) notFound();

  // Fetch assigned room units for this booking
  const bookingUnitRows = await getDb()
    .select({
      bookingRoomId: bookingRoomUnits.bookingRoomId,
      unitId: roomUnits.id,
      displayName: roomUnits.displayName,
      roomCode: roomUnits.roomCode,
    })
    .from(bookingRoomUnits)
    .innerJoin(roomUnits, eq(bookingRoomUnits.roomUnitId, roomUnits.id))
    .where(eq(bookingRoomUnits.bookingId, id));

  const unitMap = new Map<string, typeof bookingUnitRows>();
  for (const row of bookingUnitRows) {
    const existing = unitMap.get(row.bookingRoomId) ?? [];
    existing.push(row);
    unitMap.set(row.bookingRoomId, existing);
  }
  // Fetch folio lines breakdown
  const folioLines = await getDb()
    .select()
    .from(bookingFolioLines)
    .where(eq(bookingFolioLines.bookingId, id))
    .orderBy(bookingFolioLines.sortOrder);

  // Fetch payment history
  const paymentRecords = await getDb()
    .select()
    .from(payments)
    .where(eq(payments.bookingId, id))
    .orderBy(payments.createdAt);

  // Use the shared helper for accurate totals
  const financials = calculateBookingFinancialSummary({
    roomSubtotal: booking.subtotal,
    folioLines:
      folioLines.length > 0
        ? folioLines.map((l) => ({
            kind: l.kind,
            qty: l.qty,
            unitPrice: l.unitPrice,
          }))
        : null,
    legacyExtrasTotal: booking.extrasTotal,
    legacyDiscount: booking.discount,
    amountPaid: booking.amountPaid,
  });

  const phone = booking.customer.phone.replace(/[^+\d]/g, "");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={<Link href="/admin/bookings" />}
        >
          <ArrowLeft />
          Bookings
        </Button>
        <div className="flex gap-2">
          {session.user.role !== "staff" && (
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={<Link href={`/admin/bookings/${id}/edit`} />}
            >
              <Pencil />
              Edit
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<a href={`tel:${phone}`} />}
          >
            <Phone />
            Call
          </Button>
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={
              <a href={whatsappHref(booking.customer.whatsapp)} target="_blank" rel="noreferrer" />
            }
          >
            <MessageCircle />
            WhatsApp
          </Button>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            Booking
          </p>
          <h1 className="mt-1 font-heading text-2xl font-bold text-neutral-800">
            {booking.bookingNumber}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Created {booking.createdAt.toLocaleDateString("en-NA", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="capitalize">
            {booking.source}
          </Badge>
          <BookingStatus id={id} status={booking.status} />
        </div>
      </div>

      {/* Details grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Guest info */}
        <section className="rounded-xl border bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Guest
          </p>
          <p className="mt-3 font-semibold text-neutral-800">{booking.customer.fullName}</p>
          <p className="mt-1 text-sm text-muted-foreground">{booking.customer.phone}</p>
          <p className="text-sm text-muted-foreground">{booking.customer.whatsapp}</p>
          {booking.customer.email && (
            <p className="text-sm text-muted-foreground">{booking.customer.email}</p>
          )}
        </section>

        {/* Stay details */}
        <section className="rounded-xl border bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Stay
          </p>
          <div className="mt-3 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Check-in</p>
              <p className="mt-0.5 font-medium">
                {booking.checkIn.toLocaleDateString("en-NA", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Check-out</p>
              <p className="mt-0.5 font-medium">
                {booking.checkOut.toLocaleDateString("en-NA", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            {booking.nights} night{booking.nights === 1 ? "" : "s"} · {booking.guestsCount} guest
            {booking.guestsCount === 1 ? "" : "s"}
          </p>
        </section>

        {/* Rooms */}
        <section className="rounded-xl border bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Rooms
          </p>
          <div className="mt-3 divide-y">
            {booking.rooms.map((room) => {
              const units = unitMap.get(room.id) ?? [];
              const hasCustomDates = room.checkIn && room.checkOut && (
                room.checkIn.getTime() !== booking.checkIn.getTime() ||
                room.checkOut.getTime() !== booking.checkOut.getTime()
              );
              return (
                <div
                  key={room.id}
                  className="py-2 text-sm first:pt-0 last:pb-0"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-neutral-800">{room.roomNameSnapshot}</p>
                      <p className="text-xs text-muted-foreground">
                        {room.roomsCount} room{room.roomsCount === 1 ? "" : "s"} · {room.nights} night
                        {room.nights === 1 ? "" : "s"}
                        {hasCustomDates && (
                          <> &middot; {room.checkIn!.toLocaleDateString("en-NA", { day: "numeric", month: "short" })} &ndash; {room.checkOut!.toLocaleDateString("en-NA", { day: "numeric", month: "short" })}
                          </>
                        )}
                        {room.guestsCount && room.guestsCount > 0 && (
                          <> &middot; {room.guestsCount} guest{room.guestsCount === 1 ? "" : "s"}</>
                        )}
                      </p>
                    </div>
                    <p className="tabular-nums text-neutral-700">
                      {money.format(room.subtotal)}
                    </p>
                  </div>
                  {units.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {units.map((unit) => (
                        <span
                          key={unit.unitId}
                          className="inline-flex items-center rounded-md bg-neutral-100 px-2 py-0.5 text-[11px] text-neutral-600"
                        >
                          {unit.displayName}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Payment */}
        <section className="rounded-xl border bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Payment
          </p>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{money.format(booking.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Extras</span>
              <span>{money.format(booking.extrasTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Discount</span>
              <span>− {money.format(booking.discount)}</span>
            </div>
            <div className="flex justify-between border-t pt-2 font-semibold">
              <span>Total</span>
              <span>{money.format(booking.total)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Paid</span>
              <span>{money.format(booking.amountPaid)}</span>
            </div>
            <div className="flex justify-between border-t pt-2 font-semibold text-secondary">
              <span>Balance due</span>
              <span>{money.format(booking.balanceDue)}</span>
            </div>
          </div>
          {session.user.role !== "staff" && (
            <Badge
              variant="outline"
              className="mt-3 capitalize"
            >
              {booking.paymentStatus}
            </Badge>
          )}
        </section>
      </div>

      {/* Additional Items (folio lines) */}
      {folioLines.length > 0 && (
        <section className="rounded-xl border bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Additional Items
          </p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-y bg-muted/40 text-left">
                <tr>
                  <th className="px-3 py-2">Description</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2 text-right">Qty</th>
                  <th className="px-3 py-2 text-right">Unit price</th>
                  <th className="px-3 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {folioLines
                  .slice()
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((line) => (
                    <tr key={line.id} className="border-b">
                      <td className="px-3 py-3 font-medium">{line.name}</td>
                      <td className="px-3 py-3 capitalize">
                        {line.kind === "custom" ? "Extra charge" : line.kind}
                      </td>
                      <td className="px-3 py-3 text-right">{line.qty}</td>
                      <td className="px-3 py-3 text-right">{money.format(line.unitPrice)}</td>
                      <td className="px-3 py-3 text-right">
                        {line.kind === "discount"
                          ? `- ${money.format(line.lineTotal)}`
                          : money.format(line.lineTotal)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Payment History */}
      {paymentRecords.length > 0 && (
        <section className="rounded-xl border bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Payment History
          </p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-y bg-muted/40 text-left">
                <tr>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Method</th>
                  <th className="px-3 py-2">Reference</th>
                  <th className="px-3 py-2 text-right">Amount</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {paymentRecords.map((payment) => (
                  <tr key={payment.id} className="border-b">
                    <td className="px-3 py-3">
                      {payment.paidAt
                        ? payment.paidAt.toLocaleDateString("en-NA", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : payment.createdAt.toLocaleDateString("en-NA", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                    </td>
                    <td className="px-3 py-3 capitalize">{payment.paymentMethod.replace("-", " ")}</td>
                    <td className="px-3 py-3 text-muted-foreground">
                      {payment.transactionId || "—"}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">
                      {money.format(payment.amount)}
                    </td>
                    <td className="px-3 py-3">
                      <Badge variant="outline" className="capitalize">
                        {payment.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 space-y-1 border-t pt-3 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Total paid</span>
              <span className="tabular-nums font-medium text-neutral-800">
                {money.format(financials.amountPaid)}
              </span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Remaining balance</span>
              <span className="tabular-nums font-semibold text-secondary">
                {money.format(financials.balanceDue)}
              </span>
            </div>
          </div>
        </section>
      )}

      {/* Notes */}
      {booking.notes && (
        <section className="rounded-xl border bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Notes
          </p>
          <p className="mt-3 whitespace-pre-wrap text-sm text-neutral-700">
            {booking.notes}
          </p>
        </section>
      )}
    </div>
  );
}
