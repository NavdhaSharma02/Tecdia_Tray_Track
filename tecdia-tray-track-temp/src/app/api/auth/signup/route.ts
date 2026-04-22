import { NextResponse } from "next/server";
import { createCustomer, findCustomerByEmail } from "@/lib/customer-auth";
import { hashPassword } from "@/lib/auth";
import {
  CUSTOMER_SESSION_COOKIE,
  buildSessionToken,
  getSessionCookieOptions,
} from "@/lib/session";

interface SignupBody {
  email?: string;
  fullName?: string;
  password?: string;
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SignupBody;
    const email = normalizeEmail(body.email || "");
    const fullName = (body.fullName || "").trim();
    const password = body.password || "";

    if (!email || !fullName || !password) {
      return NextResponse.json(
        { ok: false, error: "Email, full name, and password are required." },
        { status: 400 }
      );
    }
    if (password.length < 8) {
      return NextResponse.json(
        { ok: false, error: "Password must be at least 8 characters long." },
        { status: 400 }
      );
    }

    const existing = await findCustomerByEmail(email);
    if (existing) {
      return NextResponse.json(
        { ok: false, error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const passwordData = hashPassword(password);
    const customer = await createCustomer({
      email,
      fullName,
      passwordHash: passwordData.hash,
      passwordSalt: passwordData.salt,
    });

    const response = NextResponse.json({
      ok: true,
      data: { customer },
    });
    response.cookies.set(
      CUSTOMER_SESSION_COOKIE,
      buildSessionToken(customer.id),
      getSessionCookieOptions()
    );
    return response;
  } catch (error) {
    console.error("Signup failed:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to create account." },
      { status: 500 }
    );
  }
}
