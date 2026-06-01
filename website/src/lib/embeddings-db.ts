import { createHash } from "crypto";
import { normalizeDishName, buildDishNameIndex } from "@/lib/dish-name-match";
import { getDbPool } from "@/lib/db";
import {
  legacyMenuItemImagePath,
  listMenuItemImageUuidsFromBankRows,
  menuItemImageApiPath,
  type MenuItemImageBankRow,
} from "@/lib/image-store";
import { access } from "fs/promises";
import { getOrCreateTodayServiceDayId } from "@/lib/today-menu-db";
import type { MenuItem } from "@/types";

export const CLIP_MODEL_VERSION =
  process.env.ML_MODEL_ID || "Xenova/clip-vit-base-patch32";

export type EmbeddingSource =
  | "admin_upload"
  | "catalog_legacy"
  | "computer_vision_image"
  | "computer_vision_text"
  | "rebuild_disk";

/** One CLIP prototype used during tray matching. */
export interface EmbeddingPrototypeRow {
  menu_item_id: string;
  name: string;
  category: string;
  price: string;
  calories: number | null;
  embedding: number[];
}

/** @deprecated Use EmbeddingPrototypeRow — kept for callers that import the old name. */
export type TodayEmbeddingRow = EmbeddingPrototypeRow;

function normalizeEmbeddingJson(raw: number[] | string): number[] {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") return JSON.parse(raw) as number[];
  return raw as number[];
}

export function embeddingVectorHash(embedding: number[]): string {
  return createHash("sha256")
    .update(JSON.stringify(embedding))
    .digest("hex")
    .slice(0, 24);
}

/** Persist reference image URL and optional catalog embedding on menu_items (permanent). */
export async function upsertMenuItemCatalogReference(input: {
  menuItemId: string;
  imageUrl: string;
  imagePath?: string | null;
  /** Omit to leave existing embedding unchanged; pass null to clear legacy column only. */
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

/** Append a prototype; returns true when a new row was inserted. */
export async function insertMenuItemEmbedding(input: {
  menuItemId: string | null;
  referenceName: string;
  embedding: number[];
  modelVersion: string;
  source: EmbeddingSource;
  sourceKey: string;
}): Promise<boolean> {
  const pool = getDbPool();
  const { rowCount } = await pool.query(
    `
    INSERT INTO menu_item_embedding_bank (
      menu_item_id,
      reference_name,
      embedding,
      model_version,
      source,
      source_key
    )
    VALUES ($1::uuid, $2, $3::jsonb, $4, $5, $6)
    ON CONFLICT (reference_name, source, source_key) DO NOTHING;
    `,
    [
      input.menuItemId,
      input.referenceName,
      JSON.stringify(input.embedding),
      input.modelVersion,
      input.source,
      input.sourceKey,
    ]
  );
  return (rowCount ?? 0) > 0;
}

/** Add admin/rebuild embedding and refresh legacy reference_embedding to latest. */
export async function appendMenuItemEmbedding(input: {
  menuItemId: string;
  referenceName: string;
  embedding: number[];
  modelVersion?: string;
  source: EmbeddingSource;
  sourceKey?: string;
}): Promise<void> {
  const modelVersion = input.modelVersion ?? CLIP_MODEL_VERSION;
  const sourceKey =
    input.sourceKey ?? `${input.source}:${embeddingVectorHash(input.embedding)}`;

  await insertMenuItemEmbedding({
    menuItemId: input.menuItemId,
    referenceName: input.referenceName,
    embedding: input.embedding,
    modelVersion,
    source: input.source,
    sourceKey,
  });

  await poolSetLatestReferenceEmbedding(input.menuItemId, input.embedding, modelVersion);
}

async function poolSetLatestReferenceEmbedding(
  menuItemId: string,
  embedding: number[],
  modelVersion: string
): Promise<void> {
  const pool = getDbPool();
  await pool.query(
    `
    UPDATE menu_items
    SET
      reference_embedding = $2::jsonb,
      reference_model_version = $3
    WHERE id = $1::uuid;
    `,
    [menuItemId, JSON.stringify(embedding), modelVersion]
  );
}

export async function deleteMenuItemEmbeddingsBySource(
  menuItemId: string,
  sources: EmbeddingSource[]
): Promise<void> {
  if (sources.length === 0) return;
  const pool = getDbPool();
  await pool.query(
    `
    DELETE FROM menu_item_embedding_bank
    WHERE menu_item_id = $1::uuid AND source = ANY($2::text[]);
    `,
    [menuItemId, sources]
  );
}

export async function deleteMenuItemEmbeddingBySourceKey(
  menuItemId: string,
  source: EmbeddingSource,
  sourceKey: string
): Promise<void> {
  const pool = getDbPool();
  await pool.query(
    `
    DELETE FROM menu_item_embedding_bank
    WHERE menu_item_id = $1::uuid AND source = $2 AND source_key = $3;
    `,
    [menuItemId, source, sourceKey]
  );
}

export async function listMenuItemEmbeddingBankRows(
  menuItemId: string
): Promise<MenuItemImageBankRow[]> {
  const pool = getDbPool();
  const { rows } = await pool.query<{
    source: string;
    source_key: string;
    created_at: Date;
  }>(
    `
    SELECT source, source_key, created_at
    FROM menu_item_embedding_bank
    WHERE menu_item_id = $1::uuid
    ORDER BY created_at ASC;
    `,
    [menuItemId]
  );
  return rows;
}

async function listUploadBankRowsForMenuItems(
  menuItemIds: string[]
): Promise<Map<string, MenuItemImageBankRow[]>> {
  const byItem = new Map<string, MenuItemImageBankRow[]>();
  if (menuItemIds.length === 0) return byItem;

  const pool = getDbPool();
  try {
    const { rows } = await pool.query<{
      menu_item_id: string;
      source: string;
      source_key: string;
      created_at: Date;
    }>(
      `
      SELECT menu_item_id::text, source, source_key, created_at
      FROM menu_item_embedding_bank
      WHERE menu_item_id = ANY($1::uuid[])
        AND source IN ('admin_upload', 'rebuild_disk')
      ORDER BY created_at ASC;
      `,
      [menuItemIds]
    );

    for (const id of menuItemIds) {
      byItem.set(id, []);
    }
    for (const row of rows) {
      const list = byItem.get(row.menu_item_id) ?? [];
      list.push({
        source: row.source,
        source_key: row.source_key,
        created_at: row.created_at,
      });
      byItem.set(row.menu_item_id, list);
    }
  } catch {
    /* table may not exist before migration 009 */
  }

  return byItem;
}

async function countBankRowsForMenuItems(
  items: { id: string; name: string }[]
): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  if (items.length === 0) return counts;

  const pool = getDbPool();
  try {
    const { rows: bankRows } = await pool.query<{
      menu_item_id: string | null;
      reference_name: string;
    }>(`
      SELECT menu_item_id::text, reference_name
      FROM menu_item_embedding_bank;
    `);

    const normToItemId = new Map(
      items.map((item) => [normalizeDishName(item.name), item.id])
    );

    for (const item of items) {
      counts.set(item.id, 0);
    }

    for (const bank of bankRows) {
      const targetId =
        (bank.menu_item_id && counts.has(bank.menu_item_id)
          ? bank.menu_item_id
          : undefined) ??
        normToItemId.get(normalizeDishName(bank.reference_name));
      if (!targetId) continue;
      counts.set(targetId, (counts.get(targetId) ?? 0) + 1);
    }
  } catch {
    /* table may not exist before migration 009 */
  }

  return counts;
}

export async function countMenuItemEmbeddings(
  menuItemId: string,
  menuItemName?: string
): Promise<number> {
  if (menuItemName) {
    const counts = await countBankRowsForMenuItems([
      { id: menuItemId, name: menuItemName },
    ]);
    return counts.get(menuItemId) ?? 0;
  }

  const pool = getDbPool();
  const { rows } = await pool.query<{ count: string }>(
    `
    SELECT COUNT(*)::text AS count
    FROM menu_item_embedding_bank
    WHERE menu_item_id = $1::uuid;
    `,
    [menuItemId]
  );
  return Number(rows[0]?.count ?? 0);
}

export async function hasCatalogEmbedding(menuItemId: string): Promise<boolean> {
  const count = await countMenuItemEmbeddings(menuItemId);
  if (count > 0) return true;

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

/** Copy single legacy reference_embedding rows into the accumulating bank once. */
export async function migrateLegacyCatalogEmbeddings(): Promise<number> {
  const pool = getDbPool();
  const { rows } = await pool.query<{
    id: string;
    name: string;
    reference_embedding: number[] | string;
    reference_model_version: string | null;
  }>(
    `
    SELECT
      id::text,
      name,
      reference_embedding,
      reference_model_version
    FROM menu_items
    WHERE reference_embedding IS NOT NULL;
    `
  );

  let migrated = 0;
  for (const row of rows) {
    const embedding = normalizeEmbeddingJson(row.reference_embedding);
    const added = await insertMenuItemEmbedding({
      menuItemId: row.id,
      referenceName: row.name,
      embedding,
      modelVersion: row.reference_model_version ?? CLIP_MODEL_VERSION,
      source: "catalog_legacy",
      sourceKey: "legacy",
    });
    if (added) migrated += 1;
  }
  return migrated;
}

export async function listAllActiveMenuItemsForVisionSync(): Promise<
  { id: string; name: string }[]
> {
  const pool = getDbPool();
  const { rows } = await pool.query<{ id: string; name: string }>(
    `
    SELECT id::text, name
    FROM menu_items
    WHERE is_active = TRUE
    ORDER BY name ASC;
    `
  );
  return rows;
}

export async function getEmbeddingBankSyncFingerprint(
  source: string
): Promise<string | null> {
  const pool = getDbPool();
  const { rows } = await pool.query<{ fingerprint: string }>(
    `
    SELECT fingerprint
    FROM embedding_bank_sync_state
    WHERE source = $1
    LIMIT 1;
    `,
    [source]
  );
  return rows[0]?.fingerprint ?? null;
}

export async function setEmbeddingBankSyncFingerprint(
  source: string,
  fingerprint: string,
  prototypeCount: number
): Promise<void> {
  const pool = getDbPool();
  await pool.query(
    `
    INSERT INTO embedding_bank_sync_state (source, fingerprint, prototype_count, synced_at)
    VALUES ($1, $2, $3, NOW())
    ON CONFLICT (source) DO UPDATE SET
      fingerprint = EXCLUDED.fingerprint,
      prototype_count = EXCLUDED.prototype_count,
      synced_at = NOW();
    `,
    [source, fingerprint, prototypeCount]
  );
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
  return hasCatalogEmbedding(menuItemId);
}

async function listTodayMenuRowsForScan(): Promise<
  {
    menu_item_id: string;
    name: string;
    category: string;
    price: string;
    calories: number | null;
  }[]
> {
  const pool = getDbPool();
  const { rows } = await pool.query<{
    menu_item_id: string;
    name: string;
    category: string;
    price: string;
    calories: number | null;
  }>(
    `
    SELECT
      mi.id::text AS menu_item_id,
      mi.name,
      mi.category,
      mi.base_price::text AS price,
      mi.calories
    FROM menu_items mi
    JOIN service_day_menu_items sdmi ON sdmi.menu_item_id = mi.id
    JOIN service_days sd ON sd.id = sdmi.service_day_id
    WHERE sd.service_date = CURRENT_DATE
      AND sdmi.available = TRUE
      AND mi.is_active = TRUE
    ORDER BY mi.name ASC;
    `
  );
  return rows;
}

/** All prototypes for today's available menu (flat list — multiple per dish). */
export async function listEmbeddingPrototypesForScan(): Promise<
  EmbeddingPrototypeRow[]
> {
  const pool = getDbPool();
  const menuRows = await listTodayMenuRowsForScan();
  if (menuRows.length === 0) return [];

  const menuById = new Map(menuRows.map((row) => [row.menu_item_id, row]));
  const menuByName = buildDishNameIndex(menuRows);

  try {
    const { rows: bankRows } = await pool.query<{
      menu_item_id: string | null;
      reference_name: string;
      embedding: number[] | string;
    }>(`
      SELECT menu_item_id::text, reference_name, embedding
      FROM menu_item_embedding_bank
      ORDER BY created_at ASC;
    `);

    const prototypes: EmbeddingPrototypeRow[] = [];
    for (const bank of bankRows) {
      const menu =
        (bank.menu_item_id ? menuById.get(bank.menu_item_id) : undefined) ??
        menuByName.get(normalizeDishName(bank.reference_name));
      if (!menu) continue;

      prototypes.push({
        menu_item_id: menu.menu_item_id,
        name: menu.name,
        category: menu.category,
        price: menu.price,
        calories: menu.calories,
        embedding: normalizeEmbeddingJson(bank.embedding),
      });
    }

    if (prototypes.length > 0) return prototypes;
  } catch {
    /* bank table may not exist before migration 009 */
  }

  return listLegacyEmbeddingsForScan();
}

/** Fallback when migration 009 has not been applied yet. */
async function listLegacyEmbeddingsForScan(): Promise<EmbeddingPrototypeRow[]> {
  const pool = getDbPool();
  try {
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
  } catch (error) {
    const maybePgError = error as { code?: string };
    if (maybePgError.code === "42703") {
      // Legacy reference_embedding column is missing, so treat it as no legacy data.
      return [];
    }
    throw error;
  }

}

/** @deprecated Use listEmbeddingPrototypesForScan via embedding-bank.getScanEmbeddingBank */
export async function listTodayEmbeddingsForScan(): Promise<EmbeddingPrototypeRow[]> {
  return listEmbeddingPrototypesForScan();
}

export function embeddingRowToScannedItem(
  row: EmbeddingPrototypeRow,
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

export async function countEmbeddingPrototypesInBank(): Promise<number> {
  const pool = getDbPool();
  try {
    const { rows } = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM menu_item_embedding_bank;`
    );
    return Number(rows[0]?.count ?? 0);
  } catch {
    return 0;
  }
}

export async function countDistinctMenuItemsWithPrototypesToday(): Promise<number> {
  const rows = await listEmbeddingPrototypesForScan();
  return new Set(rows.map((r) => r.menu_item_id)).size;
}

export async function enrichMenuItemsWithEmbeddingFlags(
  items: MenuItem[]
): Promise<MenuItem[]> {
  if (items.length === 0) return items;
  const pool = getDbPool();
  const ids = items.map((i) => i.id);

  const bankCounts = await countBankRowsForMenuItems(
    items.map((item) => ({ id: item.id, name: item.name }))
  );
  const uploadBankRowsByItem = await listUploadBankRowsForMenuItems(ids);

  const { rows } = await pool.query<{
    id: string;
    image_url: string | null;
    has_legacy_embedding: boolean;
  }>(
    `
    SELECT
      id::text,
      image_url,
      (reference_embedding IS NOT NULL) AS has_legacy_embedding
    FROM menu_items
    WHERE id = ANY($1::uuid[]);
    `,
    [ids]
  );
  const byId = new Map(rows.map((r) => [r.id, r]));

  return Promise.all(
    items.map(async (item) => {
      const row = byId.get(item.id);
      const bankCount = bankCounts.get(item.id) ?? 0;
      const bankRows = uploadBankRowsByItem.get(item.id) ?? [];
      const imageUuids = listMenuItemImageUuidsFromBankRows(bankRows);
      let hasLegacyFile = false;
      try {
        await access(legacyMenuItemImagePath(item.id));
        hasLegacyFile = true;
      } catch {
        /* no legacy file */
      }

      const referenceImageUrls =
        imageUuids.length > 0
          ? imageUuids.map((uuid) => menuItemImageApiPath(item.id, uuid))
          : hasLegacyFile
            ? [menuItemImageApiPath(item.id)]
            : [];

      const imageUrl =
        row?.image_url ||
        item.image ||
        referenceImageUrls[referenceImageUrls.length - 1] ||
        null;

      if (referenceImageUrls.length > 0 && !row?.image_url) {
        await upsertMenuItemCatalogReference({
          menuItemId: item.id,
          imageUrl: referenceImageUrls[referenceImageUrls.length - 1]!,
        });
      }

      return {
        ...item,
        hasEmbedding: bankCount > 0 || (row?.has_legacy_embedding ?? false),
        embeddingCount: bankCount > 0 ? bankCount : undefined,
        image: imageUrl,
        referenceImageUrls:
          referenceImageUrls.length > 0 ? referenceImageUrls : undefined,
        hasReferencePhoto: Boolean(
          imageUrl || referenceImageUrls.length > 0 || hasLegacyFile
        ),
      };
    })
  );
}
