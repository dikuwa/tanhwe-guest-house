import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authorizeRequest } from "@/lib/auth-middleware";
import { getDb } from "@/lib/db";
import { activityLogs, roomAmenities, rooms } from "@/lib/db/schema";

export const roomInput = z.object({
  name: z.string().trim().min(2).max(100),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  type: z.string().trim().min(2).max(80),
  description: z.string().trim().max(3000).default(""),
  pricePerNight: z.coerce.number().int().min(0).max(1_000_000),
  availableUnits: z.coerce.number().int().min(1).max(100),
  maxGuests: z.coerce.number().int().min(1).max(100),
  breakfastIncluded: z.boolean().default(false),
  featured: z.boolean().default(false),
  status: z.enum(["active", "maintenance", "blocked"]),
  amenities: z.array(z.string().trim().min(1).max(80)).max(30).default([]),
});

export async function POST(request: NextRequest) {
  const session = await authorizeRequest(request.headers, ["owner", "admin"]);
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = roomInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "Please check the room details" }, { status: 400 });
  const id = crypto.randomUUID();
  try {
    await getDb().transaction(async (tx) => {
      const { amenities, ...room } = parsed.data;
      await tx.insert(rooms).values({ id, ...room, description: room.description || null });
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
        action: "created",
        entity: "room",
        entityId: id,
        details: room.name,
      });
    });
    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    if (String(error).includes("rooms_slug_unique"))
      return NextResponse.json({ error: "That room URL slug is already in use" }, { status: 409 });
    throw error;
  }
}
