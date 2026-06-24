import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { authorizeRequest } from "@/lib/auth-middleware";
import { getDb } from "@/lib/db";
import { activityLogs, testimonials } from "@/lib/db/schema";

const testimonialInput = z.object({
  guestName: z.string().trim().min(2).max(100),
  guestType: z.string().trim().min(2).max(100),
  guestImage: z.union([z.string().trim().max(500), z.literal("")]).optional(),
  text: z.string().trim().min(10).max(2000),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
  featured: z.boolean().default(false),
  active: z.boolean().default(true),
});

export async function POST(request: NextRequest) {
  const session = await authorizeRequest(request.headers, ["owner", "admin"]);
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = testimonialInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "Please check the testimonial details" }, { status: 400 });
  const id = crypto.randomUUID();
  await getDb().transaction(async (tx) => {
    await tx.insert(testimonials).values({ id, ...parsed.data, guestImage: parsed.data.guestImage || null });
    await tx.insert(activityLogs).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      action: "created",
      entity: "testimonial",
      entityId: id,
      details: parsed.data.guestName,
    });
  });
  return NextResponse.json({ id }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const session = await authorizeRequest(request.headers, ["owner", "admin"]);
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await request.json().catch(() => null);
  const { id, ...data } = body ?? {};
  if (!id) return NextResponse.json({ error: "Testimonial ID required" }, { status: 400 });
  const parsed = testimonialInput.safeParse(data);
  if (!parsed.success)
    return NextResponse.json({ error: "Please check the testimonial details" }, { status: 400 });
  const [existing] = await getDb().select({ id: testimonials.id }).from(testimonials).where(eq(testimonials.id, id));
  if (!existing) return NextResponse.json({ error: "Testimonial not found" }, { status: 404 });
  await getDb().transaction(async (tx) => {
    await tx
      .update(testimonials)
      .set({ ...parsed.data, guestImage: parsed.data.guestImage || null, updatedAt: new Date() })
      .where(eq(testimonials.id, id));
    await tx.insert(activityLogs).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      action: "updated",
      entity: "testimonial",
      entityId: id,
      details: parsed.data.guestName,
    });
  });
  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const session = await authorizeRequest(request.headers, ["owner", "admin"]);
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await request.json().catch(() => ({}));
  if (!id) return NextResponse.json({ error: "Testimonial ID required" }, { status: 400 });
  const [existing] = await getDb()
    .select({ id: testimonials.id, guestName: testimonials.guestName })
    .from(testimonials)
    .where(eq(testimonials.id, id));
  if (!existing) return NextResponse.json({ error: "Testimonial not found" }, { status: 404 });
  await getDb().transaction(async (tx) => {
    await tx.delete(testimonials).where(eq(testimonials.id, id));
    await tx.insert(activityLogs).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      action: "deleted",
      entity: "testimonial",
      entityId: id,
      details: existing.guestName,
    });
  });
  return NextResponse.json({ success: true });
}
