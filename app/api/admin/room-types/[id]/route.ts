import { NextRequest, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { authorizeRequest } from "@/lib/auth-middleware";
import { getDb } from "@/lib/db";
import { bookingRooms, roomTypes, rooms } from "@/lib/db/schema";

const typeInput = z.object({
  name: z.string().trim().min(2).max(100),
  slug: z.string().trim().min(2).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().trim().max(3000).default(""),
  bedConfiguration: z.string().trim().max(200).default(""),
  pricePerNight: z.coerce.number().int().min(0).max(1_000_000),
  maxGuests: z.coerce.number().int().min(1).max(100),
  breakfastIncluded: z.boolean().default(false),
  amenities: z.array(z.string().trim().min(1).max(80)).max(40).default([]),
  sortOrder: z.coerce.number().int().min(0).default(0),
  status: z.enum(["active", "inactive"]).default("active"),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await authorizeRequest(request.headers, ["owner", "admin"]);
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = typeInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "Please check the room type details" }, { status: 400 });
  const { id } = await params;
  const existing = await getDb().query.roomTypes.findFirst({ where: eq(roomTypes.id, id) });
  if (!existing) return NextResponse.json({ error: "Room type not found" }, { status: 404 });
  try {
    await getDb()
      .update(roomTypes)
      .set({ ...parsed.data, amenities: parsed.data.amenities.length ? parsed.data.amenities : null, updatedAt: new Date() })
      .where(eq(roomTypes.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = String(error);
    const causeMsg = (error as any).cause ? String((error as any).cause) : "";
    if (msg.includes("room_types_slug_unique") || causeMsg.includes("room_types_slug_unique"))
      return NextResponse.json({ error: "That room type slug is already in use" }, { status: 409 });
    return NextResponse.json({ error: msg.slice(0, 200) }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await authorizeRequest(_request.headers, ["owner", "admin"]);
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const [roomCount] = await getDb()
    .select({ count: sql<number>`count(*)::int` })
    .from(rooms)
    .where(eq(rooms.roomTypeId, id));
  if (roomCount && roomCount.count > 0) {
    return NextResponse.json(
      { error: "Room type is in use", detail: `${roomCount.count} room(s) use this type. Archive it instead.` },
      { status: 409 }
    );
  }
  const [deleted] = await getDb()
    .delete(roomTypes)
    .where(eq(roomTypes.id, id))
    .returning({ id: roomTypes.id });
  if (!deleted) return NextResponse.json({ error: "Room type not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
