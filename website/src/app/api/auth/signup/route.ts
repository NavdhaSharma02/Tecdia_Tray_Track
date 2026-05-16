import { NextResponse } from "next/server";
import {
  createCustomer,
  findCustomerByEmail,
  findCustomerByEmployeeCode,
} from "@/lib/customer-auth";
import { hashPassword } from "@/lib/auth";
import {
  CUSTOMER_SESSION_COOKIE,
  buildSessionToken,
  getSessionCookieOptions,
} from "@/lib/session";

interface SignupBody {
  employeeCode?: string;
  email?: string;
  fullName?: string;
  department?: string;
  password?: string;
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeEmployeeCode(value: string): string {
  return value.trim().toUpperCase();
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SignupBody;
    const employeeCode = normalizeEmployeeCode(body.employeeCode || "");
    const email = normalizeEmail(body.email || "");
    const fullName = (body.fullName || "").trim();
    const department = (body.department || "").trim();
    const password = body.password || "";

    if (!employeeCode || !email || !fullName || !department || !password) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Employee ID, email, full name, department, and password are required.",
        },
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
    const existingEmployeeCode = await findCustomerByEmployeeCode(employeeCode);
    if (existingEmployeeCode) {
      return NextResponse.json(
        { ok: false, error: "This employee ID is already registered." },
        { status: 409 }
      );
    }

    const passwordData = hashPassword(password);
    const customer = await createCustomer({
      employeeCode,
      email,
      fullName,
      department,
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
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "23505"
    ) {
      return NextResponse.json(
        { ok: false, error: "Email or employee ID already exists." },
        { status: 409 }
      );
    }
    console.error("Signup failed:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to create account." },
      { status: 500 }
    );
  }
}
