import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { authorizeRequest } from "@/lib/auth-middleware";
import { getDb } from "@/lib/db";
import { activityLogs, roomAmenities, rooms } from "@/lib/db/schema";
import { roomInput } from "../route";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await authorizeRequest(request.headers, ["owner", "admin"]);
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = roomInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "Please check the room details" }, { status: 400 });
  const { id } = await params;
  const existing = await getDb().query.rooms.findFirst({ where: eq(rooms.id, id) });
  if (!existing) return NextResponse.json({ error: "Room not found" }, { status: 404 });
  try {
    await getDb().transaction(async (tx) => {
      const { amenities, ...room } = parsed.data;
      await tx
        .update(rooms)
        .set({ ...room, description: room.description || null, updatedAt: new Date() })
        .where(eq(rooms.id, id));
      await tx.delete(roomAmenities).where(eq(roomAmenities.roomId, id));
      if (amenities.length)
        await tx.insert(roomAmenities).values(
          [...new Set(amenities)].map((amenity) => ({
            id: crypto.randomUUID(),
            roomId: id,
            amenity,
          }))
        );
      await tx.insert(activityLogs).values({
        id: crypto.randomUUID(),
        userId: session.user.id,
        action: "updated",
        entity: "room",
        entityId: id,
        details: room.name,
      });
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (String(error).includes("rooms_slug_unique"))
      return NextResponse.json({ error: "That room URL slug is already in use" }, { status: 409 });
    throw error;
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await authorizeRequest(request.headers, ["owner", "admin"]);
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const [updated] = await getDb()
    .update(rooms)
    .set({ status: "blocked", updatedAt: new Date() })
    .where(eq(rooms.id, id))
    .returning({ id: rooms.id });
  if (!updated) return NextResponse.json({ error: "Room not found" }, { status: 404 });
  await getDb().insert(activityLogs).values({
    id: crypto.randomUUID(),
    userId: session.user.id,
    action: "deactivated",
    entity: "room",
    entityId: id,
  });
  return NextResponse.json({ success: true });
}
