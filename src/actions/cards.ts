"use server";

import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import { AppError } from "@/lib/errors";
import { parseCardPayload } from "@/lib/validators";
import { saveUpload } from "@/lib/uploads";
import { createCard, deleteCard, updateCard } from "@/services/cards";

export type ActionState = {
  message?: string;
  fieldErrors?: Record<string, string>;
};

function invalidate() {
  revalidatePath("/", "layout");
}

async function imageFromForm(formData: FormData, imageUrl: string | null) {
  const file = formData.get("imageFile");
  if (file instanceof File && file.size > 0) return saveUpload(file);
  return imageUrl;
}

function payloadFromForm(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const file = formData.get("imageFile");
  if (file instanceof File && file.size > 0) raw.imageUrl = "";
  return parseCardPayload(raw);
}

export async function createCardAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = payloadFromForm(formData);
  if (!parsed.success) {
    return { fieldErrors: parsed.fieldErrors, message: "Revise os campos destacados." };
  }

  try {
    const imageUrl = await imageFromForm(formData, parsed.data.imageUrl);
    await createCard({ ...parsed.data, imageUrl });
  } catch (error) {
    unstable_rethrow(error);
    const message = error instanceof AppError ? error.message : "Não foi possível salvar a carta.";
    return { message };
  }

  invalidate();
  redirect("/cards");
}

export async function updateCardAction(
  id: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = payloadFromForm(formData);
  if (!parsed.success) {
    return { fieldErrors: parsed.fieldErrors, message: "Revise os campos destacados." };
  }

  try {
    const imageUrl = await imageFromForm(formData, parsed.data.imageUrl);
    await updateCard(id, { ...parsed.data, imageUrl });
  } catch (error) {
    unstable_rethrow(error);
    const message = error instanceof AppError ? error.message : "Não foi possível atualizar a carta.";
    return { message };
  }

  invalidate();
  redirect(`/cards/${id}`);
}

export async function deleteCardAction(id: string) {
  await deleteCard(id);
  invalidate();
  redirect("/cards");
}
