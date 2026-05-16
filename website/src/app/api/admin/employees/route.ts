import { NextResponse } from "next/server";
import { listEmployeesForAdmin } from "@/lib/employee-admin-db";

export async function GET() {
  try {
    const employees = await listEmployeesForAdmin();
    return NextResponse.json({ ok: true, data: employees });
  } catch (error) {
    console.error("Admin employees load failed:", error);
    return NextResponse.json(
      { ok: false, error: "Could not load employees." },
      { status: 500 }
    );
  }
}
