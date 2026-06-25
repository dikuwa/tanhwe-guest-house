import { NextRequest, NextResponse } from "next/server";
import { authorizeRequest } from "@/lib/auth-middleware";
import {
  uploadGenericImage,
  deleteGenericImage,
  MAX_IMAGE_SIZE,
  IMAGE_TYPES,
} from "@/lib/storage";

const allowedPaths = ["profiles", "conference"] as const;
type AllowedPath = (typeof allowedPaths)[number];

export async function POST(request: NextRequest) {
  try {
    const session = await authorizeRequest(request.headers, ["owner", "admin"]);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (contentLength > MAX_IMAGE_SIZE + 1024 * 1024) {
      return NextResponse.json({ error: "Upload request is too large" }, { status: 413 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const pathRaw = formData.get("path");

    if (!(file instanceof File) || typeof pathRaw !== "string") {
      return NextResponse.json({ error: "A valid file and path are required" }, { status: 400 });
    }

    if (!IMAGE_TYPES.includes(file.type as (typeof IMAGE_TYPES)[number])) {
      return NextResponse.json(
        { error: "Only JPEG, PNG, and WebP images are allowed" },
        { status: 400 }
      );
    }
    if (file.size <= 0 || file.size > MAX_IMAGE_SIZE) {
      return NextResponse.json({ error: "Image must be no larger than 5 MB" }, { status: 400 });
    }

    if (!allowedPaths.includes(pathRaw as AllowedPath)) {
      return NextResponse.json(
        { error: `Invalid upload path. Allowed: ${allowedPaths.join(", ")}` },
        { status: 400 }
      );
    }

    const imageUrl = await uploadGenericImage(file, pathRaw);
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

    const { imageUrl } = await request.json().catch(() => ({}));
    if (typeof imageUrl !== "string") {
      return NextResponse.json({ error: "A valid image URL is required" }, { status: 400 });
    }

    await deleteGenericImage(imageUrl);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Image deletion error:", error);
    return NextResponse.json({ error: "Failed to delete image" }, { status: 500 });
  }
}
