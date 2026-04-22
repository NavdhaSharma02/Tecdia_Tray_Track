import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { findCustomerById } from "@/lib/customer-auth";
import { CUSTOMER_SESSION_COOKIE, parseSessionToken } from "@/lib/session";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(CUSTOMER_SESSION_COOKIE)?.value;
    const session = parseSessionToken(token);

    if (!session) {
      return NextResponse.json({ ok: true, data: { customer: null } });
    }

    const customer = await findCustomerById(session.userId);
    if (!customer) {
      return NextResponse.json({ ok: true, data: { customer: null } });
    }

    return NextResponse.json({ ok: true, data: { customer } });
  } catch (error) {
    console.error("Session lookup failed:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to load customer session." },
      { status: 500 }
    );
  }
}
