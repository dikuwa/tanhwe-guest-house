"use client";

import { useState } from "react";
import Link from "next/link";
import { BookOpen, Plus } from "lucide-react";
import { BookingStatus } from "@/components/admin/booking-status";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type BookingCustomer = { fullName: string; phone: string };
type BookingRoom = { roomNameSnapshot: string };
type Booking = {
  id: string; bookingNumber: string; source: string; checkIn: Date; checkOut: Date;
  nights: number; paymentStatus: string; total: number; status: string;
  customer: BookingCustomer; rooms: BookingRoom[];
};

const money = new Intl.NumberFormat("en-NA", {
  style: "currency", currency: "NAD", maximumFractionDigits: 0,
});

const statusBadge: Record<string, "default" | "secondary" | "outline"> = {
  pending: "outline", confirmed: "secondary", "checked-in": "default",
  "checked-out": "default", cancelled: "outline", "no-show": "outline",
};

const paymentBadge: Record<string, "secondary" | "outline" | "default"> = {
  paid: "secondary", partial: "default", pending: "outline", overdue: "outline",
};

export function BookingsTable({ initial, staffView }: { initial: Booking[]; staffView?: boolean }) {
  const [bookings, setBookings] = useState<Booking[]>(initial);

  function handleStatusChange(id: string, newStatus: string) {
    setBookings((prev) => prev.map((b) => b.id === id ? { ...b, status: newStatus } : b));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">Reservations</p>
          <h1 className="mt-1 font-heading text-2xl font-bold text-neutral-800">Bookings</h1>
          <p className="mt-1 text-sm text-neutral-500">Review requests and manage each guest stay.</p>
        </div>
        {!staffView && (
          <Button render={<Link href="/admin/bookings/new" />}>
            <Plus className="size-4" /> New booking
          </Button>
        )}
      </div>
      <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white shadow-xs">
        <table className="w-full min-w-240 text-left text-sm">
          <thead className="border-b border-neutral-100 bg-neutral-50 text-xs font-semibold uppercase tracking-wider text-neutral-500">
            <tr>
              <th className="px-4 py-3 font-medium">Booking</th>
              <th className="px-4 py-3 font-medium">Guest</th>
              <th className="px-4 py-3 font-medium">Room</th>
              <th className="px-4 py-3 font-medium">Stay</th>
              <th className="px-4 py-3 font-medium">Payment</th>
              <th className="px-4 py-3 text-right font-medium">Total</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => (
              <tr key={booking.id} className="border-b border-neutral-100 align-top last:border-0 hover:bg-neutral-50">
                <td className="px-4 py-4">
                  <p className="font-medium text-neutral-800">{booking.bookingNumber}</p>
                  <p className="mt-1 text-xs font-normal capitalize text-neutral-400">{booking.source}</p>
                </td>
                <td className="px-4 py-4 text-neutral-700">
                  {booking.customer.fullName}
                  <p className="mt-1 text-xs text-neutral-400">{booking.customer.phone}</p>
                </td>
                <td className="px-4 py-4 text-neutral-600">
                  {booking.rooms.map((room) => room.roomNameSnapshot).join(", ")}
                </td>
                <td className="whitespace-nowrap px-4 py-4 text-neutral-600">
                  {new Date(booking.checkIn).toLocaleDateString("en-NA")} &ndash;{" "}
                  {new Date(booking.checkOut).toLocaleDateString("en-NA")}
                  <p className="mt-1 text-xs text-neutral-400">
                    {booking.nights} night{booking.nights === 1 ? "" : "s"}
                  </p>
                </td>
                <td className="px-4 py-4">
                  <Badge variant={paymentBadge[booking.paymentStatus] ?? "outline"} className="capitalize">
                    {booking.paymentStatus}
                  </Badge>
                </td>
                <td className="px-4 py-4 text-right tabular-nums text-neutral-700">
                  {money.format(booking.total)}
                </td>
                <td className="px-4 py-4">
                  <BookingStatus id={booking.id} status={booking.status} onStatusChange={handleStatusChange} />
                </td>
              </tr>
            ))}
            {bookings.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-16 text-center text-neutral-500">
                  <BookOpen className="mx-auto size-8 text-neutral-300" />
                  <p className="mt-3 font-medium text-neutral-700">No bookings yet</p>
                  <p className="mt-1 text-sm text-neutral-400">
                    Bookings will appear here once guests start requesting stays.
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
