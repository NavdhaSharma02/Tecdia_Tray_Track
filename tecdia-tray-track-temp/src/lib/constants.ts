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

/** Food categories list */
export const FOOD_CATEGORIES = [
  "All",
  "Main Course",
  "Rice",
  "Bread",
  "Side",
  "Dessert",
  "Beverage",
] as const;

export const IDLE_TIMEOUT_MS = 120_000;
