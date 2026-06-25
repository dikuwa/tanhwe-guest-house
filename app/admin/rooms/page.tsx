import { requireRole } from "@/lib/auth-middleware";
import { getAdminRooms } from "@/lib/admin-data";
import { RoomsTable } from "@/components/admin/rooms-table";

export default async function AdminRooms() {
  await requireRole(["owner", "admin"]);
  const rooms = await getAdminRooms();
  return <RoomsTable initial={rooms} />;
}
