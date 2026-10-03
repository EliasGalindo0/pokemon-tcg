"use server";

import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import { AppError } from "@/lib/errors";
import { requireAdmin } from "@/lib/auth";
import { parseDeckPayload } from "@/lib/validators";
import {
  addCatalogCardToDeck,
  buildDeckListText,
  createDeck,
  deleteDeck,
  setDeckCardQuantity,
  setDeckCatalogQuantity,
  setDeckCover,
  updateDeck,
} from "@/services/decks";

export type DeckActionState = {
  message?: string;
  ok?: boolean;
  fieldErrors?: Record<string, string>;
};

function invalidate() {
  revalidatePath("/", "layout");
}

export async function createDeckAction(_prev: DeckActionState, formData: FormData): Promise<DeckActionState> {
  let user;
  try {
    user = await requireAdmin();
  } catch (error) {
    unstable_rethrow(error);
    return { message: error instanceof AppError ? error.message : "Faça login para continuar." };
  }
  const parsed = parseDeckPayload(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { fieldErrors: parsed.fieldErrors, message: "Revise os campos destacados." };

  let id = "";
  try {
    const deck = await createDeck(user.id, parsed.data);
    id = deck.id;
  } catch (error) {
    unstable_rethrow(error);
    return { message: error instanceof AppError ? error.message : "Não foi possível criar o deck." };
  }

  invalidate();
  redirect(`/decks/${id}`);
}

export async function updateDeckAction(
  id: string,
  _prev: DeckActionState,
  formData: FormData,
): Promise<DeckActionState> {
  let user;
  try {
    user = await requireAdmin();
  } catch (error) {
    unstable_rethrow(error);
    return { message: error instanceof AppError ? error.message : "Faça login para continuar." };
  }
  const parsed = parseDeckPayload(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { fieldErrors: parsed.fieldErrors, message: "Revise os campos destacados." };

  try {
    await updateDeck(user.id, id, parsed.data);
  } catch (error) {
    unstable_rethrow(error);
    return { message: error instanceof AppError ? error.message : "Não foi possível atualizar o deck." };
  }

  invalidate();
  return { ok: true, message: "Deck atualizado." };
}

export async function deleteDeckAction(id: string) {
  const user = await requireAdmin();
  await deleteDeck(user.id, id);
  invalidate();
  redirect("/decks");
}

export async function setDeckCardAction(deckId: string, cardId: string, quantity: number) {
  try {
    const user = await requireAdmin();
    await setDeckCardQuantity(user.id, deckId, cardId, quantity);
    invalidate();
    return { ok: true as const };
  } catch (error) {
    unstable_rethrow(error);
    const message = error instanceof AppError ? error.message : "Não foi possível atualizar o deck.";
    return { ok: false as const, message };
  }
}

export async function addCatalogCardAction(deckId: string, tcgId: string) {
  try {
    const user = await requireAdmin();
    await addCatalogCardToDeck(user.id, deckId, tcgId);
    invalidate();
    return { ok: true as const };
  } catch (error) {
    unstable_rethrow(error);
    const message = error instanceof AppError ? error.message : "Não foi possível adicionar a carta.";
    return { ok: false as const, message };
  }
}

export async function setDeckCatalogAction(deckId: string, tcgId: string, quantity: number) {
  try {
    const user = await requireAdmin();
    await setDeckCatalogQuantity(user.id, deckId, tcgId, quantity);
    invalidate();
    return { ok: true as const };
  } catch (error) {
    unstable_rethrow(error);
    const message = error instanceof AppError ? error.message : "Não foi possível atualizar o deck.";
    return { ok: false as const, message };
  }
}

export async function setDeckCoverAction(deckId: string, entryId: string) {
  try {
    const user = await requireAdmin();
    await setDeckCover(user.id, deckId, entryId);
    invalidate();
    return { ok: true as const };
  } catch (error) {
    unstable_rethrow(error);
    const message = error instanceof AppError ? error.message : "Não foi possível definir a capa.";
    return { ok: false as const, message };
  }
}

export async function getDeckListTextAction(deckId: string) {
  try {
    const user = await requireAdmin();
    const text = await buildDeckListText(user.id, deckId);
    return { ok: true as const, text };
  } catch (error) {
    unstable_rethrow(error);
    const message = error instanceof AppError ? error.message : "Não foi possível gerar a lista.";
    return { ok: false as const, message };
  }
}
