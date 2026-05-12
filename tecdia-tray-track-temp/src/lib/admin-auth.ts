import { timingSafeEqual } from "crypto";

export function isAdminPinValid(pin: string): { ok: boolean; error?: string } {
  const configured = process.env.ADMIN_PIN;
  if (!configured || !/^\d{6}$/.test(configured)) {
    return { ok: false, error: "Admin login is not configured." };
  }
  if (!/^\d{6}$/.test(pin)) {
    return { ok: false, error: "Incorrect PIN." };
  }

  const a = Buffer.from(pin, "utf8");
  const b = Buffer.from(configured, "utf8");
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { ok: false, error: "Incorrect PIN." };
  }

  return { ok: true };
}
