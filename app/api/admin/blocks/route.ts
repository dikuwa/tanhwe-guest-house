import { NextRequest, NextResponse } from "next/server";
import { asc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { authorizeRequest } from "@/lib/auth-middleware";
import { getDb } from "@/lib/db";
import { activityLogs, blocks, roomUnits } from "@/lib/db/schema";

const blockInput = z.object({
  name: z.string().trim().min(1).max(100),
  shortCode: z.string().trim().min(1).max(10).toUpperCase(),
  description: z.string().trim().max(1000).optional(),
  displayOrder: z.coerce.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

function causeMessage(error: unknown): string {
  return error && typeof error === "object" && "cause" in error ? String(error.cause) : "";
}

export async function GET() {
  const rows = await getDb()
    .select({
      id: blocks.id,
      name: blocks.name,
      shortCode: blocks.shortCode,
      description: blocks.description,
      displayOrder: blocks.displayOrder,
      isActive: blocks.isActive,
      roomUnitCount: sql<number>`coalesce(count(${roomUnits.id}) filter (where ${roomUnits.isActive} = true), 0)::int`,
    })
    .from(blocks)
    .leftJoin(roomUnits, eq(roomUnits.blockId, blocks.id))
    .groupBy(blocks.id)
    .orderBy(asc(blocks.displayOrder), asc(blocks.name));
  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  const session = await authorizeRequest(request.headers, ["owner", "admin"]);
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = blockInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "Please check the block details" }, { status: 400 });

  const db = getDb();
  const existing = await db.query.blocks.findFirst({
    where: eq(blocks.name, parsed.data.name),
  });
  if (existing)
    return NextResponse.json({ error: `Block "${parsed.data.name}" already exists` }, { status: 409 });

  const existingCode = await db.query.blocks.findFirst({
    where: eq(blocks.shortCode, parsed.data.shortCode),
  });
  if (existingCode)
    return NextResponse.json({ error: `Short code "${parsed.data.shortCode}" already in use` }, { status: 409 });

  const id = crypto.randomUUID();
  try {
    await db.insert(blocks).values({
      id,
      ...parsed.data,
      description: parsed.data.description || null,
    });
    await db.insert(activityLogs).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      action: "created",
      entity: "block",
      entityId: id,
      details: parsed.data.name,
    });
    return NextResponse.json({ id, name: parsed.data.name, shortCode: parsed.data.shortCode }, { status: 201 });
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
