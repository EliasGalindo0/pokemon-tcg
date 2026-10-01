"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { AppError } from "@/lib/errors";
import { requireUser } from "@/lib/auth";
import { isOneOf, LANGUAGES, RARITIES } from "@/lib/labels";
import { createCard } from "@/services/cards";
import { createPlayerCard, deletePlayerCard } from "@/services/player-cards";

export type ActionState = {
  message?: string;
  fieldErrors?: Record<string, string>;
};

function invalidate() {
  revalidatePath("/cards");
}

export async function addPromoFromCatalogAction(
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
  const setName = String(formData.get("setName") ?? "").trim();
  const setCode = String(formData.get("setCode") ?? "").trim();
  const cardNumber = String(formData.get("cardNumber") ?? "").trim();
  const language = String(formData.get("language") ?? "PT_BR");
  const rarityRaw = String(formData.get("rarity") ?? "PROMO");
  const rarity = isOneOf(RARITIES, rarityRaw) ? rarityRaw : "PROMO";
  const marketValue = Number(String(formData.get("marketValue") ?? "0").replace(",", "."));
  const quantity = Number(formData.get("quantity") ?? 1);
  const imageUrl = String(formData.get("imageUrl") ?? "").trim() || null;

  const fieldErrors: Record<string, string> = {};
  if (!name) fieldErrors.name = "Informe o nome.";
  if (!setName) fieldErrors.setName = "Informe a coleção.";
  if (!isOneOf(LANGUAGES, language)) fieldErrors.language = "Idioma inválido.";
  if (!Number.isInteger(quantity) || quantity < 1) fieldErrors.quantity = "Quantidade inválida.";
  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors, message: "Revise os campos destacados." };
  }

  try {
    await createCard(user.id, {
      name,
      newSetName: setName,
      newSetCode: setCode || undefined,
      cardNumber: cardNumber || undefined,
      rarity,
      condition: "NEAR_MINT",
      language: language as (typeof LANGUAGES)[number],
      marketValue: Number.isFinite(marketValue) ? Math.max(0, marketValue) : 0,
      purchasePrice: null,
      quantity,
      imageUrl,
    });
  } catch (error) {
    unstable_rethrow(error);
    return { message: error instanceof AppError ? error.message : "Não foi possível salvar a promo." };
  }

  invalidate();
  return { message: "Promo adicionada à coleção." };
}

export async function addPlayerCardAction(
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
    await createPlayerCard(user.id, {
      tcgId: String(formData.get("tcgId") ?? "").trim() || undefined,
      name,
      setName: String(formData.get("setName") ?? "").trim() || undefined,
      cardNumber: String(formData.get("cardNumber") ?? "").trim() || undefined,
      imageUrl: String(formData.get("imageUrl") ?? "").trim() || null,
      rarity: rarity as (typeof RARITIES)[number],
      language: language as (typeof LANGUAGES)[number],
      quantity,
      eventName: String(formData.get("eventName") ?? "").trim() || undefined,
      eventDate: String(formData.get("eventDate") ?? "").trim() || null,
      placement: String(formData.get("placement") ?? "").trim() || undefined,
      notes: String(formData.get("notes") ?? "").trim() || undefined,
    });
  } catch (error) {
    unstable_rethrow(error);
    return { message: error instanceof AppError ? error.message : "Não foi possível salvar a carta." };
  }

  invalidate();
  return { message: "Carta de jogador adicionada." };
}

export async function deletePlayerCardAction(id: string) {
  const user = await requireUser();
  await deletePlayerCard(user.id, id);
  invalidate();
}
