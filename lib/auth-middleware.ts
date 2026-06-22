import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "./db";
import { users } from "./db/schema";
import { eq } from "drizzle-orm";

export async function requireAuth(request: NextRequest) {
  const sessionCookie = request.cookies.get("auth.session_token");

  if (!sessionCookie) {
    return null;
  }

  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, sessionCookie.value),
    });

    if (!user) {
      return null;
    }

    return user;
  } catch (error) {
    console.error("Auth error:", error);
    return null;
  }
}

export async function requireRole(role: string, request: NextRequest) {
  const user = await requireAuth(request);

  if (!user || user.role !== role) {
    return null;
  }

  return user;
}