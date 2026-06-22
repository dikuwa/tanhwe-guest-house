import { BookingForm } from "@/components/admin/booking-form";
import { getActiveRoomOptions } from "@/lib/admin-data";
import { requireRole } from "@/lib/auth-middleware";
export default async function NewBookingPage() {
  await requireRole(["owner", "admin"]);
  const rooms = await getActiveRoomOptions();
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-heading text-3xl font-semibold">Create booking</h1>
      <p className="mb-6 mt-2 text-sm text-muted-foreground">
        Availability is checked before the reservation is saved.
      </p>
      <BookingForm rooms={rooms} />
    </div>
  );
}
