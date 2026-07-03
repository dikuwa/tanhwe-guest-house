import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { RoomForm } from "@/components/admin/room-form";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth-middleware";
import { getActiveRoomTypes } from "@/lib/admin-data";
export default async function NewRoomPage() {
  await requireRole(["owner", "admin"]);
  const roomTypes = await getActiveRoomTypes();
  return (
    <div className="mx-auto max-w-4xl">
      <Button
        variant="ghost"
        size="sm"
        nativeButton={false}
        render={<Link href="/admin/rooms" />}
      >
        <ArrowLeft className="size-4" />
        All rooms
      </Button>
      <h1 className="mt-2 font-heading text-3xl font-semibold">Add a room</h1>
      <p className="mb-6 mt-2 text-sm text-muted-foreground">
        Create the room first, then upload its images.
      </p>
      <RoomForm roomTypes={roomTypes} />
    </div>
  );
}
