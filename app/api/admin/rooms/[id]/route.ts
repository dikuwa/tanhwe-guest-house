import { NextRequest, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { authorizeRequest } from "@/lib/auth-middleware";
import { getDb } from "@/lib/db";
import { activityLogs, bookingRooms, roomAmenities, roomBlockedDates, roomImages, rooms } from "@/lib/db/schema";
import { roomInput } from "../route";
import { deleteRoomImage } from "@/lib/storage";
import { revalidatePath } from "next/cache";

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
    revalidatePath("/admin/rooms");
    return NextResponse.json({ success: true });
  } catch (error) {
    if (String(error).includes("rooms_slug_unique"))
      return NextResponse.json({ error: "That room URL slug is already in use" }, { status: 409 });
    throw error;
  }
}

type DeleteAction =
  | { action: "permanent-delete" }
  | { action: "archive"; bookingCount: number };

async function getDeleteAction(id: string): Promise<DeleteAction> {
  const db = getDb();
  const [{ bookingCount }] = await db
    .select({ bookingCount: sql<number>`count(*)::int` })
    .from(bookingRooms)
    .where(eq(bookingRooms.roomId, id));
  if (bookingCount > 0) return { action: "archive", bookingCount };
  return { action: "permanent-delete" };
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await authorizeRequest(request.headers, ["owner", "admin"]);
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;

  const existing = await getDb().query.rooms.findFirst({
    where: eq(rooms.id, id),
    with: { images: true },
  });
  if (!existing) return NextResponse.json({ error: "Room not found" }, { status: 404 });

  const deleteAction = await getDeleteAction(id);
  const { name } = existing;

  if (deleteAction.action === "permanent-delete") {
    try {
      // Delete R2 storage images
      await Promise.allSettled(
        existing.images.map((img) => deleteRoomImage(img.imageUrl))
      );
      // Delete room — cascade handles room_images, room_amenities, room_blocked_dates
      await getDb().delete(rooms).where(eq(rooms.id, id));
      await getDb().insert(activityLogs).values({
        id: crypto.randomUUID(),
        userId: session.user.id,
        action: "deleted",
        entity: "room",
        entityId: id,
        details: `${name} (permanently deleted)`,
      });
      revalidatePath("/admin/rooms");
      return NextResponse.json({ action: "permanent-delete", name });
    } catch (error) {
      console.error("Permanent delete error:", error);
      return NextResponse.json({ error: "Failed to delete room" }, { status: 500 });
    }
  }

  // Archive
  try {
    await getDb()
      .update(rooms)
      .set({ status: "archived", updatedAt: new Date() })
      .where(eq(rooms.id, id));
    await getDb().insert(activityLogs).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      action: "archived",
      entity: "room",
      entityId: id,
      details: name,
    });
    revalidatePath("/admin/rooms");
    return NextResponse.json({
      action: "archive",
      name,
      bookingCount: deleteAction.bookingCount,
    });
  } catch (error) {
    console.error("Archive error:", error);
    return NextResponse.json({ error: "Failed to archive room" }, { status: 500 });
  }
}
