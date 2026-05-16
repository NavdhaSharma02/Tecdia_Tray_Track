import { NextResponse } from "next/server";
import { listTodayMenuAvailableForScan } from "@/lib/today-menu-db";

/**
 * GET /api/menu/today
 * Available items for the current service day.
 */
export async function GET() {
  try {
    const items = await listTodayMenuAvailableForScan();
    return NextResponse.json({ ok: true, data: items });
  } catch (error) {
    console.error("today menu (public) failed:", error);
    return NextResponse.json(
      { ok: false, error: "Could not load today's menu." },
      { status: 500 }
    );
  }
}
