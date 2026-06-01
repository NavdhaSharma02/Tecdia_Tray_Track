import fs from "fs/promises";
import path from "path";

const DEFAULT_MENU_IMAGES_DIR = path.join(process.cwd(), "data", "menu-images");

export function getMenuImagesDir(): string {
  return process.env.MENU_IMAGES_DIR || DEFAULT_MENU_IMAGES_DIR;
}

export function menuItemImageFilename(imageUuid: string): string {
  return `${imageUuid}.jpg`;
}

export function menuItemImagePath(imageUuid: string): string {
  return path.join(getMenuImagesDir(), menuItemImageFilename(imageUuid));
}

/** Legacy on-disk layout before per-upload UUID filenames. */
export function legacyMenuItemImagePath(menuItemId: string): string {
  return path.join(getMenuImagesDir(), `${menuItemId}.jpg`);
}

export function menuItemImageApiPath(menuItemId: string, imageUuid?: string): string {
  const base = `/api/admin/today-menu/${encodeURIComponent(menuItemId)}/image`;
  if (imageUuid) {
    return `${base}?uuid=${encodeURIComponent(imageUuid)}`;
  }
  return base;
}

export async function ensureMenuImagesDir(): Promise<void> {
  await fs.mkdir(getMenuImagesDir(), { recursive: true });
}

export async function saveMenuItemImage(
  imageUuid: string,
  buffer: Buffer
): Promise<string> {
  await ensureMenuImagesDir();
  const filePath = menuItemImagePath(imageUuid);
  await fs.writeFile(filePath, buffer);
  return filePath;
}

export async function readMenuItemImage(
  imageUuid: string
): Promise<Buffer | null> {
  try {
    return await fs.readFile(menuItemImagePath(imageUuid));
  } catch {
    return null;
  }
}

export async function readLegacyMenuItemImage(
  menuItemId: string
): Promise<Buffer | null> {
  try {
    return await fs.readFile(legacyMenuItemImagePath(menuItemId));
  } catch {
    return null;
  }
}

export async function menuItemImageExists(imageUuid: string): Promise<boolean> {
  try {
    await fs.access(menuItemImagePath(imageUuid));
    return true;
  } catch {
    return false;
  }
}

export async function deleteMenuItemImageFile(imageUuid: string): Promise<void> {
  try {
    await fs.unlink(menuItemImagePath(imageUuid));
  } catch {
    /* file may already be missing */
  }
}

export interface MenuItemImageBankRow {
  source: string;
  source_key: string;
  created_at?: string | Date;
}

const UPLOAD_SOURCE_KEY_PREFIX = "upload:";

/** Extract image UUID from `upload:{uuid}` (and legacy `rebuild:{uuid}`) bank keys. */
export function parseImageUuidFromSourceKey(sourceKey: string): string | null {
  if (sourceKey.startsWith(UPLOAD_SOURCE_KEY_PREFIX)) {
    const uuid = sourceKey.slice(UPLOAD_SOURCE_KEY_PREFIX.length).trim();
    return uuid || null;
  }
  if (sourceKey.startsWith("rebuild:")) {
    const uuid = sourceKey.slice("rebuild:".length).trim();
    return uuid || null;
  }
  return null;
}

/** Ordered UUIDs for on-disk JPEGs referenced by embedding bank rows. */
export function listMenuItemImageUuidsFromBankRows(
  rows: MenuItemImageBankRow[]
): string[] {
  const seen = new Set<string>();
  const ordered: { uuid: string; createdAt: number }[] = [];

  for (const row of rows) {
    const uuid = parseImageUuidFromSourceKey(row.source_key);
    if (!uuid || seen.has(uuid)) continue;
    seen.add(uuid);
    const createdAt = row.created_at
      ? new Date(row.created_at).getTime()
      : ordered.length;
    ordered.push({ uuid, createdAt });
  }

  ordered.sort((a, b) => a.createdAt - b.createdAt);
  return ordered.map((entry) => entry.uuid);
}

export function uploadSourceKeyForImageUuid(imageUuid: string): string {
  return `${UPLOAD_SOURCE_KEY_PREFIX}${imageUuid}`;
}
