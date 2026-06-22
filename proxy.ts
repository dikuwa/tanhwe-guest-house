import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

// This is an optimistic redirect only. Every protected page and API validates
// the signed, database-backed session again on the server.
export function proxy(request: NextRequest) {
  if (!getSessionCookie(request, { cookiePrefix: "tanhwe" })) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
