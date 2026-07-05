import { NextRequest, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { authorizeRequest } from "@/lib/auth-middleware";
import { getDb } from "@/lib/db";
import { activityLogs, folioItems } from "@/lib/db/schema";

const updateInput = z.object({
  name: z.string().trim().min(1).max(200),
  itemType: z.enum(["service", "charge", "discount"]),
  category: z.string().trim().min(1).max(100).default("Other"),
  defaultPrice: z.coerce.number().int().min(0).max(100_000_000).default(0),
  description: z.string().trim().max(2000).nullable().optional(),
  status: z.enum(["active", "inactive"]),
  sortOrder: z.coerce.number().int().min(0).default(0),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await authorizeRequest(request.headers, ["owner", "admin"]);
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const db = getDb();

  const existing = await db.query.folioItems.findFirst({
    where: eq(folioItems.id, id),
  });
  if (!existing)
    return NextResponse.json({ error: "Item not found" }, { status: 404 });

  const parsed = updateInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "Please check the item details" }, { status: 400 });

  // Check for duplicate name (exclude current item)
  const dupName = await db.query.folioItems.findFirst({
    where: sql`${folioItems.name} = ${parsed.data.name} AND ${folioItems.id} != ${id}`,
  });
  if (dupName)
    return NextResponse.json(
      { error: `Item "${parsed.data.name}" already exists` },
      { status: 409 }
    );

  try {
    await db
      .update(folioItems)
      .set({
        name: parsed.data.name,
        itemType: parsed.data.itemType,
        category: parsed.data.category,
        defaultPrice: parsed.data.defaultPrice,
        description: parsed.data.description ?? null,
        status: parsed.data.status,
        sortOrder: parsed.data.sortOrder,
        updatedAt: new Date(),
      })
      .where(eq(folioItems.id, id));

    await db.insert(activityLogs).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      action: "updated",
      entity: "folio_item",
      entityId: id,
      details: existing.name,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: String(error).slice(0, 200) },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await authorizeRequest(_request.headers, ["owner", "admin"]);
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const db = getDb();

  const existing = await db.query.folioItems.findFirst({
    where: eq(folioItems.id, id),
  });
  if (!existing)
    return NextResponse.json({ error: "Item not found" }, { status: 404 });

  // Soft delete: set status to inactive
  await db
    .update(folioItems)
    .set({ status: "inactive", updatedAt: new Date() })
    .where(eq(folioItems.id, id));

  await db.insert(activityLogs).values({
    id: crypto.randomUUID(),
    userId: session.user.id,
    action: "deactivated",
    entity: "folio_item",
    entityId: id,
    details: existing.name,
  });

  return NextResponse.json({ success: true });
}
