import { NextResponse } from "next/server";
import { findCustomerByEmail } from "@/lib/customer-auth";
import { verifyPassword } from "@/lib/auth";
import {
  CUSTOMER_SESSION_COOKIE,
  buildSessionToken,
  getSessionCookieOptions,
} from "@/lib/session";

interface LoginBody {
  email?: string;
  password?: string;
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as LoginBody;
    const email = normalizeEmail(body.email || "");
    const password = body.password || "";

    if (!email || !password) {
      return NextResponse.json(
        { ok: false, error: "Email and password are required." },
        { status: 400 }
      );
    }

    const customer = await findCustomerByEmail(email);
    if (!customer) {
      return NextResponse.json(
        { ok: false, error: "Invalid email or password." },
        { status: 401 }
      );
    }

    const isValid = verifyPassword(
      password,
      customer.passwordSalt,
      customer.passwordHash
    );

    if (!isValid) {
      return NextResponse.json(
        { ok: false, error: "Invalid email or password." },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      ok: true,
      data: {
        customer: {
          id: customer.id,
          employeeCode: customer.employeeCode,
          email: customer.email,
          fullName: customer.fullName,
          department: customer.department,
          createdAt: customer.createdAt,
        },
      },
    });
    response.cookies.set(
      CUSTOMER_SESSION_COOKIE,
      buildSessionToken(customer.id),
      getSessionCookieOptions()
    );
    return response;
  } catch (error) {
    console.error("Login failed:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to log in." },
      { status: 500 }
    );
  }
}
