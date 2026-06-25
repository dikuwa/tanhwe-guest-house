import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDocument } from "@/lib/admin-data";
import { authorizeRequest } from "@/lib/auth-middleware";
import { getDb } from "@/lib/db";
import { activityLogs } from "@/lib/db/schema";
import { createDocumentShareUrl } from "@/lib/document-share";
import { getDocumentSettings, getOwnerProfile } from "@/lib/admin-data";
import { getResend } from "@/lib/resend";

const input = z.object({
  email: z.union([z.string().trim().email(), z.literal("")]).optional(),
});

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

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await authorizeRequest(request.headers, ["owner", "admin"]);
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = input.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
  }

  const { id } = await params;
  const document = await getDocument(id);
  if (!document) return NextResponse.json({ error: "Document not found" }, { status: 404 });
  const recipient = parsed.data.email || document.customerEmail;
  if (!recipient) {
    return NextResponse.json({ error: "This customer has no email address" }, { status: 409 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!siteUrl || !from) {
    return NextResponse.json({ error: "Email delivery is not configured" }, { status: 503 });
  }

  const [docSettings, owner] = await Promise.all([
    getDocumentSettings(),
    getOwnerProfile(),
  ]);
  const businessName = docSettings.businessName;
  const typeLabel = document.type.charAt(0).toUpperCase() + document.type.slice(1);
  const token = createDocumentShareUrl(document.id);
  const downloadUrl = `${siteUrl}/api/documents/${token}`;
  const result = await getResend().emails.send(
    {
      from,
      to: recipient,
      subject: `${typeLabel} ${document.number} from ${businessName}`,
      html: `<div style="font-family:Arial,sans-serif;color:#172033;line-height:1.6"><h1 style="font-size:22px">${escapeHtml(businessName)}</h1><p>Hello ${escapeHtml(document.customerName)},</p><p>Your ${escapeHtml(document.type)} <strong>${escapeHtml(document.number)}</strong> is ready.</p><p style="font-size:15px">Total: ${docSettings.currency}${document.total.toFixed(2)}</p><p><a href="${escapeHtml(downloadUrl)}" style="display:inline-block;background:#0D5CA8;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600">Download PDF</a></p><p style="color:#667085;font-size:13px">This private link expires in seven days.</p><p>Kind regards,</p><p><strong>${owner?.name ?? businessName}</strong></p></div>`,
    },
    { headers: { "Idempotency-Key": `document-${document.id}-${recipient.toLowerCase()}` } }
  );
  if (result.error) {
    console.error(
      JSON.stringify({ level: "error", message: "Document email failed", documentId: id })
    );
    return NextResponse.json({ error: "Email could not be sent" }, { status: 502 });
  }

  await getDb().insert(activityLogs).values({
    id: crypto.randomUUID(),
    userId: session.user.id,
    action: "emailed",
    entity: "document",
    entityId: id,
    details: document.number,
  });
  return NextResponse.json({ success: true });
}
