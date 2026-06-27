import { NextRequest, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { authorizeRequest } from "@/lib/auth-middleware";
import { getDb } from "@/lib/db";
import { activityLogs, bookingRoomUnits, bookingRooms, roomUnits } from "@/lib/db/schema";

const updateInput = z.object({
  roomId: z.string().min(1).optional(),
  block: z.enum(["A", "B", "C"]).optional(),
  roomNumber: z.coerce.number().int().min(1).max(99).optional(),
  displayName: z.string().trim().min(2).max(200).optional(),
  operationalStatus: z.enum(["available", "cleaning", "maintenance", "blocked", "inactive"]).optional(),
  isActive: z.boolean().optional(),
  notes: z.string().trim().max(1000).nullable().optional(),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await authorizeRequest(request.headers, ["owner", "admin"]);
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const existing = await getDb().query.roomUnits.findFirst({ where: eq(roomUnits.id, id) });
  if (!existing) return NextResponse.json({ error: "Room unit not found" }, { status: 404 });

  const parsed = updateInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "Please check the room unit details" }, { status: 400 });

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (parsed.data.roomId !== undefined) updates.roomId = parsed.data.roomId;
  if (parsed.data.block !== undefined) updates.block = parsed.data.block;
  if (parsed.data.roomNumber !== undefined) updates.roomNumber = parsed.data.roomNumber;
  if (parsed.data.operationalStatus !== undefined) updates.operationalStatus = parsed.data.operationalStatus;
  if (parsed.data.isActive !== undefined) updates.isActive = parsed.data.isActive;
  if (parsed.data.notes !== undefined) updates.notes = parsed.data.notes;

  if (updates.block || updates.roomNumber) {
    const block = String(updates.block ?? existing.block);
    const roomNumber = Number(updates.roomNumber ?? existing.roomNumber);
    updates.roomCode = `${block}${String(roomNumber).padStart(2, "0")}`;
    if (!updates.displayName) {
      updates.displayName = `Block ${block} – Room ${String(roomNumber).padStart(2, "0")}`;
    }
  }
  if (parsed.data.displayName !== undefined) {
    updates.displayName = parsed.data.displayName;
  }

  await getDb().update(roomUnits).set(updates).where(eq(roomUnits.id, id));
  await getDb().insert(activityLogs).values({
    id: crypto.randomUUID(),
    userId: session.user.id,
    action: "updated",
    entity: "room_unit",
    entityId: id,
    details: existing.displayName,
  });
  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await authorizeRequest(request.headers, ["owner", "admin"]);
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const existing = await getDb().query.roomUnits.findFirst({ where: eq(roomUnits.id, id) });
  if (!existing) return NextResponse.json({ error: "Room unit not found" }, { status: 404 });

  const [{ refCount }] = await getDb()
    .select({ refCount: sql<number>`count(*)::int` })
    .from(bookingRoomUnits)
    .where(eq(bookingRoomUnits.roomUnitId, id));

  if (refCount > 0) {
    return NextResponse.json(
      { error: "This room unit is referenced by bookings and cannot be deleted. Deactivate it instead." },
      { status: 409 }
    );
  }

  await getDb().delete(roomUnits).where(eq(roomUnits.id, id));
  await getDb().insert(activityLogs).values({
    id: crypto.randomUUID(),
    userId: session.user.id,
    action: "deleted",
    entity: "room_unit",
    entityId: id,
    details: existing.displayName,
  });
  return NextResponse.json({ success: true });
}
