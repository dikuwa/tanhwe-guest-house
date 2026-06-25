import { eq, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authorizeRequest } from "@/lib/auth-middleware";
import { getDb } from "@/lib/db";
import { sessions, accounts, activityLogs, users } from "@/lib/db/schema";
import { getResend } from "@/lib/resend";
import { canManageUser, getRoleDefaults } from "@/lib/permissions";
import { hashPassword } from "better-auth/crypto";

const escapeHtml = (value: string) =>
  value.replace(/[&<>'"]/g, (character) => {
    const values: Record<string, string> = {
      "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
    };
    return values[character];
  });

const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  role: z.enum(["owner", "admin", "staff"]).optional(),
  jobTitle: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  mustChangePassword: z.boolean().optional(),
  permissionGrants: z.array(z.string()).optional(),
  permissionRestrictions: z.array(z.string()).optional(),
  password: z.string().min(8).optional(),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await authorizeRequest(request.headers, ["owner", "admin"]);
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const db = getDb();

  const user = await db.query.users.findFirst({ where: eq(users.id, id) });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (user.deletedAt) return NextResponse.json({ error: "User is deleted" }, { status: 410 });

  if (!canManageUser(session.user.role, session.user.id, user.role, id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = updateUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body", details: parsed.error.flatten() }, { status: 400 });
  }

  const { name, email, role, jobTitle, phone, mustChangePassword, permissionGrants, permissionRestrictions, password } = parsed.data;

  if (email && email.toLowerCase() !== user.email.toLowerCase()) {
    const existing = await db.select().from(users).where(sql`lower(${users.email}) = lower(${email}) AND ${users.id} != ${id}`).limit(1);
    if (existing.length > 0) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }
  }

  if (role && role !== user.role) {
    if (id === session.user.id && role !== "owner" && user.role === "owner") {
      return NextResponse.json({ error: "You cannot remove your own owner role" }, { status: 409 });
    }
    if (user.role === "owner" && session.user.role !== "owner") {
      return NextResponse.json({ error: "Only owners can change another owner's role" }, { status: 403 });
    }
    if (role === "owner" && session.user.role !== "owner") {
      return NextResponse.json({ error: "Only owners can assign the owner role" }, { status: 403 });
    }
    const activeOwnerCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(sql`${users.role} = 'owner' AND ${users.status} = 'active' AND ${users.id} != ${id} AND ${users.deletedAt} IS NULL`);
    if (Number(activeOwnerCount[0].count) === 0) {
      return NextResponse.json({ error: "Cannot change role of the last active owner" }, { status: 409 });
    }
  }

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (name !== undefined) updates.name = name;
  if (email !== undefined) updates.email = email;
  if (role !== undefined) updates.role = role;
  if (jobTitle !== undefined) updates.jobTitle = jobTitle;
  if (phone !== undefined) updates.phone = phone;
  if (mustChangePassword !== undefined) updates.mustChangePassword = mustChangePassword;

  let newPasswordHash: string | null = null;
  if (password) {
    newPasswordHash = await hashPassword(password);
  }

  if (permissionGrants !== undefined || permissionRestrictions !== undefined) {
    if (session.user.role !== "owner") {
      return NextResponse.json({ error: "Only owners can manage permissions" }, { status: 403 });
    }
    const effectiveRole = (role || user.role) as "owner" | "admin" | "staff";
    const grants = permissionGrants !== undefined
      ? [...new Set([...getRoleDefaults(effectiveRole), ...permissionGrants])]
      : undefined;
    const restrictions = permissionRestrictions !== undefined
      ? [...new Set(permissionRestrictions)]
      : undefined;
    if (grants !== undefined) updates.permissionGrants = grants;
    if (restrictions !== undefined) updates.permissionRestrictions = restrictions;
  }

  await db.transaction(async (tx) => {
    await tx.update(users).set(updates).where(eq(users.id, id));

    if (newPasswordHash) {
      const existingAccount = await tx.select().from(accounts).where(sql`${accounts.userId} = ${id} AND ${accounts.providerId} = 'credential'`).limit(1);
      if (existingAccount.length > 0) {
        await tx.update(accounts).set({ password: newPasswordHash, updatedAt: new Date() }).where(eq(accounts.id, existingAccount[0].id));
      } else {
        await tx.insert(accounts).values({
          id: crypto.randomUUID(), userId: id, providerId: "credential",
          accountId: id, password: newPasswordHash, createdAt: new Date(), updatedAt: new Date(),
        });
      }
    }

    const changes = Object.keys(updates).filter(k => k !== "updatedAt");
    if (changes.length > 0) {
      await tx.insert(activityLogs).values({
        id: crypto.randomUUID(), userId: session.user.id,
        action: "user_updated", entity: "user", entityId: id,
        details: changes.join(", "),
      });
    }
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await authorizeRequest(request.headers, ["owner"]);
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const db = getDb();

  if (id === session.user.id) {
    return NextResponse.json({ error: "You cannot delete your own account" }, { status: 409 });
  }

  const user = await db.query.users.findFirst({ where: eq(users.id, id) });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (user.deletedAt) return NextResponse.json({ error: "User is already deleted" }, { status: 410 });

  if (user.role === "owner") {
    const activeOwnerCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(sql`${users.role} = 'owner' AND ${users.status} = 'active' AND ${users.id} != ${id} AND ${users.deletedAt} IS NULL`);
    if (Number(activeOwnerCount[0].count) === 0) {
      return NextResponse.json({ error: "Cannot delete the last active owner" }, { status: 409 });
    }
  }

  await db.transaction(async (tx) => {
    await tx.update(users).set({
      deletedAt: new Date(), status: "revoked", updatedAt: new Date(),
    }).where(eq(users.id, id));
    await tx.delete(sessions).where(eq(sessions.userId, id));
    await tx.insert(activityLogs).values({
      id: crypto.randomUUID(), userId: session.user.id,
      action: "user_deleted", entity: "user", entityId: id,
      details: `${user.name} (${user.email})`,
    });
  });

  return NextResponse.json({ success: true });
}

const sendCredentialsSchema = z.object({
  method: z.enum(["email"]),
  password: z.string().min(1),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await authorizeRequest(request.headers, ["owner", "admin"]);
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();

  const credsParsed = sendCredentialsSchema.safeParse(body);
  if (credsParsed.success) {
    const { id } = await params;
    const db = getDb();
    const user = await db.query.users.findFirst({ where: eq(users.id, id) });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    if (user.deletedAt) return NextResponse.json({ error: "User is deleted" }, { status: 410 });
    if (!canManageUser(session.user.role, session.user.id, user.role, id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { method, password } = credsParsed.data;

    if (method === "email") {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
      const from = process.env.RESEND_FROM_EMAIL ?? "";
      if (!siteUrl || !from) {
        return NextResponse.json({ error: "Email delivery is not configured" }, { status: 503 });
      }

      const loginUrl = `${siteUrl}/login`;
      const result = await getResend().emails.send({
        from, to: user.email,
        subject: `Welcome to Tanhwe Guest House — your account has been created`,
        html: `<div style="font-family:Arial,sans-serif;color:#172033;line-height:1.6">
<h1 style="font-size:22px">Tanhwe Guest House</h1>
<p>Hello ${escapeHtml(user.name)},</p>
<p>An administrator has created an account for you at Tanhwe Guest House.</p>
<p style="font-size:15px"><strong>Email:</strong> ${escapeHtml(user.email)}<br>
<strong>Temporary password:</strong> ${escapeHtml(password)}</p>
<p><a href="${escapeHtml(loginUrl)}" style="display:inline-block;background:#0D5CA8;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600">Log in now</a></p>
<p style="color:#667085;font-size:13px">For security, please change your password after your first login.</p>
<p>Kind regards,<br><strong>Tanhwe Guest House</strong></p>
</div>`,
      });

      if (result.error) {
        console.error(JSON.stringify({ level: "error", message: "Credential email failed", userId: id }));
        return NextResponse.json({ error: "Email could not be sent" }, { status: 502 });
      }

      await db.insert(activityLogs).values({
        id: crypto.randomUUID(), userId: session.user.id,
        action: "credentials_emailed", entity: "user", entityId: id, details: user.email,
      });
    }

    return NextResponse.json({ success: true });
  }

  const resendInviteParsed = z.object({
    action: z.literal("resend_invitation"),
  }).safeParse(body);

  if (resendInviteParsed.success) {
    const { id } = await params;
    const db = getDb();
    const user = await db.query.users.findFirst({ where: eq(users.id, id) });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    if (!canManageUser(session.user.role, session.user.id, user.role, id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (user.status !== "invited") {
      return NextResponse.json({ error: "User is not in invited status" }, { status: 409 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
    const from = process.env.RESEND_FROM_EMAIL ?? "";
    if (!siteUrl || !from) {
      return NextResponse.json({ error: "Email delivery is not configured" }, { status: 503 });
    }

    const invitationToken = user.invitationToken || crypto.randomUUID();
    const inviteUrl = `${siteUrl}/accept-invite?token=${invitationToken}`;
    const result = await getResend().emails.send({
      from, to: user.email,
      subject: `Reminder: You're invited to join Tanhwe Guest House`,
      html: `<div style="font-family:Arial,sans-serif;color:#172033;line-height:1.6">
<h1 style="font-size:22px">Tanhwe Guest House</h1>
<p>Hello ${escapeHtml(user.name)},</p>
<p>This is a reminder that you've been invited to join the Tanhwe Guest House team.</p>
<p><a href="${escapeHtml(inviteUrl)}" style="display:inline-block;background:#0D5CA8;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600">Accept invitation</a></p>
<p style="color:#667085;font-size:13px">This invitation expires in 7 days.</p>
<p>Kind regards,<br><strong>Tanhwe Guest House</strong></p>
</div>`,
    });

    if (result.error) {
      console.error(JSON.stringify({ level: "error", message: "Invitation resend email failed", userId: id }));
      return NextResponse.json({ error: "Email could not be sent" }, { status: 502 });
    }

    if (!user.invitationToken) {
      await db.update(users).set({
        invitationToken, invitedAt: new Date(),
        invitationExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      }).where(eq(users.id, id));
    }

    await db.insert(activityLogs).values({
      id: crypto.randomUUID(), userId: session.user.id,
      action: "invitation_resent", entity: "user", entityId: id, details: user.email,
    });

    return NextResponse.json({ success: true });
  }

  const statusActionParsed = z.object({
    action: z.enum(["enable", "disable", "revoke", "restore", "unlock"]),
    reason: z.string().optional(),
  }).safeParse(body);

  if (statusActionParsed.success) {
    const { id } = await params;
    const db = getDb();
    const user = await db.query.users.findFirst({ where: eq(users.id, id) });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    if (user.deletedAt) return NextResponse.json({ error: "User is deleted" }, { status: 410 });
    if (!canManageUser(session.user.role, session.user.id, user.role, id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { action, reason } = statusActionParsed.data;

    switch (action) {
      case "enable": {
        if (user.status !== "disabled") {
          return NextResponse.json({ error: "User is not disabled" }, { status: 409 });
        }
        await db.update(users).set({
          status: "active", disabledAt: null, disabledBy: null, disabledReason: null,
          updatedAt: new Date(),
        }).where(eq(users.id, id));
        await db.insert(activityLogs).values({
          id: crypto.randomUUID(), userId: session.user.id,
          action: "user_enabled", entity: "user", entityId: id,
          details: reason || "",
        });
        break;
      }
      case "disable": {
        if (user.status !== "active") {
          return NextResponse.json({ error: "Only active users can be disabled" }, { status: 409 });
        }
        if (user.role === "owner") {
          const activeOwnerCount = await db
            .select({ count: sql<number>`count(*)` })
            .from(users)
            .where(sql`${users.role} = 'owner' AND ${users.status} = 'active' AND ${users.id} != ${id} AND ${users.deletedAt} IS NULL`);
          if (Number(activeOwnerCount[0].count) === 0) {
            return NextResponse.json({ error: "Cannot disable the last active owner" }, { status: 409 });
          }
        }
        await db.transaction(async (tx) => {
          await tx.update(users).set({
            status: "disabled", disabledAt: new Date(), disabledBy: session.user.id,
            disabledReason: reason || null, updatedAt: new Date(),
          }).where(eq(users.id, id));
          await tx.delete(sessions).where(eq(sessions.userId, id));
        });
        await db.insert(activityLogs).values({
          id: crypto.randomUUID(), userId: session.user.id,
          action: "user_disabled", entity: "user", entityId: id,
          details: reason || "",
        });
        break;
      }
      case "revoke": {
        if (user.status !== "active" && user.status !== "disabled") {
          return NextResponse.json({ error: "Only active or disabled users can be revoked" }, { status: 409 });
        }
        if (user.role === "owner") {
          const activeOwnerCount = await db
            .select({ count: sql<number>`count(*)` })
            .from(users)
            .where(sql`${users.role} = 'owner' AND ${users.status} = 'active' AND ${users.id} != ${id} AND ${users.deletedAt} IS NULL`);
          if (Number(activeOwnerCount[0].count) === 0) {
            return NextResponse.json({ error: "Cannot revoke the last active owner" }, { status: 409 });
          }
        }
        await db.transaction(async (tx) => {
          await tx.update(users).set({
            status: "revoked", revokedAt: new Date(), revokedBy: session.user.id,
            revokedReason: reason || null, updatedAt: new Date(),
          }).where(eq(users.id, id));
          await tx.delete(sessions).where(eq(sessions.userId, id));
        });
        await db.insert(activityLogs).values({
          id: crypto.randomUUID(), userId: session.user.id,
          action: "user_revoked", entity: "user", entityId: id,
          details: reason || "",
        });
        break;
      }
      case "restore": {
        if (user.status !== "revoked") {
          return NextResponse.json({ error: "User is not revoked" }, { status: 409 });
        }
        await db.update(users).set({
          status: "active", revokedAt: null, revokedBy: null, revokedReason: null,
          updatedAt: new Date(),
        }).where(eq(users.id, id));
        await db.insert(activityLogs).values({
          id: crypto.randomUUID(), userId: session.user.id,
          action: "user_restored", entity: "user", entityId: id,
          details: reason || "",
        });
        break;
      }
      case "unlock": {
        if (user.status !== "locked") {
          return NextResponse.json({ error: "User is not locked" }, { status: 409 });
        }
        await db.update(users).set({
          status: "active", lockedAt: null, lockedReason: null, updatedAt: new Date(),
        }).where(eq(users.id, id));
        await db.insert(activityLogs).values({
          id: crypto.randomUUID(), userId: session.user.id,
          action: "user_unlocked", entity: "user", entityId: id,
          details: reason || "",
        });
        break;
      }
    }

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid request" }, { status: 400 });
}
