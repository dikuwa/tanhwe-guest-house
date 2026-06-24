import Link from "next/link";
import Image from "next/image";
import { BedDouble, ImageIcon, Plus, Trash2 } from "lucide-react";
import { requireRole } from "@/lib/auth-middleware";
import { getAdminRooms } from "@/lib/admin-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DeleteRoomButton } from "./delete-room-button";

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
        <table className="w-full min-w-200 text-left text-sm">
          <thead className="border-b border-neutral-100 bg-neutral-50 text-xs font-semibold uppercase tracking-wider text-neutral-500">
            <tr>
              <th className="px-4 py-3 font-medium w-12">Photo</th>
              <th className="px-4 py-3 font-medium">Room</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Rate</th>
              <th className="px-4 py-3 font-medium">Inventory</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {rooms.map((room) => {
              const primaryImage = room.images.find((img) => img.isPrimary) ?? room.images[0];
              return (
                <tr key={room.id} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50">
                  <td className="px-4 py-3">
                    {primaryImage ? (
                      <div className="relative size-10 overflow-hidden rounded-md bg-neutral-100">
                        <Image
                          src={primaryImage.imageUrl}
                          alt=""
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex size-10 items-center justify-center rounded-md bg-neutral-100 text-neutral-300">
                        <BedDouble className="size-5" />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <Link
                      href={`/admin/rooms/${room.id}/edit`}
                      className="font-medium text-neutral-800 hover:text-primary transition-colors"
                    >
                      {room.name}
                    </Link>
                    <p className="text-xs text-neutral-400">/{room.slug}</p>
                    {room.amenities.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {room.amenities.slice(0, 3).map((a) => (
                          <span
                            key={a.id}
                            className="inline-block rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] text-neutral-500"
                          >
                            {a.amenity}
                          </span>
                        ))}
                        {room.amenities.length > 3 && (
                          <span className="text-[10px] text-neutral-400">
                            +{room.amenities.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-4 text-neutral-700">{room.type}</td>
                  <td className="px-4 py-4 tabular-nums text-neutral-700">{money.format(room.pricePerNight)}</td>
                  <td className="px-4 py-4 text-neutral-600">
                    {room.availableUnits} unit{room.availableUnits === 1 ? "" : "s"} &middot;{" "}
                    {room.maxGuests} guest{room.maxGuests === 1 ? "" : "s"}
                    <p className="mt-0.5 text-xs text-neutral-400">
                      {room.images.length} image{room.images.length === 1 ? "" : "s"}
                    </p>
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
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        render={<Link href={`/admin/rooms/${room.id}/edit`} />}
                      >
                        Edit
                      </Button>
                      <DeleteRoomButton
                        id={room.id}
                        name={room.name}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
            {rooms.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-16 text-center text-neutral-500">
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
