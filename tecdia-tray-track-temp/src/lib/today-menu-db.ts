import { getDbPool } from "@/lib/db";
import type { MenuItem } from "@/types";

export interface TodayMenuRow {
  id: string;
  name: string;
  category: string;
  price: string;
  calories: number | null;
  image_url: string | null;
  available: boolean;
}

function rowToMenuItem(row: TodayMenuRow): MenuItem {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    price: Number(row.price),
    image: row.image_url,
    available: row.available,
    calories: row.calories,
  };
}

export async function getOrCreateTodayServiceDayId(): Promise<string> {
  const pool = getDbPool();
  let { rows } = await pool.query<{ id: string }>(
    `
    INSERT INTO service_days (service_date)
    VALUES (CURRENT_DATE)
    ON CONFLICT (service_date) DO NOTHING
    RETURNING id;
    `
  );
  if (!rows[0]) {
    ({ rows } = await pool.query<{ id: string }>(
      `SELECT id FROM service_days WHERE service_date = CURRENT_DATE LIMIT 1;`
    ));
  }
  if (!rows[0]) {
    throw new Error("Could not resolve service day for CURRENT_DATE");
  }
  return rows[0].id;
}

/**
 * When the calendar rolls to a new service date, today's menu rows start empty.
 * Copy yesterday's service_day_menu_items (availability + optional override price)
 * onto today so the admin menu and kiosk offerings stay aligned day-to-day.
 */
export async function syncTodayMenuItemsFromYesterday(): Promise<void> {
  const pool = getDbPool();
  await pool.query(
    `
    INSERT INTO service_day_menu_items (service_day_id, menu_item_id, available, override_price)
    SELECT
      today_sd.id,
      y_sdmi.menu_item_id,
      y_sdmi.available,
      y_sdmi.override_price
    FROM service_days yesterday_sd
    JOIN service_day_menu_items y_sdmi ON y_sdmi.service_day_id = yesterday_sd.id
    JOIN service_days today_sd ON today_sd.service_date = CURRENT_DATE
    JOIN menu_items mi ON mi.id = y_sdmi.menu_item_id
    WHERE yesterday_sd.service_date = CURRENT_DATE - INTERVAL '1 day'
      AND mi.is_active = TRUE
    ON CONFLICT (service_day_id, menu_item_id) DO NOTHING;
    `
  );
}

/** Ensure today's service_day row exists and menu links are seeded from yesterday. */
export async function ensureTodayMenuReady(): Promise<void> {
  await getOrCreateTodayServiceDayId();
  await syncTodayMenuItemsFromYesterday();
}

export async function listTodayMenuForAdmin(): Promise<MenuItem[]> {
  await ensureTodayMenuReady();
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
      sdmi.available
    FROM service_day_menu_items sdmi
    JOIN menu_items mi ON mi.id = sdmi.menu_item_id
    JOIN service_days sd ON sd.id = sdmi.service_day_id
    WHERE sd.service_date = CURRENT_DATE
      AND mi.is_active = TRUE
    ORDER BY mi.name ASC;
    `
  );
  return rows.map(rowToMenuItem);
}

export async function listTodayMenuAvailableForScan(): Promise<MenuItem[]> {
  await ensureTodayMenuReady();
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
      sdmi.available
    FROM service_day_menu_items sdmi
    JOIN menu_items mi ON mi.id = sdmi.menu_item_id
    JOIN service_days sd ON sd.id = sdmi.service_day_id
    WHERE sd.service_date = CURRENT_DATE
      AND mi.is_active = TRUE
      AND sdmi.available = TRUE
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
  await ensureTodayMenuReady();
  const serviceDayId = await getOrCreateTodayServiceDayId();

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const insertItem = await client.query<{
      id: string;
      name: string;
      category: string;
      price: string;
      calories: number | null;
      image_url: string | null;
    }>(
      `
      INSERT INTO menu_items (code, name, category, base_price, calories, image_url, is_active)
      VALUES ($1, $2, $3, $4, $5, NULL, TRUE)
      RETURNING id::text, name, category, base_price::text AS price, calories, image_url;
      `,
      [
        uniqueMenuCode(),
        input.name,
        input.category,
        input.price,
        input.calories,
      ]
    );

    const mi = insertItem.rows[0];
    await client.query(
      `
      INSERT INTO service_day_menu_items (service_day_id, menu_item_id, available)
      VALUES ($1, $2::uuid, $3);
      `,
      [serviceDayId, mi.id, input.available]
    );
    await client.query("COMMIT");

    return {
      id: mi.id,
      name: mi.name,
      category: mi.category,
      price: Number(mi.price),
      calories: mi.calories,
      image: mi.image_url,
      available: input.available,
    };
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
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
  await ensureTodayMenuReady();
  const serviceDayId = await getOrCreateTodayServiceDayId();

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const onToday = await client.query(
      `
      SELECT 1
      FROM service_day_menu_items
      WHERE service_day_id = $1 AND menu_item_id = $2::uuid
      LIMIT 1;
      `,
      [serviceDayId, menuItemId]
    );
    if (!onToday.rowCount) {
      await client.query("ROLLBACK");
      return null;
    }

    const upd = await client.query<{
      id: string;
      name: string;
      category: string;
      price: string;
      calories: number | null;
      image_url: string | null;
    }>(
      `
      UPDATE menu_items
      SET name = $2,
          category = $3,
          base_price = $4,
          calories = $5
      WHERE id = $1::uuid
      RETURNING id::text, name, category, base_price::text AS price, calories, image_url;
      `,
      [menuItemId, input.name, input.category, input.price, input.calories]
    );

    if (!upd.rows.length) {
      await client.query("ROLLBACK");
      return null;
    }

    await client.query(
      `
      UPDATE service_day_menu_items
      SET available = $3
      WHERE service_day_id = $1 AND menu_item_id = $2::uuid;
      `,
      [serviceDayId, menuItemId, input.available]
    );

    await client.query("COMMIT");
    const mi = upd.rows[0];
    return {
      id: mi.id,
      name: mi.name,
      category: mi.category,
      price: Number(mi.price),
      calories: mi.calories,
      image: mi.image_url,
      available: input.available,
    };
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

export async function removeMenuItemFromToday(menuItemId: string): Promise<boolean> {
  const pool = getDbPool();
  await ensureTodayMenuReady();
  const serviceDayId = await getOrCreateTodayServiceDayId();

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const del = await client.query(
      `
      DELETE FROM service_day_menu_items
      WHERE service_day_id = $1 AND menu_item_id = $2::uuid
      RETURNING id;
      `,
      [serviceDayId, menuItemId]
    );

    if (!del.rowCount) {
      await client.query("ROLLBACK");
      return false;
    }

    await client.query("COMMIT");
    return true;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}
