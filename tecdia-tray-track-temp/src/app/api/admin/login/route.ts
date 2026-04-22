import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";

function getConfiguredPin(): string | null {
  const pin = process.env.ADMIN_PIN;
  if (!pin || !/^\d{6}$/.test(pin)) {
    return null;
  }
  return pin;
}

/**
 * POST /api/admin/login
 * Body: { "pin": "123456" }
 * Validates PIN on the server (never exposed to the client bundle).
 */
export async function POST(request: Request) {
  const configured = getConfiguredPin();
  if (!configured) {
    console.error(
      "ADMIN_PIN is missing or invalid. Set ADMIN_PIN to exactly 6 digits in .env.local"
    );
    return NextResponse.json(
      { ok: false, error: "Admin login is not configured." },
      { status: 503 }
    );
  }

  try {
    const body = (await request.json()) as { pin?: string };
    const pin = body.pin ?? "";

    if (pin.length !== configured.length) {
      return NextResponse.json({ ok: false, error: "Incorrect PIN." }, { status: 401 });
    }

    const a = Buffer.from(pin, "utf8");
    const b = Buffer.from(configured, "utf8");
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return NextResponse.json({ ok: false, error: "Incorrect PIN." }, { status: 401 });
    }

    return NextResponse.json({ ok: true, data: { authenticated: true } });
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }
}
