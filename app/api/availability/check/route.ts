import { NextResponse } from "next/server";
import { z } from "zod";
import { calculateNights, checkRoomAvailability, parseStayDate } from "@/lib/availability";

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const schema = z.object({
  roomId: z.string().min(1).max(128),
  checkIn: date,
  checkOut: date,
  roomsCount: z.coerce.number().int().min(1).max(10),
  guestsCount: z.coerce.number().int().min(1).max(30),
});

export async function POST(request: Request) {
  const body = schema.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Invalid availability request" }, { status: 400 });

  const checkIn = parseStayDate(body.data.checkIn);
  const checkOut = parseStayDate(body.data.checkOut);
  if (calculateNights(checkIn, checkOut) < 1) {
    return NextResponse.json({ error: "Check-out must be after check-in" }, { status: 400 });
  }

  const result = await checkRoomAvailability({ ...body.data, checkIn, checkOut });
  return NextResponse.json(result);
}
