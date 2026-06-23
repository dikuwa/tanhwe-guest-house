import Link from "next/link";
import { BedDouble, Plus } from "lucide-react";
import { requireRole } from "@/lib/auth-middleware";
import { getAdminRooms } from "@/lib/admin-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const money = new Intl.NumberFormat("en-NA", {
  style: "currency",
  currency: "NAD",
  maximumFractionDigits: 0,
});

export default async function AdminRooms() {
  await requireRole(["owner", "admin"]);
  const rooms = await getAdminRooms();
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">Accommodation</p>
          <h1 className="mt-1 font-heading text-2xl font-bold text-neutral-800">Rooms</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Manage room details, rates, inventory, and images.
          </p>
        </div>
        <Button render={<Link href="/admin/rooms/new" />}>
          <Plus className="size-4" />
          Add room
        </Button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white shadow-xs">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-100 bg-neutral-50 text-xs font-semibold uppercase tracking-wider text-neutral-500">
            <tr>
              <th className="px-4 py-3 font-medium">Room</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Rate</th>
              <th className="px-4 py-3 font-medium">Inventory</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {rooms.map((room) => (
              <tr key={room.id} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50">
                <td className="px-4 py-4">
                  <p className="font-medium text-neutral-800">{room.name}</p>
                  <p className="text-xs text-neutral-400">/{room.slug}</p>
                </td>
                <td className="px-4 py-4 text-neutral-700">{room.type}</td>
                <td className="px-4 py-4 tabular-nums text-neutral-700">{money.format(room.pricePerNight)}</td>
                <td className="px-4 py-4 text-neutral-600">
                  {room.availableUnits} unit{room.availableUnits === 1 ? "" : "s"} &middot;{" "}
                  {room.maxGuests} guest{room.maxGuests === 1 ? "" : "s"}
                </td>
                <td className="px-4 py-4">
                  <Badge
                    variant={room.status === "active" ? "secondary" : "outline"}
                    className="capitalize"
                  >
                    {room.status}
                  </Badge>
                </td>
                <td className="px-4 py-4 text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    render={<Link href={`/admin/rooms/${room.id}/edit`} />}
                  >
                    Edit
                  </Button>
                </td>
              </tr>
            ))}
            {rooms.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-16 text-center text-neutral-500">
                  <BedDouble className="mx-auto size-8 text-neutral-300" />
                  <p className="mt-3 font-medium text-neutral-700">No rooms yet</p>
                  <p className="mt-1 text-sm text-neutral-400">Add your first room to start accepting bookings.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
