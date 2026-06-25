import { eq, ilike, or, sql } from "drizzle-orm";
import { requireRole } from "@/lib/auth-middleware";
import { getDb } from "@/lib/db";
import { bookings, customers, followUps } from "@/lib/db/schema";
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
        ilike(customers.notes, "%test%")
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

  return {
    testCustomers: testCustomers.count,
    testBookings: testBookings.count,
    orphanFollowups: orphanFollowups.count,
    totalCustomers: totalCustomers.count,
    totalBookings: totalBookings.count,
  };
}

export default async function AdminMaintenance() {
  await requireRole(["owner"]);
  const stats = await getStats();

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">Maintenance</p>
        <h1 className="mt-1 font-heading text-2xl font-bold text-neutral-800">
          Data Maintenance
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Owner-only tools to clean up test data and manage database records.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-xs">
          <p className="text-sm text-neutral-500">Total customers</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-neutral-800">
            {stats.totalCustomers}
          </p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-xs">
          <p className="text-sm text-neutral-500">Total bookings</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-neutral-800">
            {stats.totalBookings}
          </p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-xs">
          <p className="text-sm text-neutral-500">Orphaned follow-ups</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-neutral-800">
            {stats.orphanFollowups}
          </p>
        </div>
      </div>

      <MaintenanceClient stats={stats} />
    </div>
  );
}
