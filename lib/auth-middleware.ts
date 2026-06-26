import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getAuth, roles, type Role } from "./auth";
import { getDb } from "./db";
import { users } from "./db/schema";

function isRole(value: unknown): value is Role {
  return typeof value === "string" && roles.includes(value as Role);
}

function isActiveUser(user: { status: string | null; deletedAt: Date | null } | undefined): boolean {
  return !!user && user.status === "active" && !user.deletedAt;
}

export async function getCurrentSession() {
  try {
    return await getAuth().api.getSession({ headers: await headers() });
  } catch {
    return null;
  }
}

async function getUserStatus(userId: string): Promise<{ status: string | null; deletedAt: Date | null } | undefined> {
  try {
    const result = await getDb().query.users.findFirst({
      where: eq(users.id, userId),
      columns: { status: true, deletedAt: true },
    });
    return result ?? undefined;
  } catch {
    return undefined;
  }
}

export async function requireAuth() {
  try {
    const session = await getCurrentSession();
    if (!session || !isRole(session.user.role)) redirect("/login");
    const dbUser = await getUserStatus(session.user.id);
    if (dbUser && !isActiveUser(dbUser)) redirect("/login");
    return session;
  } catch {
    redirect("/login");
  }
}

export async function requireRole(allowedRoles: readonly Role[]) {
  const session = await requireAuth();
  if (!allowedRoles.includes(session.user.role as Role)) redirect("/admin");
  return session;
}

export async function authorizeRequest(requestHeaders: Headers, allowedRoles: readonly Role[]) {
  try {
    const session = await getAuth().api.getSession({ headers: requestHeaders });
    if (!session || !isRole(session.user.role) || !allowedRoles.includes(session.user.role)) {
      return null;
    }
    const dbUser = await getUserStatus(session.user.id);
    if (dbUser && !isActiveUser(dbUser)) return null;
    return session;
  } catch {
    return null;
  }
}
