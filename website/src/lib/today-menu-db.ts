import { getDbPool } from "@/lib/db";
import {
  RICE_BIG_CATEGORY,
  RICE_BIG_CODE,
  RICE_BIG_NAME,
  RICE_SMALL_CATEGORY,
  RICE_SMALL_CODE,
  RICE_SMALL_NAME,
  SEBAW_MENU_CODE,
  SEBAW_MENU_NAME,
  SOUP_CATEGORY,
} from "@/lib/constants";
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
  await ensurePermanentRiceForToday();
}

export interface PermanentRicePrices {
  rice_big: number;
  rice_small: number;
}

/** Ensure catalog rows for YOLO rice classes and link them to today's menu. */
export async function ensurePermanentRiceForToday(
  prices?: Partial<PermanentRicePrices>
): Promise<{ rice_big: MenuItem; rice_small: MenuItem }> {
  const pool = getDbPool();
  const serviceDayId = await getOrCreateTodayServiceDayId();

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const existing = await client.query<{ code: string; price: string }>(
      `
      SELECT code, base_price::text AS price
      FROM menu_items
      WHERE code IN ($1, $2);
      `,
      [RICE_BIG_CODE, RICE_SMALL_CODE]
    );
    const priceByCode = new Map(existing.rows.map((r) => [r.code, Number(r.price)]));

    const riceBigPrice = prices?.rice_big ?? priceByCode.get(RICE_BIG_CODE) ?? 0;
    const riceSmallPrice = prices?.rice_small ?? priceByCode.get(RICE_SMALL_CODE) ?? 0;

    const upsertOne = async (
      code: string,
      name: string,
      category: string,
      price: number
    ): Promise<TodayMenuRow> => {
      const catalog = await client.query<{
        id: string;
        name: string;
        category: string;
        price: string;
        calories: number | null;
        image_url: string | null;
      }>(
        `
        INSERT INTO menu_items (code, name, category, base_price, calories, image_url, is_active)
        VALUES ($1, $2, $3, $4, NULL, NULL, TRUE)
        ON CONFLICT (code) DO UPDATE SET
          name = EXCLUDED.name,
          category = EXCLUDED.category,
          base_price = EXCLUDED.base_price,
          is_active = TRUE
        RETURNING id::text, name, category, base_price::text AS price, calories, image_url;
        `,
        [code, name, category, price]
      );

      const mi = catalog.rows[0];
      await client.query(
        `
        INSERT INTO service_day_menu_items (service_day_id, menu_item_id, available)
        VALUES ($1, $2::uuid, TRUE)
        ON CONFLICT (service_day_id, menu_item_id)
        DO UPDATE SET available = TRUE;
        `,
        [serviceDayId, mi.id]
      );

      return {
        id: mi.id,
        name: mi.name,
        category: mi.category,
        price: mi.price,
        calories: mi.calories,
        image_url: mi.image_url,
        available: true,
      };
    };

    const riceBig = await upsertOne(
      RICE_BIG_CODE,
      RICE_BIG_NAME,
      RICE_BIG_CATEGORY,
      riceBigPrice
    );
    const riceSmall = await upsertOne(
      RICE_SMALL_CODE,
      RICE_SMALL_NAME,
      RICE_SMALL_CATEGORY,
      riceSmallPrice
    );

    await client.query("COMMIT");

    return {
      rice_big: rowToMenuItem(riceBig),
      rice_small: rowToMenuItem(riceSmall),
    };
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

export async function updatePermanentRicePrices(
  prices: PermanentRicePrices
): Promise<{ rice_big: MenuItem; rice_small: MenuItem }> {
  if (!Number.isFinite(prices.rice_big) || prices.rice_big < 0) {
    throw new Error("Valid rice_big price is required.");
  }
  if (!Number.isFinite(prices.rice_small) || prices.rice_small < 0) {
    throw new Error("Valid rice_small price is required.");
  }
  return ensurePermanentRiceForToday(prices);
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

/** Ensure catalog row for free meatless soup (Sebaw) and link to today's menu. */
export async function upsertSebawForToday(available: boolean): Promise<MenuItem> {
  const pool = getDbPool();
  await ensureTodayMenuReady();
  const serviceDayId = await getOrCreateTodayServiceDayId();

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const catalog = await client.query<{
      id: string;
      name: string;
      category: string;
      price: string;
      calories: number | null;
      image_url: string | null;
    }>(
      `
      INSERT INTO menu_items (code, name, category, base_price, calories, image_url, is_active)
      VALUES ($1, $2, $3, 0, NULL, NULL, TRUE)
      ON CONFLICT (code) DO UPDATE SET
        name = EXCLUDED.name,
        category = EXCLUDED.category,
        base_price = EXCLUDED.base_price,
        calories = EXCLUDED.calories,
        is_active = TRUE
      RETURNING id::text, name, category, base_price::text AS price, calories, image_url;
      `,
      [SEBAW_MENU_CODE, SEBAW_MENU_NAME, SOUP_CATEGORY]
    );

    const mi = catalog.rows[0];
    await client.query(
      `
      INSERT INTO service_day_menu_items (service_day_id, menu_item_id, available)
      VALUES ($1, $2::uuid, $3)
      ON CONFLICT (service_day_id, menu_item_id)
      DO UPDATE SET available = EXCLUDED.available;
      `,
      [serviceDayId, mi.id, available]
    );

    await client.query("COMMIT");

    return {
      id: mi.id,
      name: mi.name,
      category: mi.category,
      price: Number(mi.price),
      calories: mi.calories,
      image: mi.image_url,
      available,
    };
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

export async function isPermanentMenuItemId(menuItemId: string): Promise<boolean> {
  const pool = getDbPool();
  const { rows } = await pool.query<{ code: string }>(
    `SELECT code FROM menu_items WHERE id = $1::uuid LIMIT 1;`,
    [menuItemId]
  );
  const code = rows[0]?.code;
  return (
    code === SEBAW_MENU_CODE || code === RICE_BIG_CODE || code === RICE_SMALL_CODE
  );
}

export async function removeMenuItemFromToday(menuItemId: string): Promise<boolean> {
  const pool = getDbPool();
  await ensureTodayMenuReady();
  if (await isPermanentMenuItemId(menuItemId)) {
    return false;
  }
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
