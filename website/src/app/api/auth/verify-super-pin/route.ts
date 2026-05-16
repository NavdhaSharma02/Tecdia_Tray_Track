import { NextResponse } from "next/server";
import { verifySuperUserPin } from "@/lib/admin-auth";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { pin?: string };
    const pin = (body.pin || "").trim();
    const result = verifySuperUserPin(pin);
    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.error || "Incorrect PIN." },
        { status: 403 }
      );
    }
    return NextResponse.json({ ok: true, data: { role: result.role } });
  } catch (error) {
    console.error("verify-super-pin failed:", error);
    return NextResponse.json(
      { ok: false, error: "Could not verify PIN." },
      { status: 500 }
    );
  }
}
