import { BookingForm } from "@/components/admin/booking-form";
import { getActiveRoomOptions } from "@/lib/admin-data";
import { requireRole } from "@/lib/auth-middleware";
export default async function NewBookingPage() {
  await requireRole(["owner", "admin"]);
  const rooms = await getActiveRoomOptions();
  return (
    <div className="mx-auto max-w-4xl">
      <p className="text-xs font-semibold uppercase tracking-wider text-primary">Reservations</p>
      <h1 className="mt-1 font-heading text-2xl font-bold text-neutral-800">Create booking</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Availability is checked before the reservation is saved.
      </p>
      <div className="mt-6">
        <BookingForm rooms={rooms} />
      </div>
    </div>
  );
}
