import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { asc, eq, sql } from "drizzle-orm";
import { authorizeRequest } from "@/lib/auth-middleware";
import { getDb } from "@/lib/db";
import { activityLogs, conferenceImages } from "@/lib/db/schema";
import { deleteGenericImage } from "@/lib/storage";

const reorderSchema = z.object({
  imageUrls: z.array(z.string().url()).min(1).max(10),
});

// GET — list all conference images (public)
export async function GET() {
  try {
    const images = await getDb()
      .select()
      .from(conferenceImages)
      .orderBy(asc(conferenceImages.sortOrder));
    return NextResponse.json({ images });
  } catch {
    return NextResponse.json({ images: [] });
  }
}

// POST — add a new conference image
export async function POST(request: NextRequest) {
  const session = await authorizeRequest(request.headers, ["owner", "admin"]);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { imageUrl, altText } = await request.json().catch(() => ({}));
  if (typeof imageUrl !== "string") {
    return NextResponse.json({ error: "A valid imageUrl is required" }, { status: 400 });
  }

  const [{ count }] = await getDb()
    .select({ count: sql<number>`count(*)::int` })
    .from(conferenceImages);

  if (count >= 5) {
    return NextResponse.json({ error: "Maximum 5 conference images allowed" }, { status: 409 });
  }

  const id = crypto.randomUUID();
  await getDb().transaction(async (tx) => {
    await tx.insert(conferenceImages).values({
      id,
      imageUrl,
      altText: typeof altText === "string" ? altText : null,
      sortOrder: count,
      isPrimary: count === 0,
    });
    await tx.insert(activityLogs).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      action: "created",
      entity: "conference_image",
      entityId: id,
    });
  });

  return NextResponse.json({ id }, { status: 201 });
}

// DELETE — delete a conference image
export async function DELETE(request: NextRequest) {
  const session = await authorizeRequest(request.headers, ["owner", "admin"]);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { imageUrl } = await request.json().catch(() => ({}));
  if (typeof imageUrl !== "string") {
    return NextResponse.json({ error: "A valid imageUrl is required" }, { status: 400 });
  }

  await getDb().transaction(async (tx) => {
    const [image] = await tx
      .delete(conferenceImages)
      .where(eq(conferenceImages.imageUrl, imageUrl))
      .returning({ id: conferenceImages.id });

    if (image) {
      await deleteGenericImage(imageUrl).catch(() => undefined);
      await tx.insert(activityLogs).values({
        id: crypto.randomUUID(),
        userId: session.user.id,
        action: "deleted",
        entity: "conference_image",
        entityId: image.id,
      });
    }
  });

  return NextResponse.json({ success: true });
}

// PATCH — reorder conference images
export async function PATCH(request: NextRequest) {
  const session = await authorizeRequest(request.headers, ["owner", "admin"]);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = reorderSchema.safeParse(await request.json());
  if (!body.success) {
    return NextResponse.json({ error: "A valid imageUrls array is required" }, { status: 400 });
  }

  const { imageUrls } = body.data;
  for (let i = 0; i < imageUrls.length; i++) {
    await getDb()
      .update(conferenceImages)
      .set({ sortOrder: i, isPrimary: i === 0 })
      .where(eq(conferenceImages.imageUrl, imageUrls[i]));
  }

  return NextResponse.json({ success: true });
}
