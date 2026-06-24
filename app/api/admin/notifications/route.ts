import { NextRequest, NextResponse } from "next/server";
import { authorizeRequest } from "@/lib/auth-middleware";
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead } from "@/lib/notifications";

export async function GET(request: NextRequest) {
  const session = await authorizeRequest(request.headers, ["owner", "admin", "staff"]);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const all = searchParams.get("all") === "true";

  const [unread, items] = await Promise.all([
    getUnreadCount(session.user.id),
    all ? getNotifications(session.user.id, 50) : getNotifications(session.user.id),
  ]);

  return NextResponse.json({ unread, notifications: items });
}

export async function PATCH(request: NextRequest) {
  const session = await authorizeRequest(request.headers, ["owner", "admin", "staff"]);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);

  if (body?.action === "mark-all-read") {
    await markAllAsRead(session.user.id);
    return NextResponse.json({ success: true });
  }

  if (body?.notificationId) {
    await markAsRead(body.notificationId, session.user.id);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid request" }, { status: 400 });
}
