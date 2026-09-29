"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  clearAdminSession,
  createAdminSession,
  isAdmin,
  verifyAdminPassword,
} from "@/lib/auth";

export type LoginState = {
  message?: string;
};

function safeNext(value: FormDataEntryValue | null) {
  const next = String(value ?? "").trim();
  if (!next.startsWith("/") || next.startsWith("//")) return "/";
  return next;
}

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const password = String(formData.get("password") ?? "");
  if (!verifyAdminPassword(password)) {
    return { message: "Senha incorreta." };
  }
  await createAdminSession();
  redirect(safeNext(formData.get("next")));
}

export async function logoutAction() {
  await clearAdminSession();
  revalidatePath("/", "layout");
  redirect("/");
}

export async function getAdminFlag() {
  return isAdmin();
}
