"use server";

import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import { AppError } from "@/lib/errors";
import { requireAdmin } from "@/lib/auth";
import {
  createTradeSet,
  deleteTradeSet,
  resolveTradeSetsFromCardNumber,
  setTradeQuantity,
  tradeLanguage,
} from "@/services/trades";

function invalidate() {
  revalidatePath("/", "layout");
}

function failure(error: unknown, fallback: string) {
  unstable_rethrow(error);
  if (error instanceof AppError) return error.message;
  return fallback;
}

export async function searchTradeSetsAction(query: string, language: string) {
  try {
    await requireAdmin();
    const items = await resolveTradeSetsFromCardNumber(query, tradeLanguage(language));
    return { ok: true as const, items };
  } catch (error) {
    return { ok: false as const, message: failure(error, "Não foi possível buscar a coleção."), items: [] };
  }
}

export async function createTradeSetAction(tcgSetId: string, language: string) {
  try {
    await requireAdmin();
    const row = await createTradeSet(tcgSetId, tradeLanguage(language));
    invalidate();
    return { ok: true as const, id: row.id };
  } catch (error) {
    return { ok: false as const, message: failure(error, "Não foi possível cadastrar a coleção.") };
  }
}

export async function setTradeQuantityAction(tradeSetId: string, tcgId: string, quantity: number) {
  try {
    await requireAdmin();
    await setTradeQuantity(tradeSetId, tcgId, quantity);
    invalidate();
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, message: failure(error, "Não foi possível atualizar a quantidade.") };
  }
}

export async function deleteTradeSetAction(id: string) {
  await requireAdmin();
  await deleteTradeSet(id);
  invalidate();
  redirect("/trocas");
}
