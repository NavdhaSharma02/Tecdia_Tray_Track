import crypto from "crypto";

const HASH_KEYLEN = 64;

export interface PasswordHash {
  salt: string;
  hash: string;
}

export function hashPassword(password: string): PasswordHash {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .scryptSync(password, salt, HASH_KEYLEN)
    .toString("hex");

  return { salt, hash };
}

export function verifyPassword(
  password: string,
  storedSalt: string,
  storedHash: string
): boolean {
  const hashBuffer = crypto.scryptSync(password, storedSalt, HASH_KEYLEN);
  const storedBuffer = Buffer.from(storedHash, "hex");

  if (hashBuffer.length !== storedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(hashBuffer, storedBuffer);
}
