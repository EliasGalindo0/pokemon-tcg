import { AppError } from "@/lib/errors";
import { localNumber, printedCardNumber } from "@/lib/card-number";
import { isOneOf, LANGUAGES, type LanguageValue } from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import { catalogImageUrl, catalogLogoUrl, fetchCatalogCard, fetchTcg } from "@/services/catalog";
import { createCard, createCards, deleteCards } from "@/services/cards";
import type { CardPayload } from "@/types/card";
import type { AlbumSetOption, AlbumSlot, AlbumView } from "@/types/album";

const SET_ID = /^[a-z0-9][a-z0-9.-]{0,40}$/i;

type TcgSetBrief = {
  id?: string;
  name?: string;
  logo?: string;
  cardCount?: { official?: number; total?: number };
};

type TcgSetCard = {
  id?: string;
  name?: string;
  localId?: string | number;
  image?: string;
};

type TcgSet = TcgSetBrief & {
  cards?: TcgSetCard[];
};

export function albumLanguage(value: string | undefined): LanguageValue {
  return isOneOf(LANGUAGES, value) ? value : "PT_BR";
}

function assertSetId(setId: string) {
  const id = setId.trim();
  if (!SET_ID.test(id)) throw new AppError("Coleção inválida.", 400);
  return id;
}

function printedNumber(localId: string, official: number) {
  return printedCardNumber(localId, official);
}

function slotFromBrief(card: TcgSetCard, official: number): AlbumSlot | null {
  if (!card.id || !card.name || card.localId === undefined) return null;
  const localId = String(card.localId);
  return {
    tcgId: card.id,
    name: card.name,
    localId,
    number: printedNumber(localId, official),
    imageUrl: catalogImageUrl(card.image, "low"),
    owned: false,
    ownedIds: [],
    quantity: 0,
  };
}

async function loadSet(setId: string, language: LanguageValue) {
  const set = await fetchTcg<TcgSet>(language, `sets/${encodeURIComponent(setId)}`);
  if (!set?.id || !set.name || !set.cards?.length) {
    throw new AppError("Coleção não encontrada no catálogo.", 404);
  }
  return set;
}

export async function searchAlbumSets(query: string, language: LanguageValue): Promise<AlbumSetOption[]> {
  const name = query.trim();
  if (name.length < 2) return [];

  const rows = await fetchTcg<TcgSetBrief[]>(language, `sets?name=${encodeURIComponent(name)}`);
  if (!Array.isArray(rows)) return [];

  return rows
    .filter((set): set is TcgSetBrief & { id: string; name: string } => Boolean(set.id && set.name))
    .map((set) => ({
      id: set.id,
      name: set.name,
      logo: catalogLogoUrl(set.logo),
      official: set.cardCount?.official ?? 0,
      total: set.cardCount?.total ?? set.cardCount?.official ?? 0,
    }));
}

export async function getAlbum(
  userId: string | null,
  setId: string,
  language: LanguageValue,
): Promise<AlbumView> {
  const id = assertSetId(setId);
  const set = await loadSet(id, language);
  const official = set.cardCount?.official ?? 0;
  const slots = (set.cards ?? [])
    .map((card) => slotFromBrief(card, official))
    .filter((slot): slot is AlbumSlot => Boolean(slot));

  const localSet = userId
    ? await prisma.set.findFirst({
        where: {
          userId,
          OR: [
            { name: { equals: set.name, mode: "insensitive" } },
            { code: { equals: set.id, mode: "insensitive" } },
          ],
        },
      })
    : null;

  if (localSet && userId) {
    const owned = await prisma.card.findMany({
      where: { userId, setId: localSet.id },
      select: { id: true, cardNumber: true, quantity: true, marketValue: true, purchasePrice: true },
    });
    const byNumber = new Map<
      string,
      { ids: string[]; quantity: number; marketValue: string; purchasePrice: string | null }
    >();
    for (const card of owned) {
      const key = localNumber(card.cardNumber);
      const current = byNumber.get(key) ?? {
        ids: [],
        quantity: 0,
        marketValue: card.marketValue.toString(),
        purchasePrice: card.purchasePrice?.toString() ?? null,
      };
      current.ids.push(card.id);
      current.quantity += card.quantity;
      byNumber.set(key, current);
    }
    for (const slot of slots) {
      const match = byNumber.get(localNumber(slot.localId));
      if (!match) continue;
      slot.owned = true;
      slot.ownedIds = match.ids;
      slot.quantity = match.quantity;
      slot.marketValue = match.marketValue;
      slot.purchasePrice = match.purchasePrice;
    }
  }

  return {
    setId: set.id ?? id,
    name: set.name ?? id,
    logo: catalogLogoUrl(set.logo),
    official,
    total: slots.length,
    ownedSlots: slots.filter((slot) => slot.owned).length,
    ownedUnits: slots.reduce((sum, slot) => sum + slot.quantity, 0),
    estimatedValue: slots
      .filter((slot) => slot.owned && slot.marketValue)
      .reduce((sum, slot) => sum + Number(slot.marketValue) * slot.quantity, 0)
      .toFixed(2),
    slots,
  };
}

function payloadFromHit(
  hit: NonNullable<Awaited<ReturnType<typeof fetchCatalogCard>>>,
  language: LanguageValue,
): CardPayload {
  return {
    name: hit.name,
    newSetName: hit.setName,
    newSetCode: hit.setCode || undefined,
    cardNumber: hit.cardNumber,
    rarity: hit.rarity,
    condition: "NEAR_MINT",
    language,
    marketValue: Number.isFinite(Number(hit.marketValue)) ? Number(hit.marketValue) : 0,
    purchasePrice: null,
    quantity: 1,
    imageUrl: hit.imageUrl,
  };
}

export async function ownAlbumCard(userId: string, setId: string, language: LanguageValue, tcgId: string) {
  const album = await getAlbum(userId, setId, language);
  const slot = album.slots.find((item) => item.tcgId === tcgId);
  if (!slot) throw new AppError("Carta não encontrada nesta coleção.", 404);
  if (slot.owned) return;

  const hit = await fetchCatalogCard(language, tcgId);
  if (hit) {
    await createCard(userId, payloadFromHit(hit, language));
    return;
  }

  await createCard(userId, {
    name: slot.name,
    newSetName: album.name,
    newSetCode: album.setId,
    cardNumber: slot.number,
    rarity: "COMMON",
    condition: "NEAR_MINT",
    language,
    marketValue: 0,
    purchasePrice: null,
    quantity: 1,
    imageUrl: slot.imageUrl,
  });
}

export async function releaseAlbumCards(userId: string, ids: string[]) {
  await deleteCards(userId, ids);
}

export async function ownMissingAlbumCards(userId: string, setId: string, language: LanguageValue) {
  const album = await getAlbum(userId, setId, language);
  const missing = album.slots.filter((slot) => !slot.owned);
  if (missing.length === 0) return 0;

  const payloads: CardPayload[] = [];
  const size = 6;
  for (let index = 0; index < missing.length; index += size) {
    const chunk = missing.slice(index, index + size);
    const hits = await Promise.all(chunk.map((slot) => fetchCatalogCard(language, slot.tcgId)));
    chunk.forEach((slot, offset) => {
      const hit = hits[offset];
      if (hit) {
        payloads.push(payloadFromHit(hit, language));
        return;
      }
      payloads.push({
        name: slot.name,
        newSetName: album.name,
        newSetCode: album.setId,
        cardNumber: slot.number,
        rarity: "COMMON",
        condition: "NEAR_MINT",
        language,
        marketValue: 0,
        purchasePrice: null,
        quantity: 1,
        imageUrl: slot.imageUrl,
      });
    });
  }

  return createCards(userId, payloads);
}
