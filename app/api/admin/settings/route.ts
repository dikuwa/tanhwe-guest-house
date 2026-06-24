import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authorizeRequest } from "@/lib/auth-middleware";
import { getDb } from "@/lib/db";
import { activityLogs, settings } from "@/lib/db/schema";

const allowed = [
  "phone",
  "whatsapp",
  "location",
  "check_in_time",
  "check_out_time",
  "currency",
  "email",
  "time_format",
  "flextech_url",
  "location_pin_url",
  "conference_title",
  "conference_description",
  "conference_capacity",
  "conference_amenities",
  "conference_suitable_for",
  "conference_operating_hours",
  "conference_pricing_note",
  "whatsapp_conference_message",
  "whatsapp_location_message",
] as const;
const input = z.object({ key: z.enum(allowed), value: z.string().trim().min(1).max(200) });
export async function PATCH(request: NextRequest) {
  const session = await authorizeRequest(request.headers, ["owner"]);
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = input.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid setting" }, { status: 400 });
  await getDb().transaction(async (tx) => {
    await tx
      .update(settings)
      .set({ value: parsed.data.value, updatedBy: session.user.id, updatedAt: new Date() })
      .where(eq(settings.key, parsed.data.key));
    await tx
      .insert(activityLogs)
      .values({
        id: crypto.randomUUID(),
        userId: session.user.id,
        action: "updated",
        entity: "setting",
        entityId: parsed.data.key,
      });
  });
  return NextResponse.json({ success: true });
}
