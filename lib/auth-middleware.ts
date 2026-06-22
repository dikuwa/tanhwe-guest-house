import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuth, roles, type Role } from "./auth";

function isRole(value: unknown): value is Role {
  return typeof value === "string" && roles.includes(value as Role);
}

export async function getCurrentSession() {
  return getAuth().api.getSession({ headers: await headers() });
}

export async function requireAuth() {
  const session = await getCurrentSession();
  if (!session || !isRole(session.user.role)) redirect("/login");
  return session;
}

export async function requireRole(allowedRoles: readonly Role[]) {
  const session = await requireAuth();
  if (!allowedRoles.includes(session.user.role as Role)) redirect("/admin");
  return session;
}

export async function authorizeRequest(requestHeaders: Headers, allowedRoles: readonly Role[]) {
  const session = await getAuth().api.getSession({ headers: requestHeaders });
  if (!session || !isRole(session.user.role) || !allowedRoles.includes(session.user.role)) {
    return null;
  }
  return session;
}
