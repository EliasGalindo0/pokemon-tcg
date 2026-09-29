import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const KEY_LEN = 64;

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("base64url");
  const hash = scryptSync(password, salt, KEY_LEN).toString("base64url");
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password: string, stored: string) {
  if (!stored.startsWith("scrypt$")) return false;
  const [, salt, hash] = stored.split("$");
  if (!salt || !hash) return false;
  const next = scryptSync(password, salt, KEY_LEN).toString("base64url");
  const left = Buffer.from(hash);
  const right = Buffer.from(next);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}
