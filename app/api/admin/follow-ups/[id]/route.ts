import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { authorizeRequest } from "@/lib/auth-middleware";
import { getDb } from "@/lib/db";
import { activityLogs, followUps } from "@/lib/db/schema";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await authorizeRequest(request.headers, ["owner", "admin", "staff"]);
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const item = await getDb().query.followUps.findFirst({ where: eq(followUps.id, id) });
  if (!item) return NextResponse.json({ error: "Follow-up not found" }, { status: 404 });
  if (session.user.role === "staff" && item.assignedTo !== session.user.id)
    return NextResponse.json({ error: "This follow-up is not assigned to you" }, { status: 403 });
  await getDb().transaction(async (tx) => {
    await tx
      .update(followUps)
      .set({ status: "completed", completedAt: new Date(), updatedAt: new Date() })
      .where(eq(followUps.id, id));
    await tx
      .insert(activityLogs)
      .values({
        id: crypto.randomUUID(),
        userId: session.user.id,
        action: "completed",
        entity: "follow-up",
        entityId: id,
      });
  });
  return NextResponse.json({ success: true });
}
