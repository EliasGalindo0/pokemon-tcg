import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/auth-cookie";
import { AppError } from "@/lib/errors";
import { hashPassword, verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
const BOOTSTRAP_ADMIN_ID = "owner_bootstrap_admin";

export type SessionUser = {
  id: string;
  username: string;
  displayName: string;
  role: "ADMIN" | "MEMBER";
  mustChangeCredentials: boolean;
};

function authSecret() {
  return process.env.AUTH_SECRET || process.env.ADMIN_PASSWORD || "dev-insecure-secret";
}

function sign(value: string) {
  return createHmac("sha256", authSecret()).update(value).digest("base64url");
}

function encodeSession(userId: string, expiresAt: number) {
  const payload = `${userId}.${expiresAt}`;
  return `${payload}.${sign(payload)}`;
}

function decodeSession(token: string | undefined) {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [userId, expiresRaw, signature] = parts;
  if (!userId || userId === "admin") return null;
  const expiresAt = Number(expiresRaw);
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return null;
  const payload = `${userId}.${expiresRaw}`;
  const expected = sign(payload);
  try {
    const left = Buffer.from(signature);
    const right = Buffer.from(expected);
    if (left.length !== right.length || !timingSafeEqual(left, right)) return null;
  } catch {
    return null;
  }
  return { userId, expiresAt };
}

let bootstrapPromise: Promise<void> | null = null;

export async function ensureBootstrapAdmin() {
  if (!bootstrapPromise) {
    bootstrapPromise = (async () => {
      const password = process.env.ADMIN_PASSWORD ?? "";
      if (!password) return;

      const existing = await prisma.user.findUnique({ where: { id: BOOTSTRAP_ADMIN_ID } });
      if (!existing) {
        const taken = await prisma.user.findUnique({ where: { username: "admin" } });
        if (taken) return;
        await prisma.user.create({
          data: {
            id: BOOTSTRAP_ADMIN_ID,
            username: "admin",
            displayName: "Administrador",
            passwordHash: hashPassword(password),
            role: "ADMIN",
            active: true,
            mustChangeCredentials: true,
          },
        });
        return;
      }

      if (existing.passwordHash === "bootstrap" || existing.passwordHash.startsWith("bootstrap")) {
        await prisma.user.update({
          where: { id: existing.id },
          data: {
            passwordHash: hashPassword(password),
            role: "ADMIN",
            active: true,
            mustChangeCredentials: true,
          },
        });
      }
    })().catch((error) => {
      bootstrapPromise = null;
      throw error;
    });
  }
  await bootstrapPromise;
}

export async function createUserSession(userId: string) {
  const token = encodeSession(userId, Date.now() + MAX_AGE_SECONDS * 1000);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function clearSession() {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  await ensureBootstrapAdmin();
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const session = decodeSession(token);
  if (!session) return null;

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user || !user.active) return null;

  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    role: user.role,
    mustChangeCredentials: user.mustChangeCredentials,
  };
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError("Faça login para continuar.", 401);
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") throw new AppError("Acesso restrito ao administrador.", 403);
  return user;
}

export async function isLoggedIn() {
  return Boolean(await getSessionUser());
}

export async function isAdmin() {
  const user = await getSessionUser();
  return user?.role === "ADMIN";
}

export async function authenticateUser(username: string, password: string) {
  await ensureBootstrapAdmin();
  const user = await prisma.user.findUnique({
    where: { username: username.trim().toLowerCase() },
  });
  if (!user || !user.active) return null;
  if (!verifyPassword(password, user.passwordHash)) return null;
  return user;
}

/** @deprecated use getSessionUser */
export async function createAdminSession() {
  await ensureBootstrapAdmin();
  const admin = await prisma.user.findFirst({ where: { role: "ADMIN", active: true } });
  if (!admin) throw new AppError("Administrador não configurado.", 500);
  await createUserSession(admin.id);
}

/** @deprecated */
export async function clearAdminSession() {
  await clearSession();
}

/** @deprecated */
export function verifyAdminPassword(password: string) {
  return Boolean(password);
}
