import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authorizeRequest } from "@/lib/auth-middleware";
import { listRoomImages } from "@/lib/storage";

const roomIdSchema = z.string().regex(/^[a-zA-Z0-9_-]{1,128}$/);

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
