import { NextResponse } from "next/server";
import { listTodayMenuAvailableForScan } from "@/lib/today-menu-db";

/**
 * GET /api/menu/today
 * Available active items from persistent menu catalog.
 */
export async function GET() {
  try {
    const items = await listTodayMenuAvailableForScan();
    return NextResponse.json({ ok: true, data: items });
  } catch (error) {
    console.error("today menu (public) failed:", error);
    return NextResponse.json(
      { ok: false, error: "Could not load menu items." },
      { status: 500 }
    );
  }
}
