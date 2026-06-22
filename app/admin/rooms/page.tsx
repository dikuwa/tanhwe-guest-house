import Link from "next/link";
import { Plus } from "lucide-react";
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
          <h1 className="font-heading text-3xl font-semibold">Rooms</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Manage room details, rates, inventory, and images.
          </p>
        </div>
        <Button render={<Link href="/admin/rooms/new" />}>
          <Plus />
          Add room
        </Button>
      </div>
      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-muted/50 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Room</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Rate</th>
              <th className="px-4 py-3">Inventory</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {rooms.map((room) => (
              <tr key={room.id} className="border-b last:border-0">
                <td className="px-4 py-4">
                  <p className="font-medium">{room.name}</p>
                  <p className="text-xs text-muted-foreground">/{room.slug}</p>
                </td>
                <td className="px-4 py-4">{room.type}</td>
                <td className="px-4 py-4 tabular-nums">{money.format(room.pricePerNight)}</td>
                <td className="px-4 py-4">
                  {room.availableUnits} unit{room.availableUnits === 1 ? "" : "s"} ·{" "}
                  {room.maxGuests} guests
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
                <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                  No rooms have been added.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
