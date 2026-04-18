import { NextResponse } from "next/server";
import {
  insertTodayMenuItem,
  listTodayMenuForAdmin,
} from "@/lib/today-menu-db";

function parseCalories(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string" && typeof value !== "number") return null;
  const s = String(value).trim();
  if (s === "" || s.toLowerCase() === "n/a") return null;
  const n = Number.parseInt(s, 10);
  if (Number.isNaN(n) || n < 0) return null;
  return n;
}

/**
 * GET /api/admin/today-menu — all items scheduled for today (admin UI).
 */
export async function GET() {
  try {
    const items = await listTodayMenuForAdmin();
    return NextResponse.json({ ok: true, data: items });
  } catch (error) {
    console.error("admin today-menu GET failed:", error);
    return NextResponse.json(
      { ok: false, error: "Could not load today's menu." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/today-menu — add item to today's menu (and catalog row).
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: string;
      category?: string;
      price?: number;
      calories?: string | number | null;
      available?: boolean;
    };

    const name = (body.name || "").trim();
    const category = (body.category || "").trim();
    const price = Number(body.price);
    const available = body.available !== false;

    if (!name || !category) {
      return NextResponse.json(
        { ok: false, error: "Name and category are required." },
        { status: 400 }
      );
    }
    if (!Number.isFinite(price) || price < 0) {
      return NextResponse.json(
        { ok: false, error: "Valid price is required." },
        { status: 400 }
      );
    }

    const calories = parseCalories(body.calories);
    const item = await insertTodayMenuItem({
      name,
      category,
      price,
      calories,
      available,
    });
    return NextResponse.json({ ok: true, data: item });
  } catch (error) {
    console.error("admin today-menu POST failed:", error);
    return NextResponse.json(
      { ok: false, error: "Could not add menu item." },
      { status: 500 }
    );
  }
}
