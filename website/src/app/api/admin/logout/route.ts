import { NextResponse } from "next/server";

/**
 * POST /api/admin/logout
 * Clears the admin session cookie to log out the user.
 */
export async function POST() {
  const response = NextResponse.json({ ok: true, data: { message: "Logged out" } });
  // Clear the admin session cookie
  response.cookies.set("admin_session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 0, // Expire immediately
    path: "/",
  });
  return response;
}
