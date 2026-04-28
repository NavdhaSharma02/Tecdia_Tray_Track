import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { CUSTOMER_SESSION_COOKIE, parseSessionToken } from "@/lib/session";
import { createCheckoutTransaction } from "@/lib/customer-activity-db";
import type { PaymentMethod, ScannedItem } from "@/types";

interface CheckoutBody {
  items?: ScannedItem[];
  paymentMethod?: PaymentMethod;
}

export async function POST(request: Request) {
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

    const body = (await request.json()) as CheckoutBody;
    const items = body.items || [];
    const paymentMethod = body.paymentMethod;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { ok: false, error: "At least one scanned item is required." },
        { status: 400 }
      );
    }
    if (paymentMethod !== "immediate" && paymentMethod !== "account") {
      return NextResponse.json(
        { ok: false, error: "Invalid payment method." },
        { status: 400 }
      );
    }

    const transaction = await createCheckoutTransaction({
      customerId: session.userId,
      items,
      paymentMethod,
    });

    return NextResponse.json({
      ok: true,
      data: {
        transactionId: transaction.id,
        employeeId: session.userId,
        items,
        total: transaction.total,
        paymentMethod,
        date: transaction.date,
        status: transaction.status,
      },
    });
  } catch (error) {
    console.error("Checkout failed:", error);
    return NextResponse.json(
      { ok: false, error: "Could not complete checkout." },
      { status: 500 }
    );
  }
}
