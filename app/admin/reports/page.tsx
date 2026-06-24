import { BarChart3, CalendarCheck, CalendarX, CircleDollarSign, Hotel } from "lucide-react";
import { getReports } from "@/lib/admin-data";
import { requireRole } from "@/lib/auth-middleware";
import { DateFilter } from "./date-filter";

const money = new Intl.NumberFormat("en-NA", { style: "currency", currency: "NAD" });
const dateInput = (date: Date) => date.toISOString().slice(0, 10);

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  await requireRole(["owner"]);
  const query = await searchParams;
  const today = new Date();
  const defaultFrom = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
  const defaultTo = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 0, 23, 59, 59)
  );
  const from = query.from ? new Date(`${query.from}T00:00:00Z`) : defaultFrom;
  const to = query.to ? new Date(`${query.to}T23:59:59Z`) : defaultTo;
  const data = await getReports(from, to);
  const days = Math.max(1, Math.ceil((to.getTime() - from.getTime()) / 86_400_000));
  const occupancy =
    data.activeUnits > 0
      ? Math.min(100, (data.summary.roomNights / (data.activeUnits * days)) * 100)
      : 0;
  const metrics = [
    { label: "Occupancy", value: `${occupancy.toFixed(1)}%`, icon: Hotel },
    { label: "Booked value", value: money.format(data.summary.bookedValue), icon: Hotel },
    {
      label: "Revenue received",
      value: money.format(data.summary.revenue),
      icon: CircleDollarSign,
    },
    { label: "Outstanding", value: money.format(data.summary.outstanding), icon: BarChart3 },
    { label: "Room nights", value: String(data.summary.roomNights), icon: CalendarCheck },
  ];
  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Reports</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Owner-only performance and financial reporting from live booking data.
          </p>
        </div>
        <DateFilter from={dateInput(from)} to={dateInput(to)} />
      </header>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-xl border bg-card p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{metric.label}</p>
              <metric.icon className="size-4 text-primary" />
            </div>
            <p className="mt-3 text-2xl font-semibold tabular-nums">{metric.value}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Breakdown title="Booking status" items={data.byStatus} />
        <Breakdown title="Booking sources" items={data.bySource} />
      </div>
      <section>
        <h2 className="text-lg font-semibold">Room performance</h2>
        <div className="mt-3 overflow-x-auto rounded-xl border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Room</th>
                <th className="px-4 py-3 text-right">Stays</th>
                <th className="px-4 py-3 text-right">Room nights</th>
                <th className="px-4 py-3 text-right">Booked value</th>
              </tr>
            </thead>
            <tbody>
              {data.roomPerformance.map((room) => (
                <tr key={room.room} className="border-b last:border-0">
                  <td className="px-4 py-4 font-medium">{room.room}</td>
                  <td className="px-4 py-4 text-right">{room.stays}</td>
                  <td className="px-4 py-4 text-right">{room.roomNights}</td>
                  <td className="px-4 py-4 text-right tabular-nums">{money.format(room.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <div className="grid gap-6 lg:grid-cols-2">
        <Schedule title="Upcoming arrivals" icon={CalendarCheck} rows={data.arrivals} />
        <Schedule title="Upcoming departures" icon={CalendarX} rows={data.departures} />
      </div>
    </div>
  );
}

function Breakdown({ title, items }: { title: string; items: { label: string; value: number }[] }) {
  const max = Math.max(...items.map((item) => item.value), 1);
  return (
    <section className="rounded-xl border bg-card p-5">
      <h2 className="font-semibold">{title}</h2>
      <div className="mt-5 space-y-4">
        {items.map((item) => (
          <div key={item.label}>
            <div className="mb-1 flex justify-between text-sm">
              <span className="capitalize">{item.label}</span>
              <span className="font-medium">{item.value}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-secondary"
                style={{ width: `${(item.value / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
function Schedule({
  title,
  icon: Icon,
  rows,
}: {
  title: string;
  icon: typeof CalendarCheck;
  rows: { id: string; bookingNumber: string; date: Date; guest: string }[];
}) {
  return (
    <section className="rounded-xl border bg-card p-5">
      <h2 className="flex items-center gap-2 font-semibold">
        <Icon className="size-4 text-primary" />
        {title}
      </h2>
      <div className="mt-4 divide-y">
        {rows.map((row) => (
          <div key={row.id} className="flex justify-between gap-4 py-3 text-sm">
            <div>
              <p className="font-medium">{row.guest}</p>
              <p className="text-xs text-muted-foreground">{row.bookingNumber}</p>
            </div>
            <time className="text-muted-foreground">{row.date.toLocaleDateString("en-NA")}</time>
          </div>
        ))}
        {!rows.length && (
          <p className="py-6 text-sm text-muted-foreground">Nothing scheduled in this range.</p>
        )}
      </div>
    </section>
  );
}
