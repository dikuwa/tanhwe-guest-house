import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth-middleware";
import { getAdminRooms, getActiveRoomTypes } from "@/lib/admin-data";
import { RoomUnitsManager } from "./room-units-manager";

export default async function RoomUnitsPage() {
  await requireRole(["owner", "admin"]);
  const rooms = await getAdminRooms();
  const roomTypes = await getActiveRoomTypes();
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" size="sm" render={<Link href="/admin/rooms" />}>
          <ArrowLeft className="size-4" />
          All rooms
        </Button>
      </div>
      <div>
        <h1 className="font-heading text-3xl font-semibold">Room Units</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage individual physical room units — assign blocks, room numbers, and operational status.
        </p>
      </div>
      <RoomUnitsManager rooms={rooms} roomTypes={roomTypes} />
    </div>
  );
}
