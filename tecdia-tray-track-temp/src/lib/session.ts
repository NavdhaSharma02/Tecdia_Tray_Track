import crypto from "crypto";

export const CUSTOMER_SESSION_COOKIE = "tt_customer_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

function getSessionSecret(): string {
  const secret = process.env.AUTH_SESSION_SECRET;
  if (!secret) {
    throw new Error("Missing AUTH_SESSION_SECRET");
  }
  return secret;
}

function toBase64Url(value: Buffer | string): string {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromBase64Url(value: string): Buffer {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const normalized = padded + "=".repeat((4 - (padded.length % 4 || 4)) % 4);
  return Buffer.from(normalized, "base64");
}

export function buildSessionToken(userId: string): string {
  const payload = JSON.stringify({
    uid: userId,
    exp: Date.now() + SESSION_MAX_AGE_SECONDS * 1000,
  });

  const payloadEncoded = toBase64Url(payload);
  const signature = crypto
    .createHmac("sha256", getSessionSecret())
    .update(payloadEncoded)
    .digest();

  return `${payloadEncoded}.${toBase64Url(signature)}`;
}

export function parseSessionToken(token: string | undefined): { userId: string } | null {
  if (!token) return null;

  const [payloadEncoded, signatureEncoded] = token.split(".");
  if (!payloadEncoded || !signatureEncoded) return null;

  const expectedSignature = crypto
    .createHmac("sha256", getSessionSecret())
    .update(payloadEncoded)
    .digest();
  const actualSignature = fromBase64Url(signatureEncoded);

  if (
    expectedSignature.length !== actualSignature.length ||
    !crypto.timingSafeEqual(expectedSignature, actualSignature)
  ) {
    return null;
  }

  try {
    const payloadRaw = fromBase64Url(payloadEncoded).toString("utf8");
    const payload = JSON.parse(payloadRaw) as { uid: string; exp: number };
    if (!payload.uid || !payload.exp || payload.exp < Date.now()) {
      return null;
    }
    return { userId: payload.uid };
  } catch {
    return null;
  }
}

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}
