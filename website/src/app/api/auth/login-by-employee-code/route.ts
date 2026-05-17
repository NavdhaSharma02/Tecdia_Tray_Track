import { NextResponse } from "next/server";
import { findCustomerByEmployeeCode } from "@/lib/customer-auth";
import { getCustomerAccountBalance } from "@/lib/customer-activity-db";
import {
  CUSTOMER_SESSION_COOKIE,
  buildSessionToken,
  getSessionCookieOptions,
} from "@/lib/session";

interface LoginBody {
  employeeCode?: string;
}

function normalizeEmployeeCode(value: string): string {
  return value.trim().toUpperCase();
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as LoginBody;
    const employeeCode = normalizeEmployeeCode(body.employeeCode || "");

    if (!employeeCode) {
      return NextResponse.json(
        { ok: false, error: "Employee ID is required." },
        { status: 400 }
      );
    }

    const customer = await findCustomerByEmployeeCode(employeeCode);
    if (!customer) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Employee ID not registered for customer access. Please use email login.",
        },
        { status: 401 }
      );
    }

    const accountBalance = await getCustomerAccountBalance(customer.id);
    const response = NextResponse.json({
      ok: true,
      data: {
        customer: {
          ...customer,
          accountBalance,
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
    console.error("Employee code login failed:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to log in by employee code." },
      { status: 500 }
    );
  }
}
