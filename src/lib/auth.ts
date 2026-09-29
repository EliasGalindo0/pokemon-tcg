import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/auth-cookie";
import { AppError } from "@/lib/errors";

const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function authSecret() {
  return process.env.AUTH_SECRET || process.env.ADMIN_PASSWORD || "dev-insecure-secret";
}

function adminPassword() {
  return process.env.ADMIN_PASSWORD ?? "";
}

function sign(value: string) {
  return createHmac("sha256", authSecret()).update(value).digest("base64url");
}

function encodeSession(expiresAt: number) {
  const payload = `admin.${expiresAt}`;
  return `${payload}.${sign(payload)}`;
}

function decodeSession(token: string | undefined) {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [role, expiresRaw, signature] = parts;
  if (role !== "admin") return null;
  const expiresAt = Number(expiresRaw);
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return null;
  const payload = `${role}.${expiresRaw}`;
  const expected = sign(payload);
  try {
    const left = Buffer.from(signature);
    const right = Buffer.from(expected);
    if (left.length !== right.length || !timingSafeEqual(left, right)) return null;
  } catch {
    return null;
  }
  return { role: "admin" as const, expiresAt };
}

export function verifyAdminPassword(password: string) {
  const expected = adminPassword();
  if (!expected) return false;
  const left = Buffer.from(password);
  const right = Buffer.from(expected);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export async function createAdminSession() {
  const token = encodeSession(Date.now() + MAX_AGE_SECONDS * 1000);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function clearAdminSession() {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function isAdmin() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return Boolean(decodeSession(token));
}

export async function requireAdmin() {
  if (!(await isAdmin())) {
    throw new AppError("Faça login para alterar a coleção.", 401);
  }
}
