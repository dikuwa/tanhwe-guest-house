import { redirect } from "next/navigation";

export default function RoomTypesPage() {
  redirect("/admin/rooms/manage?tab=types");
}
