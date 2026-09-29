"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  authenticateUser,
  clearSession,
  createUserSession,
  getSessionUser,
  requireAdmin,
  requireUser,
} from "@/lib/auth";
import { AppError } from "@/lib/errors";
import {
  inviteUser,
  listUsers,
  resetUserPassword,
  setUserActive,
  updateOwnCredentials,
  type InviteCredentials,
} from "@/services/users";
import { setSetPublic } from "@/services/sets";

export type LoginState = {
  message?: string;
};

export type UserActionState = {
  message?: string;
  ok?: boolean;
  invite?: InviteCredentials;
};

export type AccountActionState = {
  message?: string;
  ok?: boolean;
  fieldErrors?: Record<string, string>;
};

function safeNext(value: FormDataEntryValue | null) {
  const next = String(value ?? "").trim();
  if (!next.startsWith("/") || next.startsWith("//")) return "/";
  return next;
}

function homeFor(role: "ADMIN" | "MEMBER") {
  return role === "ADMIN" ? "/" : "/cards";
}

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");
  const user = await authenticateUser(username, password);
  if (!user) return { message: "Usuário ou senha incorretos." };
  await createUserSession(user.id);

  if (user.mustChangeCredentials) {
    redirect("/conta");
  }

  let next = safeNext(formData.get("next"));
  const adminOnly =
    next === "/" ||
    next.startsWith("/album") ||
    next.startsWith("/decks") ||
    next.startsWith("/admin") ||
    next === "/cards/new" ||
    /^\/cards\/[^/]+\/edit$/.test(next);
  if (user.role !== "ADMIN" && adminOnly) next = homeFor("MEMBER");

  redirect(next);
}

export async function logoutAction() {
  await clearSession();
  revalidatePath("/", "layout");
  redirect("/trocas");
}

export async function getAdminFlag() {
  const user = await getSessionUser();
  return user?.role === "ADMIN";
}

export async function inviteUserAction(
  _prev: UserActionState,
  formData: FormData,
): Promise<UserActionState> {
  try {
    await requireAdmin();
    const invite = await inviteUser({
      displayName: String(formData.get("displayName") ?? ""),
      role: formData.get("role") === "ADMIN" ? "ADMIN" : "MEMBER",
    });
    revalidatePath("/admin/usuarios");
    return {
      ok: true,
      message: "Convite criado. Envie o usuário e a senha provisórios agora — eles só aparecem uma vez.",
      invite,
    };
  } catch (error) {
    return {
      message: error instanceof AppError ? error.message : "Não foi possível criar o convite.",
    };
  }
}

export async function toggleUserActiveAction(id: string, active: boolean): Promise<UserActionState> {
  try {
    const admin = await requireAdmin();
    await setUserActive(id, active, admin.id);
    revalidatePath("/admin/usuarios");
    return { ok: true, message: active ? "Acesso liberado." : "Acesso desativado." };
  } catch (error) {
    return {
      message: error instanceof AppError ? error.message : "Não foi possível atualizar o usuário.",
    };
  }
}

export async function resetPasswordAction(id: string): Promise<UserActionState> {
  try {
    await requireAdmin();
    const invite = await resetUserPassword(id);
    revalidatePath("/admin/usuarios");
    return {
      ok: true,
      message: "Nova senha provisória gerada. O usuário precisará trocar no próximo acesso.",
      invite,
    };
  } catch (error) {
    return {
      message: error instanceof AppError ? error.message : "Não foi possível atualizar a senha.",
    };
  }
}

export async function updateAccountAction(
  _prev: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  let user;
  try {
    user = await requireUser();
  } catch {
    return { message: "Faça login para continuar." };
  }

  try {
    const updated = await updateOwnCredentials(user.id, {
      username: String(formData.get("username") ?? ""),
      displayName: String(formData.get("displayName") ?? ""),
      currentPassword: String(formData.get("currentPassword") ?? ""),
      newPassword: String(formData.get("newPassword") ?? ""),
    });
    revalidatePath("/", "layout");
    redirect(homeFor(updated.role));
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) throw error;
    return {
      message: error instanceof AppError ? error.message : "Não foi possível atualizar a conta.",
    };
  }
}

export async function listUsersAction() {
  await requireAdmin();
  return listUsers();
}

export async function setSetPublicAction(setId: string, isPublic: boolean): Promise<UserActionState> {
  try {
    const user = await requireUser();
    await setSetPublic(user.id, setId, isPublic);
    revalidatePath("/", "layout");
    revalidatePath("/galeria");
    revalidatePath("/cards");
    revalidatePath("/conta");
    return {
      ok: true,
      message: isPublic ? "Coleção pública — aparece em Coleções." : "Coleção privada.",
    };
  } catch (error) {
    return {
      message: error instanceof AppError ? error.message : "Não foi possível atualizar a privacidade.",
    };
  }
}
