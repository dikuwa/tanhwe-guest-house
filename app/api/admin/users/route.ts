import { authorizeRequest } from "@/lib/auth-middleware";
import { getDb } from "@/lib/db";
import { accounts, activityLogs, users } from "@/lib/db/schema";
import { hashPassword } from "better-auth/crypto";
import { sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getRoleDefaults } from "@/lib/permissions";
import { getResend } from "@/lib/resend";

const escapeHtml = (value: string) =>
  value.replace(/[&<>'"]/g, (character) => {
    const values: Record<string, string> = {
      "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
    };
    return values[character];
  });

const createUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters").optional(),
  role: z.enum(["owner", "admin", "staff"]),
  jobTitle: z.string().optional(),
  phone: z.string().optional(),
  mustChangePassword: z.boolean().optional().default(true),
  permissionGrants: z.array(z.string()).optional().default([]),
  permissionRestrictions: z.array(z.string()).optional().default([]),
  sendMethod: z.enum(["email", "whatsapp", "none"]).optional().default("none"),
});

export async function POST(request: NextRequest) {
  const session = await authorizeRequest(request.headers, ["owner", "admin"]);
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await request.json();
    const parsed = createUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
    }

    const db = getDb();
    const { name, email, password, role, jobTitle, phone, mustChangePassword, permissionGrants, permissionRestrictions, sendMethod } = parsed.data;

    const existing = await db.select().from(users).where(sql`lower(${users.email}) = lower(${email})`).limit(1);
    if (existing.length > 0) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 409 });
    }

    if (session.user.role === "admin" && role !== "staff") {
      return NextResponse.json({ error: "Admin can only create staff users" }, { status: 403 });
    }

    if (session.user.role === "admin" && (permissionGrants.length > 0 || permissionRestrictions.length > 0)) {
      return NextResponse.json({ error: "Admin cannot manage permissions" }, { status: 403 });
    }

    const userId = crypto.randomUUID();
    const hashedPassword = password ? await hashPassword(password) : null;
    const defaults = getRoleDefaults(role);
    const grants = [...new Set([...defaults, ...permissionGrants])];
    const restrictions = [...new Set(permissionRestrictions)];

    const invitationToken = !password ? crypto.randomUUID() : null;
    const status = password ? "active" : "invited";

    await db.transaction(async (tx) => {
      await tx.insert(users).values({
        id: userId, name, email, emailVerified: false, role, status,
        jobTitle: jobTitle || null, phone: phone || null,
        invitationToken,
        invitedAt: invitationToken ? new Date() : null,
        invitationExpiresAt: invitationToken ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : null,
        permissionGrants: grants, permissionRestrictions: restrictions,
      });

      if (hashedPassword) {
        await tx.insert(accounts).values({
          id: crypto.randomUUID(), userId, providerId: "credential",
          accountId: userId, password: hashedPassword,
          createdAt: new Date(), updatedAt: new Date(),
        });
      }

      await tx.insert(activityLogs).values({
        id: crypto.randomUUID(), userId: session.user.id,
        action: "user_created", entity: "user", entityId: userId,
        details: `${name} (${role})${status === "invited" ? " - invited" : ""}${mustChangePassword ? " - must change password" : ""}`,
      });
    });

    if (sendMethod === "email" && password) {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
      const from = process.env.RESEND_FROM_EMAIL ?? "";
      if (siteUrl && from) {
        const loginUrl = `${siteUrl}/login`;
        await getResend().emails.send({
          from, to: email,
          subject: `Welcome to Tanhwe Guest House — your account has been created`,
          html: `<div style="font-family:Arial,sans-serif;color:#172033;line-height:1.6">
<h1 style="font-size:22px">Tanhwe Guest House</h1>
<p>Hello ${escapeHtml(name)},</p>
<p>An administrator has created an account for you at Tanhwe Guest House.</p>
<p style="font-size:15px"><strong>Email:</strong> ${escapeHtml(email)}<br>
<strong>Temporary password:</strong> ${escapeHtml(password)}</p>
<p><a href="${escapeHtml(loginUrl)}" style="display:inline-block;background:#0D5CA8;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600">Log in now</a></p>
<p style="color:#667085;font-size:13px">For security, please change your password after your first login.</p>
<p>Kind regards,<br><strong>Tanhwe Guest House</strong></p>
</div>`,
        });
        await db.insert(activityLogs).values({
          id: crypto.randomUUID(), userId: session.user.id,
          action: "credentials_emailed", entity: "user", entityId: userId, details: email,
        });
      }
    }

    if (sendMethod === "email" && !password && invitationToken) {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
      const from = process.env.RESEND_FROM_EMAIL ?? "";
      if (siteUrl && from) {
        const inviteUrl = `${siteUrl}/accept-invite?token=${invitationToken}`;
        await getResend().emails.send({
          from, to: email,
          subject: `You're invited to join Tanhwe Guest House`,
          html: `<div style="font-family:Arial,sans-serif;color:#172033;line-height:1.6">
<h1 style="font-size:22px">Tanhwe Guest House</h1>
<p>Hello ${escapeHtml(name)},</p>
<p>You've been invited to join the Tanhwe Guest House team as <strong>${escapeHtml(role)}</strong>.</p>
<p><a href="${escapeHtml(inviteUrl)}" style="display:inline-block;background:#0D5CA8;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600">Accept invitation</a></p>
<p style="color:#667085;font-size:13px">This invitation expires in 7 days.</p>
<p>Kind regards,<br><strong>Tanhwe Guest House</strong></p>
</div>`,
        });
        await db.insert(activityLogs).values({
          id: crypto.randomUUID(), userId: session.user.id,
          action: "invitation_sent", entity: "user", entityId: userId, details: email,
        });
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        id: userId, name, email, role, status, jobTitle: jobTitle || null, phone: phone || null,
      },
    });
  } catch (error) {
    console.error("Failed to create user:", error);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}
