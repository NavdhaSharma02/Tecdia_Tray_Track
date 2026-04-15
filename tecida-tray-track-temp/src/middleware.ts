import { NextResponse, type NextRequest } from "next/server";

/**
 * Middleware runs before every matched request.
 * Use it for auth checks, redirects, header injection, logging, etc.
 */
export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  response.headers.set("x-app-name", "tecida-tray-track");
  return response;
}

/**
 * Configure which paths the middleware applies to.
 */
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
