import { NextResponse } from "next/server";
import { isAdminPinValid } from "@/lib/admin-auth";

/**
 * POST /api/admin/login
 * Body: { "pin": "123456" }
 * Validates PIN on the server (never exposed to the client bundle).
 * Sets secure authentication cookie on success.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { pin?: string };
    const pin = body.pin ?? "";
    const result = isAdminPinValid(pin);
    if (!result.ok) {
      const status = result.error === "Admin login is not configured." ? 503 : 401;
      return NextResponse.json({ ok: false, error: result.error }, { status });
    }

    const response = NextResponse.json({ ok: true, data: { authenticated: true } });
    // Set secure HTTP-only cookie for session validation
    response.cookies.set("admin_session", "authenticated", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 8 * 60 * 60, // 8 hours
      path: "/",
    });
    return response;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }
}
