import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { CUSTOMER_SESSION_COOKIE, parseSessionToken } from "@/lib/session";
import { listCustomerTransactions } from "@/lib/customer-activity-db";

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

    const transactions = await listCustomerTransactions(session.userId);
    return NextResponse.json({ ok: true, data: transactions });
  } catch (error) {
    console.error("Customer transactions load failed:", error);
    return NextResponse.json(
      { ok: false, error: "Could not load customer transactions." },
      { status: 500 }
    );
  }
}
