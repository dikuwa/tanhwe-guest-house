import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authorizeRequest } from "@/lib/auth-middleware";
import { getDb } from "@/lib/db";
import { activityLogs, users } from "@/lib/db/schema";
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await authorizeRequest(request.headers, ["owner"]);
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await request.json().catch(() => null);
  const roleParsed = z
    .object({ role: z.enum(["owner", "admin", "staff"]) })
    .safeParse(body);
  const imageParsed = z
    .object({ image: z.union([z.string(), z.null()]) })
    .safeParse(body);

  if (!roleParsed.success && !imageParsed.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const { id } = await params;
  if (roleParsed.success) {
    if (id === session.user.id && roleParsed.data.role !== "owner") {
      return NextResponse.json(
        { error: "You cannot remove your own owner access" },
        { status: 409 }
      );
    }
    await getDb().transaction(async (tx) => {
      await tx
        .update(users)
        .set({ role: roleParsed.data.role, updatedAt: new Date() })
        .where(eq(users.id, id));
      await tx.insert(activityLogs).values({
        id: crypto.randomUUID(),
        userId: session.user.id,
        action: "role_updated",
        entity: "user",
        entityId: id,
        details: roleParsed.data.role,
      });
    });
  } else if (imageParsed.success) {
    await getDb()
      .update(users)
      .set({
        image: imageParsed.data.image || null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id));
  }
  return NextResponse.json({ success: true });
}
