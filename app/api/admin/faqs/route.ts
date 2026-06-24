import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { authorizeRequest } from "@/lib/auth-middleware";
import { getDb } from "@/lib/db";
import { activityLogs, faqs } from "@/lib/db/schema";

const faqInput = z.object({
  question: z.string().trim().min(3).max(300),
  answer: z.string().trim().min(3).max(3000),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
  active: z.boolean().default(true),
});

export async function POST(request: NextRequest) {
  const session = await authorizeRequest(request.headers, ["owner", "admin"]);
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = faqInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "Please check the FAQ details" }, { status: 400 });
  const id = crypto.randomUUID();
  await getDb().transaction(async (tx) => {
    await tx.insert(faqs).values({ id, ...parsed.data });
    await tx.insert(activityLogs).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      action: "created",
      entity: "faq",
      entityId: id,
      details: parsed.data.question,
    });
  });
  return NextResponse.json({ id }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const session = await authorizeRequest(request.headers, ["owner", "admin"]);
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await request.json().catch(() => null);
  const { id, ...data } = body ?? {};
  if (!id) return NextResponse.json({ error: "FAQ ID required" }, { status: 400 });
  const parsed = faqInput.safeParse(data);
  if (!parsed.success)
    return NextResponse.json({ error: "Please check the FAQ details" }, { status: 400 });
  const [existing] = await getDb().select({ id: faqs.id }).from(faqs).where(eq(faqs.id, id));
  if (!existing) return NextResponse.json({ error: "FAQ not found" }, { status: 404 });
  await getDb().transaction(async (tx) => {
    await tx.update(faqs).set({ ...parsed.data, updatedAt: new Date() }).where(eq(faqs.id, id));
    await tx.insert(activityLogs).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      action: "updated",
      entity: "faq",
      entityId: id,
      details: parsed.data.question,
    });
  });
  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const session = await authorizeRequest(request.headers, ["owner", "admin"]);
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await request.json().catch(() => ({}));
  if (!id) return NextResponse.json({ error: "FAQ ID required" }, { status: 400 });
  const [existing] = await getDb().select({ id: faqs.id, question: faqs.question }).from(faqs).where(eq(faqs.id, id));
  if (!existing) return NextResponse.json({ error: "FAQ not found" }, { status: 404 });
  await getDb().transaction(async (tx) => {
    await tx.delete(faqs).where(eq(faqs.id, id));
    await tx.insert(activityLogs).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      action: "deleted",
      entity: "faq",
      entityId: id,
      details: existing.question,
    });
  });
  return NextResponse.json({ success: true });
}
