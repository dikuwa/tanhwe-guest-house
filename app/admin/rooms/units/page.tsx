import { redirect } from "next/navigation";

export default function RoomUnitsPage() {
  redirect("/admin/rooms/manage?tab=units");
}
