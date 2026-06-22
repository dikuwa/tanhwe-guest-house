import Link from "next/link";
import { Plus } from "lucide-react";
import { BookingStatus } from "@/components/admin/booking-status";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAdminBookings } from "@/lib/admin-data";
import { requireRole } from "@/lib/auth-middleware";
const money = new Intl.NumberFormat("en-NA", {
  style: "currency",
  currency: "NAD",
  maximumFractionDigits: 0,
});
export default async function AdminBookings() {
  const session = await requireRole(["owner", "admin", "staff"]);
  const bookings = await getAdminBookings();
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-semibold">Bookings</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Review requests and manage each guest stay.
          </p>
        </div>
        {session.user.role !== "staff" && (
          <Button render={<Link href="/admin/bookings/new" />}>
            <Plus />
            New booking
          </Button>
        )}
      </div>
      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full min-w-240 text-left text-sm">
          <thead className="border-b bg-muted/50 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Booking</th>
              <th className="px-4 py-3">Guest</th>
              <th className="px-4 py-3">Room</th>
              <th className="px-4 py-3">Stay</th>
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => (
              <tr key={booking.id} className="border-b align-top last:border-0">
                <td className="px-4 py-4 font-medium">
                  {booking.bookingNumber}
                  <p className="mt-1 text-xs font-normal capitalize text-muted-foreground">
                    {booking.source}
                  </p>
                </td>
                <td className="px-4 py-4">
                  {booking.customer.fullName}
                  <p className="mt-1 text-xs text-muted-foreground">{booking.customer.phone}</p>
                </td>
                <td className="px-4 py-4">
                  {booking.rooms.map((room) => room.roomNameSnapshot).join(", ")}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  {booking.checkIn.toLocaleDateString("en-NA")} –{" "}
                  {booking.checkOut.toLocaleDateString("en-NA")}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {booking.nights} night{booking.nights === 1 ? "" : "s"}
                  </p>
                </td>
                <td className="px-4 py-4">
                  <Badge variant="outline" className="capitalize">
                    {booking.paymentStatus}
                  </Badge>
                </td>
                <td className="px-4 py-4 tabular-nums">{money.format(booking.total)}</td>
                <td className="px-4 py-4">
                  <BookingStatus id={booking.id} status={booking.status} />
                </td>
              </tr>
            ))}
            {bookings.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                  No bookings yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
