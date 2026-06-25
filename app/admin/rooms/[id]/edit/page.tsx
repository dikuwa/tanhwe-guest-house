import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { RoomForm } from "@/components/admin/room-form";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth-middleware";
import { getAdminRoom } from "@/lib/admin-data";
export default async function EditRoomPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(["owner", "admin"]);
  const { id } = await params;
  const room = await getAdminRoom(id);
  if (!room) notFound();
  return (
    <div className="mx-auto max-w-4xl">
      <Button variant="ghost" size="sm" render={<Link href="/admin/rooms" />}>
        <ArrowLeft className="size-4" />
        All rooms
      </Button>
      <h1 className="mt-2 font-heading text-3xl font-semibold">Edit {room.name}</h1>
      <p className="mb-6 mt-2 text-sm text-muted-foreground">
        Changes appear on the public website immediately.
      </p>
      <RoomForm
        room={{
          ...room,
          description: room.description ?? "",
          amenities: room.amenities.map((item) => item.amenity),
          images: room.images
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((item) => item.imageUrl),
        }}
      />
    </div>
  );
}
