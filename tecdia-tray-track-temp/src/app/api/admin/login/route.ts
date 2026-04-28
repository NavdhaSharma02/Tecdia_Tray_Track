import { NextResponse } from "next/server";
import { isAdminPinValid } from "@/lib/admin-auth";

/**
 * POST /api/admin/login
 * Body: { "pin": "123456" }
 * Validates PIN on the server (never exposed to the client bundle).
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

    return NextResponse.json({ ok: true, data: { authenticated: true } });
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }
}
