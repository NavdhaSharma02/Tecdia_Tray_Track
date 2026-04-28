import { getDbPool } from "@/lib/db";
import type { MenuItem } from "@/types";

export interface TodayMenuRow {
  id: string;
  name: string;
  category: string;
  price: string;
  calories: number | null;
  image_url: string | null;
  is_active: boolean;
}

function rowToMenuItem(row: TodayMenuRow): MenuItem {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    price: Number(row.price),
    image: row.image_url,
    available: row.is_active,
    calories: row.calories,
  };
}

export async function getOrCreateTodayServiceDayId(): Promise<string> {
  // Kept for compatibility with older call sites; no longer used for persistent menu.
  return "not-used";
}

export async function listTodayMenuForAdmin(): Promise<MenuItem[]> {
  const pool = getDbPool();
  const { rows } = await pool.query<TodayMenuRow>(
    `
    SELECT
      mi.id::text AS id,
      mi.name,
      mi.category,
      mi.base_price::text AS price,
      mi.calories,
      mi.image_url,
      mi.is_active
    FROM menu_items mi
    ORDER BY mi.name ASC;
    `
  );
  return rows.map(rowToMenuItem);
}

export async function listTodayMenuAvailableForScan(): Promise<MenuItem[]> {
  const pool = getDbPool();
  const { rows } = await pool.query<TodayMenuRow>(
    `
    SELECT
      mi.id::text AS id,
      mi.name,
      mi.category,
      mi.base_price::text AS price,
      mi.calories,
      mi.image_url,
      mi.is_active
    FROM menu_items mi
    WHERE mi.is_active = TRUE
    ORDER BY mi.name ASC;
    `
  );
  return rows.map(rowToMenuItem);
}

function uniqueMenuCode(): string {
  return `M-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function insertTodayMenuItem(input: {
  name: string;
  category: string;
  price: number;
  calories: number | null;
  available: boolean;
}): Promise<MenuItem> {
  const pool = getDbPool();
  const inserted = await pool.query<TodayMenuRow>(
    `
    INSERT INTO menu_items (code, name, category, base_price, calories, image_url, is_active)
    VALUES ($1, $2, $3, $4, $5, NULL, $6)
    RETURNING
      id::text AS id,
      name,
      category,
      base_price::text AS price,
      calories,
      image_url,
      is_active;
    `,
    [
      uniqueMenuCode(),
      input.name,
      input.category,
      input.price,
      input.calories,
      input.available,
    ]
  );
  return rowToMenuItem(inserted.rows[0]);
}

export async function updateTodayMenuItem(
  menuItemId: string,
  input: {
    name: string;
    category: string;
    price: number;
    calories: number | null;
    available: boolean;
  }
): Promise<MenuItem | null> {
  const pool = getDbPool();
  const upd = await pool.query<TodayMenuRow>(
    `
    UPDATE menu_items
    SET name = $2,
        category = $3,
        base_price = $4,
        calories = $5,
        is_active = $6
    WHERE id = $1::uuid
    RETURNING
      id::text AS id,
      name,
      category,
      base_price::text AS price,
      calories,
      image_url,
      is_active;
    `,
    [menuItemId, input.name, input.category, input.price, input.calories, input.available]
  );
  if (!upd.rows.length) return null;
  return rowToMenuItem(upd.rows[0]);
}

export async function removeMenuItemFromToday(menuItemId: string): Promise<boolean> {
  const pool = getDbPool();
  const del = await pool.query(
    `
    DELETE FROM menu_items
    WHERE id = $1::uuid
    RETURNING id;
    `,
    [menuItemId]
  );
  return Boolean(del.rowCount);
}
