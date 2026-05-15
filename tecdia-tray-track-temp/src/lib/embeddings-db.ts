import { getDbPool } from "@/lib/db";
import { menuItemImageApiPath, menuItemImageExists } from "@/lib/image-store";
import { getOrCreateTodayServiceDayId } from "@/lib/today-menu-db";
import type { MenuItem } from "@/types";

export const CLIP_MODEL_VERSION =
  process.env.ML_MODEL_ID || "Xenova/clip-vit-base-patch32";

export interface TodayEmbeddingRow {
  menu_item_id: string;
  name: string;
  category: string;
  price: string;
  calories: number | null;
  embedding: number[];
}

/** Persist reference image URL and optional catalog embedding on menu_items (permanent). */
export async function upsertMenuItemCatalogReference(input: {
  menuItemId: string;
  imageUrl: string;
  imagePath?: string | null;
  /** Omit to leave existing embedding unchanged; pass null to clear. */
  embedding?: number[] | null;
}): Promise<void> {
  const pool = getDbPool();

  if (input.embedding === undefined) {
    await pool.query(
      `
      UPDATE menu_items
      SET image_url = $2
      WHERE id = $1::uuid;
      `,
      [input.menuItemId, input.imageUrl]
    );
    return;
  }

  await pool.query(
    `
    UPDATE menu_items
    SET
      image_url = $2,
      reference_embedding = $3::jsonb,
      reference_model_version = CASE WHEN $3::jsonb IS NOT NULL THEN $4 ELSE NULL END
    WHERE id = $1::uuid;
    `,
    [
      input.menuItemId,
      input.imageUrl,
      input.embedding ? JSON.stringify(input.embedding) : null,
      CLIP_MODEL_VERSION,
    ]
  );
}

export async function clearMenuItemCatalogReference(
  menuItemId: string
): Promise<void> {
  const pool = getDbPool();
  await pool.query(
    `
    UPDATE menu_items
    SET image_url = NULL, reference_embedding = NULL, reference_model_version = NULL
    WHERE id = $1::uuid;
    `,
    [menuItemId]
  );
}

export async function hasCatalogEmbedding(menuItemId: string): Promise<boolean> {
  const pool = getDbPool();
  const { rows } = await pool.query<{ ok: number }>(
    `
    SELECT 1 AS ok
    FROM menu_items
    WHERE id = $1::uuid AND reference_embedding IS NOT NULL
    LIMIT 1;
    `,
    [menuItemId]
  );
  return rows.length > 0;
}

export async function upsertMenuItemDayEmbedding(input: {
  menuItemId: string;
  serviceDayId: string;
  embedding: number[];
  imagePath: string | null;
}): Promise<void> {
  const pool = getDbPool();
  await pool.query(
    `
    INSERT INTO menu_item_day_embeddings (
      menu_item_id,
      service_day_id,
      embedding,
      model_version,
      image_path,
      updated_at
    )
    VALUES ($1::uuid, $2::uuid, $3::jsonb, $4, $5, NOW())
    ON CONFLICT (menu_item_id, service_day_id)
    DO UPDATE SET
      embedding = EXCLUDED.embedding,
      model_version = EXCLUDED.model_version,
      image_path = EXCLUDED.image_path,
      updated_at = NOW();
    `,
    [
      input.menuItemId,
      input.serviceDayId,
      JSON.stringify(input.embedding),
      CLIP_MODEL_VERSION,
      input.imagePath,
    ]
  );
}

export async function deleteMenuItemDayEmbedding(
  menuItemId: string,
  serviceDayId: string
): Promise<void> {
  const pool = getDbPool();
  await pool.query(
    `
    DELETE FROM menu_item_day_embeddings
    WHERE menu_item_id = $1::uuid AND service_day_id = $2::uuid;
    `,
    [menuItemId, serviceDayId]
  );
}

export async function hasTodayEmbedding(menuItemId: string): Promise<boolean> {
  const serviceDayId = await getOrCreateTodayServiceDayId();
  const pool = getDbPool();
  const { rows } = await pool.query<{ ok: number }>(
    `
    SELECT 1 AS ok
    FROM menu_item_day_embeddings
    WHERE menu_item_id = $1::uuid AND service_day_id = $2::uuid
    LIMIT 1;
    `,
    [menuItemId, serviceDayId]
  );
  return rows.length > 0;
}

/** Available today + has a permanent catalog embedding (for CLIP scan). */
export async function listTodayEmbeddingsForScan(): Promise<TodayEmbeddingRow[]> {
  const pool = getDbPool();
  const { rows } = await pool.query<{
    menu_item_id: string;
    name: string;
    category: string;
    price: string;
    calories: number | null;
    embedding: number[] | string;
  }>(
    `
    SELECT
      mi.id::text AS menu_item_id,
      mi.name,
      mi.category,
      mi.base_price::text AS price,
      mi.calories,
      mi.reference_embedding AS embedding
    FROM menu_items mi
    JOIN service_day_menu_items sdmi ON sdmi.menu_item_id = mi.id
    JOIN service_days sd ON sd.id = sdmi.service_day_id
    WHERE sd.service_date = CURRENT_DATE
      AND sdmi.available = TRUE
      AND mi.is_active = TRUE
      AND mi.reference_embedding IS NOT NULL
    ORDER BY mi.name ASC;
    `
  );

  return rows.map((row) => ({
    menu_item_id: row.menu_item_id,
    name: row.name,
    category: row.category,
    price: row.price,
    calories: row.calories,
    embedding: normalizeEmbeddingJson(row.embedding),
  }));
}

function normalizeEmbeddingJson(raw: number[] | string): number[] {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") return JSON.parse(raw) as number[];
  return raw as number[];
}

export function embeddingRowToScannedItem(
  row: TodayEmbeddingRow,
  confidence: number
): import("@/types").ScannedItem {
  return {
    id: row.menu_item_id,
    name: row.name,
    category: row.category,
    price: Number(row.price),
    quantity: 1,
    confidence: parseFloat(confidence.toFixed(4)),
    calories: row.calories,
  };
}

export async function countTodayEmbeddings(): Promise<number> {
  const rows = await listTodayEmbeddingsForScan();
  return rows.length;
}

export async function enrichMenuItemsWithEmbeddingFlags(
  items: MenuItem[]
): Promise<MenuItem[]> {
  if (items.length === 0) return items;
  const pool = getDbPool();
  const ids = items.map((i) => i.id);
  const { rows } = await pool.query<{
    id: string;
    image_url: string | null;
    has_embedding: boolean;
  }>(
    `
    SELECT
      id::text,
      image_url,
      (reference_embedding IS NOT NULL) AS has_embedding
    FROM menu_items
    WHERE id = ANY($1::uuid[]);
    `,
    [ids]
  );
  const byId = new Map(rows.map((r) => [r.id, r]));

  return Promise.all(
    items.map(async (item) => {
      const row = byId.get(item.id);
      const hasFile = await menuItemImageExists(item.id);
      const imageUrl =
        row?.image_url ||
        item.image ||
        (hasFile ? menuItemImageApiPath(item.id) : null);

      if (hasFile && !row?.image_url) {
        await upsertMenuItemCatalogReference({
          menuItemId: item.id,
          imageUrl: menuItemImageApiPath(item.id),
        });
      }

      return {
        ...item,
        hasEmbedding: row?.has_embedding ?? false,
        image: imageUrl,
        hasReferencePhoto: Boolean(imageUrl || hasFile),
      };
    })
  );
}
