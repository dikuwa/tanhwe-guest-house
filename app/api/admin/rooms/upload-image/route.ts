import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { count, eq } from "drizzle-orm";
import { authorizeRequest } from "@/lib/auth-middleware";
import { getDb } from "@/lib/db";
import { roomImages, rooms } from "@/lib/db/schema";
import {
  deleteRoomImage,
  MAX_ROOM_IMAGE_SIZE,
  ROOM_IMAGE_TYPES,
  uploadRoomImage,
} from "@/lib/storage";

const roomIdSchema = z.string().regex(/^[a-zA-Z0-9_-]{1,128}$/);
const deleteSchema = z.object({ imageUrl: z.string().url() });

export async function POST(request: NextRequest) {
  try {
    const session = await authorizeRequest(request.headers, ["owner", "admin"]);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (contentLength > MAX_ROOM_IMAGE_SIZE + 1024 * 1024) {
      return NextResponse.json({ error: "Upload request is too large" }, { status: 413 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const parsedRoomId = roomIdSchema.safeParse(formData.get("roomId"));
    if (!(file instanceof File) || !parsedRoomId.success) {
      return NextResponse.json({ error: "A valid file and room ID are required" }, { status: 400 });
    }

    if (!ROOM_IMAGE_TYPES.includes(file.type as (typeof ROOM_IMAGE_TYPES)[number])) {
      return NextResponse.json(
        { error: "Only JPEG, PNG, and WebP images are allowed" },
        { status: 400 }
      );
    }
    if (file.size <= 0 || file.size > MAX_ROOM_IMAGE_SIZE) {
      return NextResponse.json({ error: "Image must be no larger than 5 MB" }, { status: 400 });
    }

    const room = await getDb().query.rooms.findFirst({
      columns: { id: true },
      where: eq(rooms.id, parsedRoomId.data),
    });
    if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });

    const [{ imageCount }] = await getDb()
      .select({ imageCount: count() })
      .from(roomImages)
      .where(eq(roomImages.roomId, room.id));
    if (imageCount >= 5) {
      return NextResponse.json({ error: "A room can have at most 5 images" }, { status: 409 });
    }

    const imageUrl = await uploadRoomImage(file, room.id);
    try {
      await getDb()
        .insert(roomImages)
        .values({
          id: crypto.randomUUID(),
          roomId: room.id,
          imageUrl,
          sortOrder: imageCount,
          isPrimary: imageCount === 0,
        });
    } catch (error) {
      await deleteRoomImage(imageUrl).catch(() => undefined);
      throw error;
    }
    return NextResponse.json({ success: true, imageUrl }, { status: 201 });
  } catch (error) {
    console.error("Image upload error:", error);
    return NextResponse.json({ error: "Failed to upload image" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await authorizeRequest(request.headers, ["owner", "admin"]);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = deleteSchema.safeParse(await request.json());
    if (!body.success)
      return NextResponse.json({ error: "A valid image URL is required" }, { status: 400 });

    await deleteRoomImage(body.data.imageUrl);
    await getDb().delete(roomImages).where(eq(roomImages.imageUrl, body.data.imageUrl));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Image deletion error:", error);
    return NextResponse.json({ error: "Failed to delete image" }, { status: 500 });
  }
}
