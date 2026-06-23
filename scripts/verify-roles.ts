import { hashPassword } from "better-auth/crypto";
import { eq, inArray } from "drizzle-orm";
import { closeDb, getDb } from "../lib/db";
import { accounts, activityLogs, sessions, users } from "../lib/db/schema";

type Role = "admin" | "staff";

async function main() {
  const base = process.env.VERIFY_BASE_URL ?? "http://localhost:3000";
  const origin = new URL(base).origin;
  const stamp = Date.now();
  const password = `Verify-${stamp}-Access!`;
  const createdUserIds: string[] = [];

  async function createUser(role: Role) {
    const id = crypto.randomUUID();
    const email = `verify-${role}-${stamp}@example.com`;
    await getDb().transaction(async (tx) => {
      await tx.insert(users).values({
        id,
        name: `Verification ${role}`,
        email,
        emailVerified: true,
        role,
      });
      await tx.insert(accounts).values({
        id: crypto.randomUUID(),
        accountId: id,
        providerId: "credential",
        userId: id,
        password: await hashPassword(password),
      });
    });
    createdUserIds.push(id);
    return { id, email, role };
  }

  async function login(email: string) {
    const response = await fetch(`${base}/api/auth/sign-in/email`, {
      method: "POST",
      headers: { "content-type": "application/json", origin },
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) throw new Error(`Login failed for ${email} (${response.status})`);
    return response.headers
      .getSetCookie()
      .map((value) => value.split(";")[0])
      .join("; ");
  }

  async function expectPage(cookie: string, path: string, allowed: boolean) {
    const response = await fetch(`${base}${path}`, { headers: { cookie }, redirect: "manual" });
    if (allowed && response.status !== 200) {
      throw new Error(`${path} should be allowed, received ${response.status}`);
    }
    if (!allowed && (response.status !== 307 || response.headers.get("location") !== "/admin")) {
      throw new Error(`${path} should be denied, received ${response.status}`);
    }
  }

  try {
    const admin = await createUser("admin");
    const staff = await createUser("staff");
    const adminCookie = await login(admin.email);
    const staffCookie = await login(staff.email);

    for (const path of [
      "/admin",
      "/admin/rooms",
      "/admin/customers",
      "/admin/documents",
      "/admin/follow-ups",
    ]) {
      await expectPage(adminCookie, path, true);
    }
    for (const path of ["/admin/reports", "/admin/settings", "/admin/users"]) {
      await expectPage(adminCookie, path, false);
    }

    for (const path of ["/admin", "/admin/bookings", "/admin/customers", "/admin/follow-ups"]) {
      await expectPage(staffCookie, path, true);
    }
    for (const path of [
      "/admin/rooms",
      "/admin/documents",
      "/admin/reports",
      "/admin/settings",
      "/admin/users",
    ]) {
      await expectPage(staffCookie, path, false);
    }

    const staffRoomMutation = await fetch(`${base}/api/admin/rooms`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie: staffCookie, origin },
      body: "{}",
    });
    if (staffRoomMutation.status !== 403) {
      throw new Error(
        `Staff room mutation should be forbidden, received ${staffRoomMutation.status}`
      );
    }

    const staffDocumentMutation = await fetch(`${base}/api/admin/documents`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie: staffCookie, origin },
      body: "{}",
    });
    if (staffDocumentMutation.status !== 403) {
      throw new Error(
        `Staff document mutation should be forbidden, received ${staffDocumentMutation.status}`
      );
    }

    console.log("Owner/admin/staff permission verification passed.");
  } finally {
    if (createdUserIds.length) {
      await getDb().delete(activityLogs).where(inArray(activityLogs.userId, createdUserIds));
      await getDb().delete(sessions).where(inArray(sessions.userId, createdUserIds));
      await getDb().delete(accounts).where(inArray(accounts.userId, createdUserIds));
      for (const id of createdUserIds) await getDb().delete(users).where(eq(users.id, id));
    }
    await closeDb();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
