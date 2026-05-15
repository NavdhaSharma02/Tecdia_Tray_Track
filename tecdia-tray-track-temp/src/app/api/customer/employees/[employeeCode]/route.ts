import { NextResponse } from "next/server";
import { getEmployeeProfileByCode } from "@/lib/customer-profile";

interface RouteContext {
  params: Promise<{ employeeCode: string }>;
}

/** GET /api/customer/employees/:employeeCode — kiosk lookup by employee ID. */
export async function GET(_request: Request, context: RouteContext) {
  try {
    const { employeeCode } = await context.params;
    const employee = await getEmployeeProfileByCode(
      decodeURIComponent(employeeCode)
    );
    if (!employee) {
      return NextResponse.json(
        { ok: false, error: "Employee not found." },
        { status: 404 }
      );
    }
    return NextResponse.json({ ok: true, data: employee });
  } catch (error) {
    console.error("Employee lookup failed:", error);
    return NextResponse.json(
      { ok: false, error: "Could not load employee." },
      { status: 500 }
    );
  }
}
