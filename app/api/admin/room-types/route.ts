import { NextRequest, NextResponse } from "next/server";
import { and, asc, count, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { authorizeRequest } from "@/lib/auth-middleware";
import { getDb } from "@/lib/db";
import { bookingRooms, roomAmenities, roomTypes, rooms } from "@/lib/db/schema";

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

function causeMessage(error: unknown): string {
  return error && typeof error === "object" && "cause" in error ? String(error.cause) : "";
}

export async function GET() {
  const types = await getDb()
    .select({
      id: roomTypes.id,
      name: roomTypes.name,
      slug: roomTypes.slug,
      description: roomTypes.description,
      bedConfiguration: roomTypes.bedConfiguration,
      pricePerNight: roomTypes.pricePerNight,
      maxGuests: roomTypes.maxGuests,
      breakfastIncluded: roomTypes.breakfastIncluded,
      amenities: roomTypes.amenities,
      sortOrder: roomTypes.sortOrder,
      status: roomTypes.status,
      roomCount: sql<number>`coalesce(count(${rooms.id}) filter (where ${rooms.status} = 'active'), 0)::int`,
    })
    .from(roomTypes)
    .leftJoin(rooms, eq(rooms.roomTypeId, roomTypes.id))
    .groupBy(roomTypes.id)
    .orderBy(asc(roomTypes.sortOrder), asc(roomTypes.name));
  return NextResponse.json(types);
}

export async function POST(request: NextRequest) {
  const session = await authorizeRequest(request.headers, ["owner", "admin"]);
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = typeInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "Please check the room type details" }, { status: 400 });
  const id = crypto.randomUUID();
  try {
    await getDb().insert(roomTypes).values({ id, ...parsed.data, amenities: parsed.data.amenities.length ? parsed.data.amenities : null });
    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    const msg = String(error);
    const causeMsg = causeMessage(error);
    if (msg.includes("room_types_slug_unique") || causeMsg.includes("room_types_slug_unique"))
      return NextResponse.json({ error: "That room type slug is already in use" }, { status: 409 });
    return NextResponse.json({ error: msg.slice(0, 200) }, { status: 500 });
  }
}
