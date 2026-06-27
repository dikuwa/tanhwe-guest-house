import Link from "next/link";
import { ArrowRight, BedDouble, BookOpen, LogIn, LogOut, WalletCards } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { requireRole } from "@/lib/auth-middleware";
import { getDashboardData } from "@/lib/admin-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const money = new Intl.NumberFormat("en-NA", {
  style: "currency",
  currency: "NAD",
  maximumFractionDigits: 0,
});

const statusVariant: Record<string, "secondary" | "outline" | "default" | "destructive"> = {
  pending: "default",
  confirmed: "secondary",
  "checked-in": "default",
  "checked-out": "default",
  cancelled: "outline",
};

export default async function AdminDashboard() {
  const session = await requireRole(["owner", "admin", "staff"]);
  const data = await getDashboardData();
  const metrics: { label: string; value: number | string; icon: LucideIcon }[] = [
    { label: "Active room types", value: data.activeRooms, icon: BedDouble },
    { label: "Pending requests", value: data.pendingBookings, icon: BookOpen },
    { label: "Check-ins next 7 days", value: data.checkIns, icon: LogIn },
    { label: "Check-outs next 7 days", value: data.checkOuts, icon: LogOut },
  ];
  if (session.user.role === "owner")
    metrics.push({
      label: "Outstanding balance",
      value: money.format(data.outstanding),
      icon: WalletCards,
    });
  return (
    <div className="space-y-8">
      <div className="admin-page-header">
        <div>
          <p className="admin-eyebrow">Dashboard</p>
          <h1 className="admin-title">
            Good day, {session.user.name.split(" ")[0]}
          </h1>
          <p className="admin-description">
            Here&rsquo;s what needs attention today.
          </p>
        </div>
        <Button render={<Link href="/admin/bookings/new" />}>New booking</Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {metrics.map((metric) => (
          <div key={metric.label} className="admin-card">
            <div className="flex items-center justify-between">
              <p className="text-sm text-neutral-500">{metric.label}</p>
              <metric.icon className="size-4 text-neutral-400" />
            </div>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-neutral-800">{metric.value}</p>
          </div>
        ))}
      </div>
      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-neutral-800">Recent bookings</h2>
            <p className="text-sm text-neutral-500">Latest guest requests and reservations.</p>
          </div>
          <Button variant="ghost" size="sm" render={<Link href="/admin/bookings" />}>
            View all <ArrowRight className="size-3.5" />
          </Button>
        </div>
        <div className="admin-panel overflow-x-auto">
          <table className="admin-table">
            <thead className="admin-table-head">
              <tr>
                <th className="px-4 py-3 font-medium">Booking</th>
                <th className="px-4 py-3 font-medium">Guest</th>
                <th className="px-4 py-3 font-medium">Check-in</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {data.recent.map((row) => (
                <tr
                  key={row.id}
                  className="admin-table-row cursor-pointer"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/bookings/${row.id}`}
                      className="block font-medium text-neutral-800 hover:text-primary"
                    >
                      {row.bookingNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-neutral-700">
                    <Link
                      href={`/admin/bookings/${row.id}`}
                      className="block hover:text-primary"
                    >
                      {row.fullName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    <Link
                      href={`/admin/bookings/${row.id}`}
                      className="block hover:text-primary"
                    >
                      {row.checkIn.toLocaleDateString("en-NA")}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={statusVariant[row.status] ?? "outline"}
                      className="capitalize"
                    >
                      {row.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-neutral-700">
                    <Link
                      href={`/admin/bookings/${row.id}`}
                      className="block hover:text-primary"
                    >
                      {money.format(row.total)}
                    </Link>
                  </td>
                </tr>
              ))}
              {data.recent.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-neutral-500">
                    No bookings yet. Create your first booking to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
