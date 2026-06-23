import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import { authorizeRequest } from "@/lib/auth-middleware";
import { getDb } from "@/lib/db";
import { roomImages } from "@/lib/db/schema";
import { listRoomImages } from "@/lib/storage";

const roomIdSchema = z.string().regex(/^[a-zA-Z0-9_-]{1,128}$/);
const reorderSchema = z.object({
  imageUrls: z.array(z.string().url()).min(1).max(10),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await authorizeRequest(request.headers, ["owner", "admin"]);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const parsedId = roomIdSchema.safeParse((await params).id);
    if (!parsedId.success) return NextResponse.json({ error: "Invalid room ID" }, { status: 400 });

    return NextResponse.json({ images: await listRoomImages(parsedId.data) });
  } catch (error) {
    console.error("List images error:", error);
    return NextResponse.json({ error: "Failed to list images" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await authorizeRequest(request.headers, ["owner", "admin"]);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const parsedId = roomIdSchema.safeParse((await params).id);
    if (!parsedId.success) return NextResponse.json({ error: "Invalid room ID" }, { status: 400 });

    const body = reorderSchema.safeParse(await request.json());
    if (!body.success) {
      return NextResponse.json({ error: "A valid imageUrls array is required" }, { status: 400 });
    }

    const { imageUrls } = body.data;
    const db = getDb();

    // Update sort order based on position in the array
    // The first item gets sort_order = 0 and is_primary = true
    // All others get sort_order = index and is_primary = false
    for (let i = 0; i < imageUrls.length; i++) {
      await db
        .update(roomImages)
        .set({
          sortOrder: i,
          isPrimary: i === 0,
        })
        .where(
          sql`${roomImages.roomId} = ${parsedId.data} AND ${roomImages.imageUrl} = ${imageUrls[i]}`
        );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reorder images error:", error);
    return NextResponse.json({ error: "Failed to reorder images" }, { status: 500 });
  }
}
