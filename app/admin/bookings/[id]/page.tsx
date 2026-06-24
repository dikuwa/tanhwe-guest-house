import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MessageCircle, Phone } from "lucide-react";
import { eq } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookingStatus } from "@/components/admin/booking-status";
import { getDb } from "@/lib/db";
import { bookingRooms, bookings, customers } from "@/lib/db/schema";
import { requireRole } from "@/lib/auth-middleware";

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
    with: { customer: true, rooms: true },
  });
  if (!booking) notFound();

  const phone = booking.customer.phone.replace(/[^+\d]/g, "");
  const whatsapp = booking.customer.whatsapp.replace(/\D/g, "");

  const statusVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
    pending: "default",
    confirmed: "secondary",
    "checked-in": "default",
    "checked-out": "default",
    cancelled: "outline",
    "no-show": "destructive",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" size="sm" render={<Link href="/admin/bookings" />}>
          <ArrowLeft />
          Bookings
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" render={<a href={`tel:${phone}`} />}>
            <Phone />
            Call
          </Button>
          <Button
            variant="outline"
            size="sm"
            render={
              <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer" />
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
            {booking.rooms.map((room) => (
              <div
                key={room.id}
                className="flex items-center justify-between py-2 text-sm first:pt-0 last:pb-0"
              >
                <div>
                  <p className="font-medium text-neutral-800">{room.roomNameSnapshot}</p>
                  <p className="text-xs text-muted-foreground">
                    {room.roomsCount} room{room.roomsCount === 1 ? "" : "s"} · {room.nights} night
                    {room.nights === 1 ? "" : "s"}
                  </p>
                </div>
                <p className="tabular-nums text-neutral-700">
                  {money.format(room.subtotal)}
                </p>
              </div>
            ))}
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
