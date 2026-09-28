"use server";

import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import { AppError } from "@/lib/errors";
import { parseDeckPayload } from "@/lib/validators";
import {
  addCatalogCardToDeck,
  createDeck,
  deleteDeck,
  setDeckCardQuantity,
  setDeckCatalogQuantity,
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
  const parsed = parseDeckPayload(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { fieldErrors: parsed.fieldErrors, message: "Revise os campos destacados." };

  let id = "";
  try {
    const deck = await createDeck(parsed.data);
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
  const parsed = parseDeckPayload(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { fieldErrors: parsed.fieldErrors, message: "Revise os campos destacados." };

  try {
    await updateDeck(id, parsed.data);
  } catch (error) {
    unstable_rethrow(error);
    return { message: error instanceof AppError ? error.message : "Não foi possível atualizar o deck." };
  }

  invalidate();
  return { ok: true, message: "Deck atualizado." };
}

export async function deleteDeckAction(id: string) {
  await deleteDeck(id);
  invalidate();
  redirect("/decks");
}

export async function setDeckCardAction(deckId: string, cardId: string, quantity: number) {
  try {
    await setDeckCardQuantity(deckId, cardId, quantity);
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
    await addCatalogCardToDeck(deckId, tcgId);
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
    await setDeckCatalogQuantity(deckId, tcgId, quantity);
    invalidate();
    return { ok: true as const };
  } catch (error) {
    unstable_rethrow(error);
    const message = error instanceof AppError ? error.message : "Não foi possível atualizar o deck.";
    return { ok: false as const, message };
  }
}
