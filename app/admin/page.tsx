import Link from "next/link";
import { ArrowRight, BedDouble, BookOpen, CalendarDays } from "lucide-react";
import { requireRole } from "@/lib/auth-middleware";
import { getDashboardData } from "@/lib/admin-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const money = new Intl.NumberFormat("en-NA", {
  style: "currency",
  currency: "NAD",
  maximumFractionDigits: 0,
});
export default async function AdminDashboard() {
  const session = await requireRole(["owner", "admin", "staff"]);
  const data = await getDashboardData();
  const metrics = [
    { label: "Active room types", value: data.activeRooms, icon: BedDouble },
    { label: "Pending requests", value: data.pendingBookings, icon: BookOpen },
    { label: "Upcoming bookings", value: data.upcomingBookings, icon: CalendarDays },
  ];
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-primary">Operations overview</p>
          <h1 className="mt-1 font-heading text-3xl font-semibold">
            Good day, {session.user.name.split(" ")[0]}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Here is what needs attention at Tanhwe Guest House.
          </p>
        </div>
        <Button render={<Link href="/admin/bookings/new" />}>New booking</Button>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-xl border bg-card p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{metric.label}</p>
              <metric.icon className="size-4 text-primary" />
            </div>
            <p className="mt-3 text-3xl font-semibold tabular-nums">{metric.value}</p>
          </div>
        ))}
      </div>
      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Recent bookings</h2>
            <p className="text-sm text-muted-foreground">Latest guest requests and reservations.</p>
          </div>
          <Button variant="ghost" render={<Link href="/admin/bookings" />}>
            View all <ArrowRight />
          </Button>
        </div>
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Booking</th>
                <th className="px-4 py-3">Guest</th>
                <th className="px-4 py-3">Check-in</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {data.recent.map((row) => (
                <tr key={row.id} className="border-b last:border-0">
                  <td className="px-4 py-3 font-medium">{row.bookingNumber}</td>
                  <td className="px-4 py-3">{row.fullName}</td>
                  <td className="px-4 py-3">{row.checkIn.toLocaleDateString("en-NA")}</td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary" className="capitalize">
                      {row.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{money.format(row.total)}</td>
                </tr>
              ))}
              {data.recent.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                    No bookings yet.
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
