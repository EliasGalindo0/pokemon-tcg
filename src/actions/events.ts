"use server";

import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import { AppError } from "@/lib/errors";
import { requireUser } from "@/lib/auth";
import { isOneOf, EVENT_KINDS, LANGUAGES, RARITIES } from "@/lib/labels";
import {
  addPlayerEventPrize,
  createPlayerEvent,
  deletePlayerEvent,
  deletePlayerEventPrize,
  updatePlayerEvent,
} from "@/services/events";

export type ActionState = {
  message?: string;
  fieldErrors?: Record<string, string>;
};

function invalidate(eventId?: string) {
  revalidatePath("/eventos");
  if (eventId) revalidatePath(`/eventos/${eventId}`);
}

function readEventPayload(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const kind = String(formData.get("kind") ?? "LEAGUE");
  const location = String(formData.get("location") ?? "").trim();
  const heldAt = String(formData.get("heldAt") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const fieldErrors: Record<string, string> = {};
  if (!name) fieldErrors.name = "Informe o nome do evento.";
  if (!isOneOf(EVENT_KINDS, kind)) fieldErrors.kind = "Tipo inválido.";
  return {
    fieldErrors,
    data: {
      name,
      kind: kind as (typeof EVENT_KINDS)[number],
      location: location || undefined,
      heldAt: heldAt || null,
      notes: notes || undefined,
    },
  };
}

export async function createPlayerEventAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let user;
  try {
    user = await requireUser();
  } catch (error) {
    unstable_rethrow(error);
    return { message: error instanceof AppError ? error.message : "Faça login para continuar." };
  }

  const parsed = readEventPayload(formData);
  if (Object.keys(parsed.fieldErrors).length > 0) {
    return { fieldErrors: parsed.fieldErrors, message: "Revise os campos destacados." };
  }

  let event;
  try {
    event = await createPlayerEvent(user.id, parsed.data);
  } catch (error) {
    unstable_rethrow(error);
    return { message: error instanceof AppError ? error.message : "Não foi possível criar o evento." };
  }

  invalidate(event.id);
  redirect(`/eventos/${event.id}`);
}

export async function updatePlayerEventAction(
  id: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let user;
  try {
    user = await requireUser();
  } catch (error) {
    unstable_rethrow(error);
    return { message: error instanceof AppError ? error.message : "Faça login para continuar." };
  }

  const parsed = readEventPayload(formData);
  if (Object.keys(parsed.fieldErrors).length > 0) {
    return { fieldErrors: parsed.fieldErrors, message: "Revise os campos destacados." };
  }

  try {
    await updatePlayerEvent(user.id, id, parsed.data);
  } catch (error) {
    unstable_rethrow(error);
    return { message: error instanceof AppError ? error.message : "Não foi possível salvar o evento." };
  }

  invalidate(id);
  return { message: "Evento atualizado." };
}

export async function deletePlayerEventAction(id: string) {
  const user = await requireUser();
  await deletePlayerEvent(user.id, id);
  invalidate();
  redirect("/eventos");
}

export async function addPlayerEventPrizeAction(
  eventId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let user;
  try {
    user = await requireUser();
  } catch (error) {
    unstable_rethrow(error);
    return { message: error instanceof AppError ? error.message : "Faça login para continuar." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const rarity = String(formData.get("rarity") ?? "PROMO");
  const language = String(formData.get("language") ?? "PT_BR");
  const quantity = Number(formData.get("quantity") ?? 1);
  const fieldErrors: Record<string, string> = {};
  if (!name) fieldErrors.name = "Informe o nome da carta.";
  if (!isOneOf(RARITIES, rarity)) fieldErrors.rarity = "Raridade inválida.";
  if (!isOneOf(LANGUAGES, language)) fieldErrors.language = "Idioma inválido.";
  if (!Number.isInteger(quantity) || quantity < 1) fieldErrors.quantity = "Quantidade inválida.";
  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors, message: "Revise os campos destacados." };
  }

  try {
    await addPlayerEventPrize(user.id, eventId, {
      tcgId: String(formData.get("tcgId") ?? "").trim() || undefined,
      name,
      setName: String(formData.get("setName") ?? "").trim() || undefined,
      cardNumber: String(formData.get("cardNumber") ?? "").trim() || undefined,
      imageUrl: String(formData.get("imageUrl") ?? "").trim() || null,
      rarity: rarity as (typeof RARITIES)[number],
      language: language as (typeof LANGUAGES)[number],
      quantity,
      placement: String(formData.get("placement") ?? "").trim() || undefined,
      notes: String(formData.get("notes") ?? "").trim() || undefined,
    });
  } catch (error) {
    unstable_rethrow(error);
    return { message: error instanceof AppError ? error.message : "Não foi possível adicionar a carta." };
  }

  invalidate(eventId);
  return {};
}

export async function deletePlayerEventPrizeAction(eventId: string, prizeId: string) {
  const user = await requireUser();
  await deletePlayerEventPrize(user.id, prizeId);
  invalidate(eventId);
}
