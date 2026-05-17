import { NextResponse, type NextRequest } from "next/server";

/**
 * Middleware runs before every matched request.
 * Use it for auth checks, redirects, header injection, logging, etc.
 */
export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  response.headers.set("x-app-name", "tecida-tray-track");

  // Check admin authentication for protected routes
  const pathname = request.nextUrl.pathname;
  const isAdminRoute = pathname.startsWith("/admin");
  const isLoginRoute = pathname === "/admin/login";
  const isApiRoute = pathname.startsWith("/api");

  if (isAdminRoute && !isLoginRoute && !isApiRoute) {
    // Check for admin authentication cookie
    const adminAuth = request.cookies.get("admin_session")?.value;
    if (!adminAuth || adminAuth !== "authenticated") {
      // Redirect to login if not authenticated
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/admin/login";
      return NextResponse.redirect(loginUrl);
    }
  }

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
