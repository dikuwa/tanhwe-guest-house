import { and, eq, gte, lt } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { activityLogs, bookings, followUps, reminderLogs } from "@/lib/db/schema";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 3);
  const candidates = await getDb().query.bookings.findMany({
    where: and(
      eq(bookings.status, "confirmed"),
      gte(bookings.checkIn, start),
      lt(bookings.checkIn, end)
    ),
  });
  let created = 0;
  for (const booking of candidates) {
    const types = ["arrival", ...(booking.balanceDue > 0 ? ["balance"] : [])];
    for (const type of types) {
      await getDb().transaction(async (tx) => {
        const [logged] = await tx
          .insert(reminderLogs)
          .values({
            id: crypto.randomUUID(),
            bookingId: booking.id,
            type,
            scheduledFor: start,
            details: booking.bookingNumber,
          })
          .onConflictDoNothing()
          .returning({ id: reminderLogs.id });
        if (!logged) return;
        const title =
          type === "arrival"
            ? `Confirm arrival for ${booking.bookingNumber}`
            : `Follow up outstanding balance for ${booking.bookingNumber}`;
        const id = crypto.randomUUID();
        await tx
          .insert(followUps)
          .values({
            id,
            bookingId: booking.id,
            customerId: booking.customerId,
            type,
            title,
            dueDate: start,
            priority: type === "balance" ? "high" : "normal",
          });
        await tx
          .insert(activityLogs)
          .values({
            id: crypto.randomUUID(),
            action: "scheduled",
            entity: "follow-up",
            entityId: id,
            details: title,
          });
        created += 1;
      });
    }
  }
  return NextResponse.json({ success: true, candidates: candidates.length, created });
}
