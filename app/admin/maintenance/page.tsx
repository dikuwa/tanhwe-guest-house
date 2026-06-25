import { eq, ilike, or, sql } from "drizzle-orm";
import { requireRole } from "@/lib/auth-middleware";
import { getDb } from "@/lib/db";
import { activityLogs, bookings, customers, documents, followUps, payments, reminderLogs } from "@/lib/db/schema";
import { MaintenanceClient } from "./maintenance-client";

export const dynamic = "force-dynamic";

async function getStats() {
  const db = getDb();

  const [testCustomers] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(customers)
    .where(
      or(
        ilike(customers.fullName, "%test%"),
        ilike(customers.fullName, "%demo%"),
        ilike(customers.notes ?? sql`''`, "%test%")
      )
    );

  const [testBookings] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(bookings)
    .where(
      or(
        ilike(bookings.notes ?? sql`''`, "%test%"),
        ilike(bookings.notes ?? sql`''`, "%demo%")
      )
    );

  const [orphanFollowups] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(followUps)
    .where(
      sql`${followUps.bookingId} is not null and not exists (select 1 from ${bookings} where ${bookings.id} = ${followUps.bookingId})`
    );

  const [totalCustomers] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(customers);

  const [totalBookings] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(bookings);

  const [totalPayments] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(payments);

  const [totalDocuments] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(documents);

  const [totalFollowups] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(followUps);

  const [totalReminders] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(reminderLogs);

  const [totalActivityLogs] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(activityLogs);

  return {
    testCustomers: testCustomers.count,
    testBookings: testBookings.count,
    orphanFollowups: orphanFollowups.count,
    totalCustomers: totalCustomers.count,
    totalBookings: totalBookings.count,
    totalPayments: totalPayments.count,
    totalDocuments: totalDocuments.count,
    totalFollowups: totalFollowups.count,
    totalReminders: totalReminders.count,
    totalActivityLogs: totalActivityLogs.count,
  };
}

export default async function AdminMaintenance() {
  await requireRole(["owner"]);
  const stats = await getStats();

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wider text-destructive">Danger Zone</p>
        <h1 className="mt-1 font-heading text-2xl font-bold text-neutral-800">
          Data Maintenance
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Owner-only tools to clean up test data and reset the system. These actions are irreversible.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total customers" count={stats.totalCustomers} />
        <StatCard label="Total bookings" count={stats.totalBookings} />
        <StatCard label="Total payments" count={stats.totalPayments} />
        <StatCard label="Total documents" count={stats.totalDocuments} />
        <StatCard label="Total follow-ups" count={stats.totalFollowups} />
        <StatCard label="Reminder logs" count={stats.totalReminders} />
        <StatCard label="Activity logs" count={stats.totalActivityLogs} />
        <StatCard label="Orphaned follow-ups" count={stats.orphanFollowups} warn />
      </div>

      <MaintenanceClient stats={stats} />
    </div>
  );
}

function StatCard({ label, count, warn }: { label: string; count: number; warn?: boolean }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-xs">
      <p className="text-xs text-neutral-500">{label}</p>
      <p className={`mt-0.5 text-xl font-bold tabular-nums ${warn && count > 0 ? "text-amber-600" : "text-neutral-800"}`}>
        {count}
      </p>
    </div>
  );
}
