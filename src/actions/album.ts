"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { AppError } from "@/lib/errors";
import { requireAdmin } from "@/lib/auth";
import { albumLanguage, ownAlbumCard, ownMissingAlbumCards, releaseAlbumCards } from "@/services/album";

function invalidate() {
  revalidatePath("/", "layout");
}

function failure(error: unknown) {
  unstable_rethrow(error);
  if (error instanceof AppError) return error.message;
  return "Não foi possível atualizar o álbum.";
}

export async function toggleAlbumSlot(setId: string, language: string, tcgId: string, ownedIds: string[]) {
  try {
    await requireAdmin();
    if (ownedIds.length > 0) await releaseAlbumCards(ownedIds);
    else await ownAlbumCard(setId, albumLanguage(language), tcgId);
    invalidate();
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, message: failure(error) };
  }
}

export async function ownEntireAlbum(setId: string, language: string) {
  try {
    await requireAdmin();
    const added = await ownMissingAlbumCards(setId, albumLanguage(language));
    invalidate();
    return { ok: true as const, added };
  } catch (error) {
    return { ok: false as const, message: failure(error) };
  }
}
