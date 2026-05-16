import fs from "fs/promises";
import path from "path";

const DEFAULT_MENU_IMAGES_DIR = path.join(process.cwd(), "data", "menu-images");

export function getMenuImagesDir(): string {
  return process.env.MENU_IMAGES_DIR || DEFAULT_MENU_IMAGES_DIR;
}

export function menuItemImageFilename(menuItemId: string): string {
  return `${menuItemId}.jpg`;
}

export function menuItemImagePath(menuItemId: string): string {
  return path.join(getMenuImagesDir(), menuItemImageFilename(menuItemId));
}

export function menuItemImageApiPath(menuItemId: string): string {
  return `/api/admin/today-menu/${encodeURIComponent(menuItemId)}/image`;
}

export async function ensureMenuImagesDir(): Promise<void> {
  await fs.mkdir(getMenuImagesDir(), { recursive: true });
}

export async function saveMenuItemImage(
  menuItemId: string,
  buffer: Buffer
): Promise<string> {
  await ensureMenuImagesDir();
  const filePath = menuItemImagePath(menuItemId);
  await fs.writeFile(filePath, buffer);
  return filePath;
}

export async function readMenuItemImage(
  menuItemId: string
): Promise<Buffer | null> {
  try {
    return await fs.readFile(menuItemImagePath(menuItemId));
  } catch {
    return null;
  }
}

export async function menuItemImageExists(menuItemId: string): Promise<boolean> {
  try {
    await fs.access(menuItemImagePath(menuItemId));
    return true;
  } catch {
    return false;
  }
}
