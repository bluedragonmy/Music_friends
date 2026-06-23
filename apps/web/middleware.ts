import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const requestPath = request.nextUrl.pathname;

  // Skip static assets and internal auth endpoints
  if (
    requestPath.startsWith("/_next") ||
    requestPath.startsWith("/api/auth") ||
    requestPath.endsWith(".ico")
  ) {
    return NextResponse.next();
  }

  const isAuthPage = requestPath === "/login";
  
  // Extract authorization session cookie tokens
  const authSessionToken =
    request.cookies.get("next-auth.session-token")?.value ||
    request.cookies.get("__Secure-next-auth.session-token")?.value;

  // Protect private pages by forcing redirection to login
  if (!isAuthPage && !authSessionToken) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Redirect signed-in users attempting to access login page back to homepage
  if (isAuthPage && authSessionToken) {
    return NextResponse.redirect(new URL("/match", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/match/:path*",
    "/chat/:path*",
    "/stats/:path*",
    "/onboarding/:path*",
    "/profile/:path*",
    "/dev-dash/:path*",
    "/login",
  ],
};
