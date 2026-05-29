import { NextResponse } from "next/server";
import {
  removeEmployeeByCode,
  updateEmployeeProfileByCode,
} from "@/lib/employee-admin-db";

interface RouteParams {
  params: Promise<{ employeeCode: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { employeeCode } = await params;
    const body = (await request.json()) as {
      employeeCode?: string;
      fullName?: string;
      department?: string;
    };
    const nextEmployeeCode = (body.employeeCode || "").trim().toUpperCase();
    const fullName = (body.fullName || "").trim();
    const department = (body.department || "").trim();

    if (!employeeCode || !nextEmployeeCode || !fullName || !department) {
      return NextResponse.json(
        { ok: false, error: "Employee ID, full name, and department are required." },
        { status: 400 }
      );
    }

    const updated = await updateEmployeeProfileByCode({
      currentEmployeeCode: employeeCode,
      nextEmployeeCode,
      fullName,
      department,
    });
    if (!updated) {
      return NextResponse.json(
        { ok: false, error: "Employee not found." },
        { status: 404 }
      );
    }
    return NextResponse.json({ ok: true, data: null });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "23505"
    ) {
      return NextResponse.json(
        { ok: false, error: "Employee ID already exists." },
        { status: 409 }
      );
    }
    console.error("Employee update failed:", error);
    return NextResponse.json(
      { ok: false, error: "Could not update employee profile." },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const { employeeCode } = await params;
    if (!employeeCode) {
      return NextResponse.json(
        { ok: false, error: "Employee ID is required." },
        { status: 400 }
      );
    }

    const removed = await removeEmployeeByCode(employeeCode);
    if (!removed) {
      return NextResponse.json(
        { ok: false, error: "Employee not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, data: null });
  } catch (error) {
    console.error("Employee remove failed:", error);
    return NextResponse.json(
      { ok: false, error: "Could not remove employee." },
      { status: 500 }
    );
  }
}
