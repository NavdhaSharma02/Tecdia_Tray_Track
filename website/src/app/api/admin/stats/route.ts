import { NextResponse } from "next/server";
import { getAdminDashboardStats } from "@/lib/admin-stats-db";

export async function GET() {
  try {
    const stats = await getAdminDashboardStats();
    return NextResponse.json({ ok: true, data: stats });
  } catch (error) {
    console.error("Admin stats load failed:", error);
    return NextResponse.json(
      { ok: false, error: "Could not load dashboard stats." },
      { status: 500 }
    );
  }
}
