import { NextRequest, NextResponse } from "next/server";
import { and, asc, count, desc, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { authorizeRequest } from "@/lib/auth-middleware";
import { getDb } from "@/lib/db";
import { activityLogs, blocks, roomUnits, rooms, roomTypes } from "@/lib/db/schema";

export const roomUnitInput = z.object({
  roomId: z.string().min(1),
  blockId: z.string().min(1),
  roomNumber: z.coerce.number().int().min(1).max(99),
  displayName: z.string().trim().min(2).max(200).optional(),
  operationalStatus: z.enum(["available", "cleaning", "maintenance", "blocked", "inactive"]).default("available"),
  isActive: z.boolean().default(true),
  notes: z.string().trim().max(1000).optional(),
});

export async function GET(request: NextRequest) {
  const session = await authorizeRequest(request.headers, ["owner", "admin", "staff"]);
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const roomId = searchParams.get("roomId");
  const block = searchParams.get("block");
  const operationalStatus = searchParams.get("operationalStatus");
  const roomTypeId = searchParams.get("roomTypeId");

  const db = getDb();
  const conditions = [];
  if (roomId) conditions.push(eq(roomUnits.roomId, roomId));
  if (block) conditions.push(eq(roomUnits.block, block));
  if (operationalStatus) conditions.push(eq(roomUnits.operationalStatus, operationalStatus));
  if (roomTypeId) {
    const roomIds = db
      .select({ id: rooms.id })
      .from(rooms)
      .where(eq(rooms.roomTypeId, roomTypeId));
    conditions.push(inArray(roomUnits.roomId, roomIds));
  }

  const units = await db
    .select({
      id: roomUnits.id,
      roomId: roomUnits.roomId,
      block: roomUnits.block,
      roomNumber: roomUnits.roomNumber,
      roomCode: roomUnits.roomCode,
      displayName: roomUnits.displayName,
      operationalStatus: roomUnits.operationalStatus,
      isActive: roomUnits.isActive,
      notes: roomUnits.notes,
      roomName: rooms.name,
      roomSlug: rooms.slug,
      roomStatus: rooms.status,
    })
    .from(roomUnits)
    .innerJoin(rooms, eq(roomUnits.roomId, rooms.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(asc(roomUnits.block), asc(roomUnits.roomNumber));

  return NextResponse.json(units);
}

export async function POST(request: NextRequest) {
  const session = await authorizeRequest(request.headers, ["owner", "admin"]);
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = roomUnitInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "Please check the room unit details" }, { status: 400 });

  const db = getDb();
  const room = await db.query.rooms.findFirst({ where: eq(rooms.id, parsed.data.roomId) });
  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });

  const block = await db.query.blocks.findFirst({ where: eq(blocks.id, parsed.data.blockId) });
  if (!block) return NextResponse.json({ error: "Block not found" }, { status: 404 });

  const roomNumber = parsed.data.roomNumber;
  const blockCode = block.shortCode;
  const roomCode = `${blockCode}${String(roomNumber).padStart(2, "0")}`;
  const displayName = parsed.data.displayName || `${block.name} – Room ${String(roomNumber).padStart(2, "0")}`;

  const existing = await db.query.roomUnits.findFirst({
    where: and(eq(roomUnits.roomCode, roomCode)),
  });
  if (existing)
    return NextResponse.json({ error: `Room code "${roomCode}" already exists` }, { status: 409 });

  const id = crypto.randomUUID();
  try {
    await db.insert(roomUnits).values({
      id,
      roomId: parsed.data.roomId,
      block: blockCode,
      blockId: parsed.data.blockId,
      roomNumber,
      roomCode,
      displayName,
      operationalStatus: parsed.data.operationalStatus,
      isActive: parsed.data.isActive,
      notes: parsed.data.notes || null,
    });
    await db.insert(activityLogs).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      action: "created",
      entity: "room_unit",
      entityId: id,
      details: displayName,
    });
    return NextResponse.json({ id, roomCode, displayName }, { status: 201 });
  } catch (error) {
    const msg = String(error);
    if (msg.includes("foreign key constraint"))
      return NextResponse.json({ error: "Referenced record does not exist" }, { status: 400 });
    if (msg.includes("null value in column"))
      return NextResponse.json({ error: "Required field cannot be empty" }, { status: 400 });
    return NextResponse.json({ error: msg.slice(0, 200) }, { status: 500 });
  }
}
