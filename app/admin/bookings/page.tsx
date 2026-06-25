import { getAdminBookings } from "@/lib/admin-data";
import { requireRole } from "@/lib/auth-middleware";
import { BookingsTable } from "@/components/admin/bookings-table";

export default async function AdminBookings() {
  const session = await requireRole(["owner", "admin", "staff"]);
  const bookings = await getAdminBookings();
  return <BookingsTable initial={bookings} staffView={session.user.role === "staff"} />;
}
