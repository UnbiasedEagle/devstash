import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// Only checks that a session cookie is there. A signed-in visitor goes straight to the dashboard on the landing page, with a real redirect before any page is sent, and the dashboard checks the session itself
export function proxy(request: NextRequest) {
  const hasSession = Boolean(getSessionCookie(request));

  if (request.nextUrl.pathname === "/") {
    return hasSession
      ? NextResponse.redirect(new URL("/dashboard", request.url))
      : NextResponse.next();
  }

  if (!hasSession) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/profile/:path*",
    "/items/:path*",
    "/collections/:path*",
    "/search/:path*",
    "/tags/:path*",
    "/types/:path*",
  ],
};
