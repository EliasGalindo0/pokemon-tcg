import "server-only";

import { randomBytes } from "node:crypto";
import { AppError } from "@/lib/errors";
import { hashPassword, verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

const USERNAME_RE = /^[a-z0-9_]{3,24}$/;

export type UserDTO = {
  id: string;
  username: string;
  displayName: string;
  role: "ADMIN" | "MEMBER";
  active: boolean;
  mustChangeCredentials: boolean;
  collectionPublic: boolean;
  createdAt: string;
  updatedAt: string;
};

export type InviteCredentials = {
  user: UserDTO;
  provisionalUsername: string;
  provisionalPassword: string;
};

function toDto(user: {
  id: string;
  username: string;
  displayName: string;
  role: "ADMIN" | "MEMBER";
  active: boolean;
  mustChangeCredentials: boolean;
  collectionPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}): UserDTO {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    role: user.role,
    active: user.active,
    mustChangeCredentials: user.mustChangeCredentials,
    collectionPublic: user.collectionPublic,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}

export function assertUsername(username: string) {
  if (!USERNAME_RE.test(username)) {
    throw new AppError("Usuário inválido. Use 3–24 caracteres: a-z, 0-9 e _.", 400);
  }
}

function assertDisplayName(displayName: string) {
  if (displayName.length < 2 || displayName.length > 60) {
    throw new AppError("Nome de exibição inválido.", 400);
  }
}

function assertPassword(password: string) {
  if (password.length < 6) {
    throw new AppError("A senha precisa ter ao menos 6 caracteres.", 400);
  }
}

function provisionalUsernameFrom(displayName: string) {
  const base = displayName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 12);
  const stem = base.length >= 3 ? base : "amigo";
  const suffix = randomBytes(2).toString("hex");
  return `${stem}_${suffix}`.slice(0, 24);
}

function generateProvisionalPassword() {
  return randomBytes(9).toString("base64url").replace(/[^a-zA-Z0-9]/g, "x").slice(0, 12);
}

export async function listUsers(): Promise<UserDTO[]> {
  const rows = await prisma.user.findMany({ orderBy: [{ role: "asc" }, { createdAt: "asc" }] });
  return rows.map(toDto);
}

/** Creates a member with temporary credentials shown once to the admin. */
export async function inviteUser(input: {
  displayName: string;
  role?: "ADMIN" | "MEMBER";
}): Promise<InviteCredentials> {
  const displayName = input.displayName.trim();
  assertDisplayName(displayName);

  let username = provisionalUsernameFrom(displayName);
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const taken = await prisma.user.findUnique({ where: { username } });
    if (!taken) break;
    username = provisionalUsernameFrom(`${displayName}${attempt}`);
  }

  const password = generateProvisionalPassword();
  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) throw new AppError("Não foi possível gerar um usuário provisório. Tente de novo.", 409);

  const user = await prisma.user.create({
    data: {
      username,
      displayName,
      passwordHash: hashPassword(password),
      role: input.role ?? "MEMBER",
      active: true,
      mustChangeCredentials: true,
    },
  });

  return {
    user: toDto(user),
    provisionalUsername: username,
    provisionalPassword: password,
  };
}

export async function createUser(input: {
  username: string;
  displayName: string;
  password: string;
  role?: "ADMIN" | "MEMBER";
  mustChangeCredentials?: boolean;
}) {
  const username = normalizeUsername(input.username);
  const displayName = input.displayName.trim();
  assertUsername(username);
  assertDisplayName(displayName);
  assertPassword(input.password);

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) throw new AppError("Este usuário já existe.", 409);

  const user = await prisma.user.create({
    data: {
      username,
      displayName,
      passwordHash: hashPassword(input.password),
      role: input.role ?? "MEMBER",
      active: true,
      mustChangeCredentials: input.mustChangeCredentials ?? false,
    },
  });
  return toDto(user);
}

export async function setUserActive(id: string, active: boolean, actorId: string) {
  if (id === actorId && !active) {
    throw new AppError("Você não pode desativar a própria conta.", 400);
  }
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new AppError("Usuário não encontrado.", 404);

  if (!active && user.role === "ADMIN") {
    const admins = await prisma.user.count({ where: { role: "ADMIN", active: true } });
    if (admins <= 1) throw new AppError("Mantenha ao menos um administrador ativo.", 400);
  }

  return toDto(await prisma.user.update({ where: { id }, data: { active } }));
}

/** Admin reset: new provisional password; user must change credentials on next login. */
export async function resetUserPassword(id: string, password?: string): Promise<InviteCredentials> {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new AppError("Usuário não encontrado.", 404);

  const nextPassword = password?.trim() || generateProvisionalPassword();
  assertPassword(nextPassword);

  const updated = await prisma.user.update({
    where: { id },
    data: {
      passwordHash: hashPassword(nextPassword),
      mustChangeCredentials: true,
    },
  });

  return {
    user: toDto(updated),
    provisionalUsername: updated.username,
    provisionalPassword: nextPassword,
  };
}

export async function updateOwnCredentials(
  userId: string,
  input: {
    username: string;
    displayName: string;
    currentPassword: string;
    newPassword: string;
  },
) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.active) throw new AppError("Usuário não encontrado.", 404);

  if (!verifyPassword(input.currentPassword, user.passwordHash)) {
    throw new AppError("Senha atual incorreta.", 400);
  }

  const username = normalizeUsername(input.username);
  const displayName = input.displayName.trim();
  assertUsername(username);
  assertDisplayName(displayName);
  assertPassword(input.newPassword);

  if (user.mustChangeCredentials) {
    if (username === user.username) {
      throw new AppError("Escolha um usuário diferente do provisório.", 400);
    }
    if (verifyPassword(input.newPassword, user.passwordHash)) {
      throw new AppError("Escolha uma senha diferente da provisória.", 400);
    }
  }

  const taken = await prisma.user.findFirst({
    where: { username, NOT: { id: userId } },
  });
  if (taken) throw new AppError("Este usuário já está em uso.", 409);

  return toDto(
    await prisma.user.update({
      where: { id: userId },
      data: {
        username,
        displayName,
        passwordHash: hashPassword(input.newPassword),
        mustChangeCredentials: false,
      },
    }),
  );
}

export async function setCollectionPublic(userId: string, collectionPublic: boolean) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.active) throw new AppError("Usuário não encontrado.", 404);
  return toDto(await prisma.user.update({ where: { id: userId }, data: { collectionPublic } }));
}
