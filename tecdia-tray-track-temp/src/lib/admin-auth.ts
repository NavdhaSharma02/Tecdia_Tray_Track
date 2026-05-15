import { timingSafeEqual } from "crypto";

export type SuperUserRole = "admin" | "cashier";

function comparePin(pin: string, configured: string): boolean {
  if (!/^\d{6}$/.test(pin) || !/^\d{6}$/.test(configured)) {
    return false;
  }
  const a = Buffer.from(pin, "utf8");
  const b = Buffer.from(configured, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function isAdminPinValid(pin: string): { ok: boolean; error?: string } {
  const configured = process.env.ADMIN_PIN;
  if (!configured || !/^\d{6}$/.test(configured)) {
    return { ok: false, error: "Admin login is not configured." };
  }
  if (!comparePin(pin, configured)) {
    return { ok: false, error: "Incorrect PIN." };
  }
  return { ok: true };
}

export function isCashierPinValid(pin: string): { ok: boolean; error?: string } {
  const configured = process.env.CASHIER_PIN;
  if (!configured || !/^\d{6}$/.test(configured)) {
    return { ok: false, error: "Cashier PIN is not configured." };
  }
  if (!comparePin(pin, configured)) {
    return { ok: false, error: "Incorrect PIN." };
  }
  return { ok: true };
}

/** Accepts admin PIN or cashier PIN (for portion adjustments on the kiosk). */
export function verifySuperUserPin(pin: string): {
  ok: boolean;
  role?: SuperUserRole;
  error?: string;
} {
  if (!/^\d{6}$/.test(pin)) {
    return { ok: false, error: "Incorrect PIN." };
  }

  const adminCheck = isAdminPinValid(pin);
  if (adminCheck.ok) {
    return { ok: true, role: "admin" };
  }

  const cashierCheck = isCashierPinValid(pin);
  if (cashierCheck.ok) {
    return { ok: true, role: "cashier" };
  }

  const adminConfigured = process.env.ADMIN_PIN && /^\d{6}$/.test(process.env.ADMIN_PIN);
  const cashierConfigured =
    process.env.CASHIER_PIN && /^\d{6}$/.test(process.env.CASHIER_PIN);

  if (!adminConfigured && !cashierConfigured) {
    return { ok: false, error: "Staff PIN login is not configured." };
  }

  return { ok: false, error: "Incorrect PIN." };
}
