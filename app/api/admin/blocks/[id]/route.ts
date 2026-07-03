import { NextRequest, NextResponse } from "next/server";
import { count, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { authorizeRequest } from "@/lib/auth-middleware";
import { getDb } from "@/lib/db";
import { activityLogs, blocks, roomUnits } from "@/lib/db/schema";

const updateInput = z.object({
  name: z.string().trim().min(1).max(100),
  shortCode: z.string().trim().min(1).max(10).toUpperCase(),
  description: z.string().trim().max(1000).optional().nullable(),
  displayOrder: z.coerce.number().int().min(0),
  isActive: z.boolean(),
});

function causeMessage(error: unknown): string {
  return error && typeof error === "object" && "cause" in error ? String(error.cause) : "";
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await authorizeRequest(request.headers, ["owner", "admin"]);
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const db = getDb();

  const existing = await db.query.blocks.findFirst({ where: eq(blocks.id, id) });
  if (!existing) return NextResponse.json({ error: "Block not found" }, { status: 404 });

  const parsed = updateInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "Please check the block details" }, { status: 400 });

  const dupName = await db.query.blocks.findFirst({
    where: sql`${blocks.name} = ${parsed.data.name} AND ${blocks.id} != ${id}`,
  });
  if (dupName)
    return NextResponse.json({ error: `Block "${parsed.data.name}" already exists` }, { status: 409 });

  const dupCode = await db.query.blocks.findFirst({
    where: sql`${blocks.shortCode} = ${parsed.data.shortCode} AND ${blocks.id} != ${id}`,
  });
  if (dupCode)
    return NextResponse.json({ error: `Short code "${parsed.data.shortCode}" already in use` }, { status: 409 });

  try {
    await db
      .update(blocks)
      .set({
        name: parsed.data.name,
        shortCode: parsed.data.shortCode,
        description: parsed.data.description || null,
        displayOrder: parsed.data.displayOrder,
        isActive: parsed.data.isActive,
        updatedAt: new Date(),
      })
      .where(eq(blocks.id, id));

    await db.insert(activityLogs).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      action: "updated",
      entity: "block",
      entityId: id,
      details: existing.name,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = String(error);
    const causeMsg = causeMessage(error);
    if (msg.includes("blocks_name_unique") || causeMsg.includes("blocks_name_unique"))
      return NextResponse.json({ error: "That block name is already in use" }, { status: 409 });
    if (msg.includes("blocks_short_code_unique") || causeMsg.includes("blocks_short_code_unique"))
      return NextResponse.json({ error: "That short code is already in use" }, { status: 409 });
    return NextResponse.json({ error: msg.slice(0, 200) }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await authorizeRequest(_request.headers, ["owner"]);
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const db = getDb();

  const existing = await db.query.blocks.findFirst({ where: eq(blocks.id, id) });
  if (!existing) return NextResponse.json({ error: "Block not found" }, { status: 404 });

  const [{ unitCount }] = await db
    .select({ unitCount: sql<number>`count(*)::int` })
    .from(roomUnits)
    .where(eq(roomUnits.blockId, id));

  if (unitCount > 0) {
    return NextResponse.json(
      {
        error: `"${existing.name}" contains ${unitCount} room unit(s). Reassign or deactivate these units before deleting.`,
      },
      { status: 409 }
    );
  }

  await db.insert(activityLogs).values({
    id: crypto.randomUUID(),
    userId: session.user.id,
    action: "deleted",
    entity: "block",
    entityId: id,
    details: existing.name,
  });

  await db.delete(blocks).where(eq(blocks.id, id));
  return NextResponse.json({ success: true });
}
