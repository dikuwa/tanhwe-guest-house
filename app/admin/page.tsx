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
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">Dashboard</p>
          <h1 className="mt-1 font-heading text-2xl font-bold text-neutral-800">
            Good day, {session.user.name.split(" ")[0]}
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Here&rsquo;s what needs attention today.
          </p>
        </div>
        <Button render={<Link href="/admin/bookings/new" />}>New booking</Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-xl border border-neutral-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <p className="text-sm text-neutral-500">{metric.label}</p>
              <metric.icon className="size-4 text-neutral-400" />
            </div>
            <p className="mt-2 text-2xl font-bold tabular-nums text-neutral-800">{metric.value}</p>
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
        <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white shadow-xs">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-neutral-100 bg-neutral-50 text-xs font-semibold uppercase tracking-wider text-neutral-500">
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
                <tr key={row.id} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50">
                  <td className="px-4 py-3 font-medium text-neutral-800">{row.bookingNumber}</td>
                  <td className="px-4 py-3 text-neutral-700">{row.fullName}</td>
                  <td className="px-4 py-3 text-neutral-600">{row.checkIn.toLocaleDateString("en-NA")}</td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={statusVariant[row.status] ?? "outline"}
                      className="capitalize"
                    >
                      {row.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-neutral-700">{money.format(row.total)}</td>
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
