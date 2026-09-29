"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import {
  acceptTradeOffer,
  createTradeOffer,
  rejectTradeOffer,
} from "@/services/trade-offers";
import { tradeLanguage } from "@/services/trades";

export type OfferActionResult = { ok: true; message?: string } | { ok: false; message: string };

export async function proposeTradeOfferAction(input: {
  wantedTradeSetId: string;
  wantedTcgId: string;
  offeredTcgId: string;
  offeredLanguage: string;
  visitorName?: string;
  visitorNote?: string;
}): Promise<OfferActionResult> {
  try {
    await createTradeOffer({
      wantedTradeSetId: input.wantedTradeSetId,
      wantedTcgId: input.wantedTcgId,
      offeredTcgId: input.offeredTcgId,
      offeredLanguage: tradeLanguage(input.offeredLanguage),
      visitorName: input.visitorName,
      visitorNote: input.visitorNote,
    });
    revalidatePath("/trocas");
    revalidatePath("/ofertas");
    return { ok: true, message: "Oferta enviada. O dono da coleção vai analisar." };
  } catch (error) {
    unstable_rethrow(error);
    return {
      ok: false,
      message: error instanceof AppError ? error.message : "Não foi possível enviar a oferta.",
    };
  }
}

export async function acceptTradeOfferAction(id: string): Promise<OfferActionResult> {
  try {
    await requireAdmin();
    await acceptTradeOffer(id);
    revalidatePath("/", "layout");
    return { ok: true, message: "Troca aceita." };
  } catch (error) {
    unstable_rethrow(error);
    return {
      ok: false,
      message: error instanceof AppError ? error.message : "Não foi possível aceitar a oferta.",
    };
  }
}

export async function rejectTradeOfferAction(id: string): Promise<OfferActionResult> {
  try {
    await requireAdmin();
    await rejectTradeOffer(id);
    revalidatePath("/ofertas");
    revalidatePath("/trocas");
    return { ok: true, message: "Oferta recusada." };
  } catch (error) {
    unstable_rethrow(error);
    return {
      ok: false,
      message: error instanceof AppError ? error.message : "Não foi possível recusar a oferta.",
    };
  }
}
