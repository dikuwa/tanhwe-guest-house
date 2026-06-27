import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BookingForm } from "@/components/admin/booking-form";
import { Button } from "@/components/ui/button";
import { getAdminRoomTypes } from "@/lib/admin-data";
import { requireRole } from "@/lib/auth-middleware";
export default async function NewBookingPage() {
  await requireRole(["owner", "admin"]);
  const roomTypes = await getAdminRoomTypes();
  return (
    <div className="mx-auto max-w-4xl">
      <Button variant="ghost" size="sm" render={<Link href="/admin/bookings" />}>
        <ArrowLeft className="size-4" />
        All bookings
      </Button>
      <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-primary">Reservations</p>
      <h1 className="font-heading text-2xl font-bold text-neutral-800">Create booking</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Availability is checked before the reservation is saved.
      </p>
      <div className="mt-6">
        <BookingForm roomTypes={roomTypes} />
      </div>
    </div>
  );
}
