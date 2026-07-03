import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { eq } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { EditBookingForm } from "@/components/admin/edit-booking-form";
import { getDb } from "@/lib/db";
import { bookings, roomTypes } from "@/lib/db/schema";
import { requireRole } from "@/lib/auth-middleware";

export default async function EditBookingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["owner", "admin"]);
  const { id } = await params;
  const booking = await getDb().query.bookings.findFirst({
    where: eq(bookings.id, id),
    with: { customer: true, rooms: true },
  });
  if (!booking) notFound();
  const roomTypeOptions = await getDb()
    .select({
      id: roomTypes.id,
      name: roomTypes.name,
      pricePerNight: roomTypes.pricePerNight,
      maxGuests: roomTypes.maxGuests,
      status: roomTypes.status,
    })
    .from(roomTypes)
    .orderBy(roomTypes.name);
  return (
    <div className="mx-auto max-w-4xl">
      <Button
        variant="ghost"
        size="sm"
        nativeButton={false}
        render={<Link href={`/admin/bookings/${id}`} />}
      >
        <ArrowLeft className="size-4" />
        Back to booking
      </Button>
      <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-primary">Reservations</p>
      <h1 className="font-heading text-2xl font-bold text-neutral-800">Edit booking</h1>
      <p className="mt-1 text-sm text-neutral-500">{booking.bookingNumber}</p>
      <div className="mt-6">
        <EditBookingForm booking={booking} roomTypes={roomTypeOptions} />
      </div>
    </div>
  );
}
