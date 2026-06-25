import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAdminRoomTypes } from "@/lib/admin-data";
import { requireRole } from "@/lib/auth-middleware";
import { RoomTypesManager } from "./room-types-manager";

export default async function RoomTypesPage() {
  await requireRole(["owner", "admin"]);
  const types = await getAdminRoomTypes();
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" size="sm" render={<Link href="/admin/rooms" />}>
          <ArrowLeft className="size-4" />
          All rooms
        </Button>
      </div>
      <div>
        <h1 className="font-heading text-3xl font-semibold">Room Types</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage room categories — each room type provides default prices, amenities and bed configuration.
        </p>
      </div>
      <RoomTypesManager initial={types} />
    </div>
  );
}
