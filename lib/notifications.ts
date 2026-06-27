import "server-only";

import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { getDb } from "./db";
import { notifications, users } from "./db/schema";

type NotificationInput = {
  userId: string;
  type: string;
  title: string;
  description?: string;
  bookingId?: string;
  link?: string;
  actorId?: string;
};

/** Create a notification for a specific user */
export async function createNotification(input: NotificationInput) {
  await getDb().insert(notifications).values({
    id: crypto.randomUUID(),
    userId: input.userId,
    type: input.type,
    title: input.title,
    description: input.description ?? null,
    bookingId: input.bookingId ?? null,
    link: input.link ?? null,
    actorId: input.actorId ?? null,
  });
}

/** Create notifications for all users with a given role */
export async function notifyRole(
  role: "owner" | "admin" | "staff",
  input: Omit<NotificationInput, "userId">
) {
  const targets = await getDb()
    .select({ id: users.id })
    .from(users)
    .where(eq(users.role, role));
  for (const target of targets) {
    await createNotification({ ...input, userId: target.id });
  }
}

/** Create notifications for both owner and admin roles */
export async function notifyOps(input: Omit<NotificationInput, "userId">) {
  const targets = await getDb()
    .select({ id: users.id })
    .from(users)
    .where(sql`${users.role} in ('owner', 'admin')`);
  for (const target of targets) {
    await createNotification({ ...input, userId: target.id });
  }
}

/** Get unread notification count for a user */
export async function getUnreadCount(userId: string): Promise<number> {
  const [row] = await getDb()
    .select({ count: sql<number>`count(*)::int` })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
  return row.count;
}

/** Get recent notifications for a user */
export async function getNotifications(
  userId: string,
  limit = 20
) {
  return getDb()
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

/** Mark a single notification as read */
export async function markAsRead(notificationId: string, userId: string) {
  await getDb()
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)));
}

/** Mark all notifications as read for a user */
export async function markAllAsRead(userId: string) {
  await getDb()
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
}

/** Delete all notifications for a user */
export async function clearAll(userId: string) {
  await getDb()
    .delete(notifications)
    .where(eq(notifications.userId, userId));
}
