import { ActivityLogsList } from "./activity-logs-list";
import { getDb } from "@/lib/db";
import { activityLogs, users } from "@/lib/db/schema";
import { requireRole } from "@/lib/auth-middleware";
import { desc, asc, eq, ilike, and, or, sql } from "drizzle-orm";

export default async function ActivityLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; action?: string; entity?: string; page?: string }>;
}) {
  const session = await requireRole(["owner", "admin"]);
  const query = await searchParams;
  const page = Math.max(1, Number(query.page) || 1);
  const pageSize = 50;

  const where = and(
    query.q
      ? or(
          ilike(activityLogs.details, `%${query.q}%`),
          ilike(activityLogs.entity, `%${query.q}%`)
        )
      : undefined,
    query.action ? eq(activityLogs.action, query.action) : undefined,
    query.entity ? eq(activityLogs.entity, query.entity) : undefined
  );

  const [rows, [countRow]] = await Promise.all([
    getDb()
      .select({
        id: activityLogs.id,
        action: activityLogs.action,
        entity: activityLogs.entity,
        entityId: activityLogs.entityId,
        details: activityLogs.details,
        createdAt: activityLogs.createdAt,
        userName: users.name,
        userRole: users.role,
      })
      .from(activityLogs)
      .leftJoin(users, eq(activityLogs.userId, users.id))
      .where(where)
      .orderBy(desc(activityLogs.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    getDb()
      .select({ count: sql<number>`count(*)::int` })
      .from(activityLogs)
      .where(where),
  ]);

  const total = countRow?.count ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">System</p>
        <h1 className="mt-1 font-heading text-2xl font-bold text-neutral-800">Activity Logs</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Track changes made across the system. Logs are append-only and cannot be deleted.
        </p>
      </header>

      <ActivityLogsList
        rows={rows}
        total={total}
        page={page}
        pageCount={pageCount}
        currentQuery={query}
      />
    </div>
  );
}
