import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { CUSTOMER_SESSION_COOKIE, parseSessionToken } from "@/lib/session";
import { getEmployeeProfileByCustomerId } from "@/lib/customer-profile";

/** GET /api/customer/profile — current session employee + live account balance. */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(CUSTOMER_SESSION_COOKIE)?.value;
    const session = parseSessionToken(token);
    if (!session) {
      return NextResponse.json(
        { ok: false, error: "Not authenticated." },
        { status: 401 }
      );
    }

    const employee = await getEmployeeProfileByCustomerId(session.userId);
    if (!employee) {
      return NextResponse.json(
        { ok: false, error: "Customer not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, data: employee });
  } catch (error) {
    console.error("Customer profile load failed:", error);
    return NextResponse.json(
      { ok: false, error: "Could not load profile." },
      { status: 500 }
    );
  }
}
