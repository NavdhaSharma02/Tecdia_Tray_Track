/**
 * Application-wide constants.
 */

export const APP_NAME = "Tecdia Tray Track";
export const APP_VERSION = "0.1.0";

export const API_BASE: string =
  process.env.NEXT_PUBLIC_API_URL || "/api";

export const CURRENCY = "₹";

/** Flow step labels for the stepper UI — no PROFILE step */
export const FLOW_STEP_LABELS: Record<string, { label: string; icon: string }> = {
  IDLE: { label: "Identify", icon: "1" },
  EMAIL_AUTH: { label: "Login", icon: "2" },
  SCANNING: { label: "Scan Tray", icon: "3" },
  BILL: { label: "Bill", icon: "4" },
  PAYMENT: { label: "Payment", icon: "5" },
  DONE: { label: "Done", icon: "✓" },
};

export const PAYMENT_METHODS = {
  IMMEDIATE: "immediate" as const,
  ACCOUNT: "account" as const,
};

export const SCAN_DURATION_MS = 3500;
export const DONE_REDIRECT_MS = 6000;

/** Food categories for menu management and filtering */
export const FOOD_CATEGORIES = [
  "All",
  "Main Course",
  "Soup",
  "rice_big",
  "rice_small",
] as const;

export const SOUP_CATEGORY = "Soup";
export const SEBAW_MENU_CODE = "SEBAW";
export const SEBAW_MENU_NAME = "Sebaw";

/** YOLO dish-localization class for free meatless soup (maps to Sebaw when on today's menu). */
export const YOLO_MEATLESS_SOUP_CLASS = "meatless soup";

export const RICE_BIG_CATEGORY = "rice_big";
export const RICE_SMALL_CATEGORY = "rice_small";
export const RICE_BIG_CODE = "RICE_BIG";
export const RICE_SMALL_CODE = "RICE_SMALL";
export const RICE_BIG_NAME = "rice_big";
export const RICE_SMALL_NAME = "rice_small";

/** YOLO dish-localization detector class names (see Dish Localization/best.pt). */
export const YOLO_DETECTION_CLASSES = [
  "drink",
  "food",
  "meatless soup",
  "rice_big",
  "rice_small",
  "soup",
] as const;

/** Non-rice YOLO regions sent to CLIP (one best match per box, no score cutoff). */
export const YOLO_CLIP_CROP_CLASSES = [
  "drink",
  "food",
  "meatless soup",
  "soup",
] as const;

export function isSebawMenuItem(item: { name: string; category: string }): boolean {
  return item.category === SOUP_CATEGORY && item.name === SEBAW_MENU_NAME;
}

export function isRiceBigMenuItem(item: { name: string; category: string }): boolean {
  return item.category === RICE_BIG_CATEGORY && item.name === RICE_BIG_NAME;
}

export function isRiceSmallMenuItem(item: { name: string; category: string }): boolean {
  return item.category === RICE_SMALL_CATEGORY && item.name === RICE_SMALL_NAME;
}

export function isPermanentRiceMenuItem(item: {
  name: string;
  category: string;
}): boolean {
  return isRiceBigMenuItem(item) || isRiceSmallMenuItem(item);
}

export function isPermanentMenuItem(item: { name: string; category: string }): boolean {
  return isSebawMenuItem(item) || isPermanentRiceMenuItem(item);
}

/** Lowercase dish names; words may be separated by spaces (e.g. "chicken teriyaki"). */
export function isCompactDishName(name: string): boolean {
  return /^[a-z]+(?: [a-z]+)*$/.test(name);
}

export const IDLE_TIMEOUT_MS = 120_000;
