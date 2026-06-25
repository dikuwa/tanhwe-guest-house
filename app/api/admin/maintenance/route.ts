import { NextRequest, NextResponse } from "next/server";
import { eq, ilike, or, sql } from "drizzle-orm";
import { authorizeRequest } from "@/lib/auth-middleware";
import { getDb } from "@/lib/db";
import { activityLogs, bookings, customers, followUps } from "@/lib/db/schema";

export async function POST(request: NextRequest) {
  const session = await authorizeRequest(request.headers, ["owner"]);
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { action } = await request.json().catch(() => ({}));

  const db = getDb();

  try {
    switch (action) {
      case "clean-customers": {
        const toDelete = await db
          .select({ id: customers.id, fullName: customers.fullName })
          .from(customers)
          .where(
            or(
              ilike(customers.fullName, "%test%"),
              ilike(customers.fullName, "%demo%"),
              ilike(customers.notes ?? sql`''`, "%test%")
            )
          );

        if (toDelete.length === 0) {
          return NextResponse.json({ message: "No test customers found" });
        }

        for (const customer of toDelete) {
          await db.delete(customers).where(eq(customers.id, customer.id));
          await db.insert(activityLogs).values({
            id: crypto.randomUUID(),
            userId: session.user.id,
            action: "deleted",
            entity: "customer",
            entityId: customer.id,
            details: `Cleanup: ${customer.fullName}`,
          });
        }

        return NextResponse.json({ message: `Deleted ${toDelete.length} test customer(s)` });
      }

      case "clean-bookings": {
        const toDelete = await db
          .select({ id: bookings.id, bookingNumber: bookings.bookingNumber })
          .from(bookings)
          .where(
            or(
              ilike(bookings.notes ?? sql`''`, "%test%"),
              ilike(bookings.notes ?? sql`''`, "%demo%")
            )
          );

        if (toDelete.length === 0) {
          return NextResponse.json({ message: "No test bookings found" });
        }

        for (const booking of toDelete) {
          await db.delete(bookings).where(eq(bookings.id, booking.id));
          await db.insert(activityLogs).values({
            id: crypto.randomUUID(),
            userId: session.user.id,
            action: "deleted",
            entity: "booking",
            entityId: booking.id,
            details: `Cleanup: ${booking.bookingNumber}`,
          });
        }

        return NextResponse.json({ message: `Deleted ${toDelete.length} test booking(s)` });
      }

      case "clean-orphan-followups": {
        await db.execute(
          sql`delete from ${followUps} where ${followUps.bookingId} is not null and not exists (select 1 from ${bookings} where ${bookings.id} = ${followUps.bookingId})`
        );
        return NextResponse.json({ message: "Orphaned follow-ups cleaned" });
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Maintenance error:", error);
    return NextResponse.json({ error: "Operation failed" }, { status: 500 });
  }
}
