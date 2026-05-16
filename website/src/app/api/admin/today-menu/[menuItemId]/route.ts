import { NextResponse } from "next/server";
import {
  RICE_BIG_CATEGORY,
  RICE_BIG_NAME,
  RICE_SMALL_CATEGORY,
  RICE_SMALL_NAME,
  SEBAW_MENU_NAME,
  isCompactDishName,
  isPermanentRiceMenuItem,
  isSebawMenuItem,
} from "@/lib/constants";
import {
  isPermanentMenuItemId,
  removeMenuItemFromToday,
  updateTodayMenuItem,
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

interface RouteParams {
  params: Promise<{ menuItemId: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { menuItemId } = await params;
    if (!menuItemId) {
      return NextResponse.json({ ok: false, error: "Missing id." }, { status: 400 });
    }

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

    if (
      isSebawMenuItem({ name, category }) ||
      name.toLowerCase() === SEBAW_MENU_NAME.toLowerCase()
    ) {
      return NextResponse.json(
        { ok: false, error: "Use the Sebaw panel to update free soup." },
        { status: 400 }
      );
    }
    if (
      isPermanentRiceMenuItem({ name, category }) ||
      category === RICE_BIG_CATEGORY ||
      category === RICE_SMALL_CATEGORY ||
      name === RICE_BIG_NAME ||
      name === RICE_SMALL_NAME
    ) {
      return NextResponse.json(
        { ok: false, error: "Use the Rice portions panel to update rice prices." },
        { status: 400 }
      );
    }

    if (!name || !category) {
      return NextResponse.json(
        { ok: false, error: "Name and category are required." },
        { status: 400 }
      );
    }
    if (!isCompactDishName(name)) {
      return NextResponse.json(
        { ok: false, error: "Dish name must use lowercase letters only; separate words with spaces." },
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
    const item = await updateTodayMenuItem(menuItemId, {
      name,
      category,
      price,
      calories,
      available,
    });

    if (!item) {
      return NextResponse.json({ ok: false, error: "Item not found." }, { status: 404 });
    }
    return NextResponse.json({ ok: true, data: item });
  } catch (error) {
    console.error("admin today-menu PATCH failed:", error);
    return NextResponse.json(
      { ok: false, error: "Could not update menu item." },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const { menuItemId } = await params;
    if (!menuItemId) {
      return NextResponse.json({ ok: false, error: "Missing id." }, { status: 400 });
    }

    if (await isPermanentMenuItemId(menuItemId)) {
      return NextResponse.json(
        { ok: false, error: "Permanent menu items cannot be removed." },
        { status: 400 }
      );
    }

    const ok = await removeMenuItemFromToday(menuItemId);
    if (!ok) {
      return NextResponse.json(
        { ok: false, error: "Item not on today's menu." },
        { status: 404 }
      );
    }
    return NextResponse.json({ ok: true, data: null });
  } catch (error) {
    console.error("admin today-menu DELETE failed:", error);
    return NextResponse.json(
      { ok: false, error: "Could not remove menu item." },
      { status: 500 }
    );
  }
}
