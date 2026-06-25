import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authorizeRequest } from "@/lib/auth-middleware";
import { getDb } from "@/lib/db";
import { activityLogs, users } from "@/lib/db/schema";
import { getResend } from "@/lib/resend";

const escapeHtml = (value: string) =>
  value.replace(/[&<>'"]/g, (character) => {
    const values: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;",
    };
    return values[character];
  });

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await authorizeRequest(request.headers, ["owner"]);
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await request.json().catch(() => null);
  const roleParsed = z
    .object({ role: z.enum(["owner", "admin", "staff"]) })
    .safeParse(body);
  const imageParsed = z
    .object({ image: z.union([z.string(), z.null()]) })
    .safeParse(body);

  if (!roleParsed.success && !imageParsed.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const { id } = await params;
  if (roleParsed.success) {
    if (id === session.user.id && roleParsed.data.role !== "owner") {
      return NextResponse.json(
        { error: "You cannot remove your own owner access" },
        { status: 409 }
      );
    }
    await getDb().transaction(async (tx) => {
      await tx
        .update(users)
        .set({ role: roleParsed.data.role, updatedAt: new Date() })
        .where(eq(users.id, id));
      await tx.insert(activityLogs).values({
        id: crypto.randomUUID(),
        userId: session.user.id,
        action: "role_updated",
        entity: "user",
        entityId: id,
        details: roleParsed.data.role,
      });
    });
  } else if (imageParsed.success) {
    await getDb()
      .update(users)
      .set({
        image: imageParsed.data.image || null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id));
  }
  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await authorizeRequest(request.headers, ["owner"]);
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  if (id === session.user.id) {
    return NextResponse.json(
      { error: "You cannot delete your own account" },
      { status: 409 }
    );
  }

  const db = getDb();
  const user = await db.query.users.findFirst({ where: eq(users.id, id) });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  await db.transaction(async (tx) => {
    await tx.delete(users).where(eq(users.id, id));
    await tx.insert(activityLogs).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      action: "user_deleted",
      entity: "user",
      entityId: id,
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
  const session = await authorizeRequest(request.headers, ["owner"]);
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => null);
  const parsed = sendCredentialsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { id } = await params;
  const db = getDb();
  const user = await db.query.users.findFirst({ where: eq(users.id, id) });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { method, password } = parsed.data;

  if (method === "email") {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
    const from = process.env.RESEND_FROM_EMAIL ?? "";
    if (!siteUrl || !from) {
      return NextResponse.json({ error: "Email delivery is not configured" }, { status: 503 });
    }

    const loginUrl = `${siteUrl}/login`;
    const result = await getResend().emails.send({
      from,
      to: user.email,
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
      id: crypto.randomUUID(),
      userId: session.user.id,
      action: "credentials_emailed",
      entity: "user",
      entityId: id,
      details: user.email,
    });
  }

  return NextResponse.json({ success: true });
}
