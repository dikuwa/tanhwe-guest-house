import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { authorizeRequest } from "@/lib/auth-middleware";
import { checkRoomAvailability } from "@/lib/availability";
import { getDb } from "@/lib/db";
import { activityLogs, bookingRooms, bookings } from "@/lib/db/schema";
import { notifyOps } from "@/lib/notifications";

const statuses = [
  "pending",
  "confirmed",
  "checked-in",
  "checked-out",
  "cancelled",
  "no-show",
] as const;
const transitions: Record<(typeof statuses)[number], readonly string[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["checked-in", "cancelled", "no-show"],
  "checked-in": ["checked-out"],
  "checked-out": [],
  cancelled: [],
  "no-show": [],
};

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await authorizeRequest(request.headers, ["owner", "admin", "staff"]);
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = z
    .object({ status: z.enum(statuses) })
    .safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  const { id } = await params;
  const current = await getDb().query.bookings.findFirst({ where: eq(bookings.id, id) });
  if (!current) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  if (!transitions[current.status as keyof typeof transitions]?.includes(parsed.data.status))
    return NextResponse.json(
      { error: `Cannot move ${current.status} booking to ${parsed.data.status}` },
      { status: 409 }
    );
  if (parsed.data.status === "confirmed") {
    const reservedRooms = await getDb()
      .select({
        roomId: bookingRooms.roomId,
        roomsCount: bookingRooms.roomsCount,
        checkIn: bookingRooms.checkIn,
        checkOut: bookingRooms.checkOut,
      })
      .from(bookingRooms)
      .where(eq(bookingRooms.bookingId, id));
    for (const reservedRoom of reservedRooms) {
      const availability = await checkRoomAvailability({
        roomId: reservedRoom.roomId,
        checkIn: reservedRoom.checkIn ?? current.checkIn,
        checkOut: reservedRoom.checkOut ?? current.checkOut,
        roomsCount: reservedRoom.roomsCount,
      });
      if (!availability.available)
        return NextResponse.json(
          { error: "This room is no longer available for the requested dates" },
          { status: 409 }
        );
    }
  }
  await getDb().transaction(async (tx) => {
    await tx
      .update(bookings)
      .set({ status: parsed.data.status, updatedAt: new Date() })
      .where(eq(bookings.id, id));
    await tx.insert(activityLogs).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      action: "status_updated",
      entity: "booking",
      entityId: id,
      details: `${current.status} → ${parsed.data.status}`,
    });
  });
  // Notify ops users of status change
  if (parsed.data.status !== current.status) {
    await notifyOps({
      type: "booking_status",
      title: `Booking ${parsed.data.status}: ${current.bookingNumber}`,
      description: `${current.status} → ${parsed.data.status}`,
      bookingId: id,
      link: `/admin/bookings/${id}`,
      actorId: session.user.id,
    });
  }
  return NextResponse.json({ success: true });
}
