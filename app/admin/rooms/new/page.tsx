import { RoomForm } from "@/components/admin/room-form";
import { requireRole } from "@/lib/auth-middleware";
export default async function NewRoomPage() {
  await requireRole(["owner", "admin"]);
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-heading text-3xl font-semibold">Add a room</h1>
      <p className="mb-6 mt-2 text-sm text-muted-foreground">
        Create the room first, then upload its images.
      </p>
      <RoomForm />
    </div>
  );
}
