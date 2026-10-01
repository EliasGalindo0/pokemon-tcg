import { AppError } from "@/lib/errors";
import {
  isPromoSetBrief,
  localNumber,
  parseCardNumber,
  printedCardNumber,
} from "@/lib/card-number";
import { isOneOf, LANGUAGES, type LanguageValue } from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import { catalogLanguage, catalogLogoUrl, catalogSlotImage, fetchTcg } from "@/services/catalog";
import type {
  PublicTrader,
  TradeBoard,
  TradeOwner,
  TradeSetCandidate,
  TradeSetSummary,
  TradeSlot,
  TradeStockSet,
} from "@/types/trade";

const SET_ID = /^[a-z0-9][a-z0-9.-]{0,40}$/i;
const BASE_URL = process.env.TCGDEX_API_URL ?? "https://api.tcgdex.net/v2";

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

export function tradeLanguage(value: string | undefined): LanguageValue {
  return isOneOf(LANGUAGES, value) ? value : "PT_BR";
}

function printedNumber(localId: string, official: number, promo = false) {
  return printedCardNumber(localId, promo ? 0 : official);
}

async function readCatalogJson<T>(path: string): Promise<T | null> {
  const response = await fetch(`${BASE_URL}/${path}`, {
    headers: { accept: "application/json" },
    cache: "no-store",
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new AppError("O catálogo de cartas não respondeu.", 502);
  return (await response.json()) as T;
}

async function loadCatalogSet(setId: string, language: LanguageValue) {
  const id = setId.trim();
  if (!SET_ID.test(id)) throw new AppError("Coleção inválida.", 400);
  const set = await fetchTcg<TcgSet>(language, `sets/${encodeURIComponent(id)}`);
  if (!set?.id || !set.name || !set.cards?.length) {
    throw new AppError("Coleção não encontrada no catálogo.", 404);
  }
  return set;
}

function slotFromBrief(card: TcgSetCard, setId: string, official: number, promo: boolean): TradeSlot | null {
  if (!card.id || !card.name || card.localId === undefined) return null;
  const localId = String(card.localId);
  return {
    tcgId: card.id,
    name: card.name,
    localId,
    number: printedNumber(localId, official, promo),
    imageUrl: catalogSlotImage(setId, card, "low"),
    quantity: 0,
  };
}

function toOwner(user: { id: string; username: string; displayName: string }): TradeOwner {
  return { id: user.id, username: user.username, displayName: user.displayName };
}

export async function listPublicTraders(excludeUserId?: string): Promise<PublicTrader[]> {
  const owners = await prisma.user.findMany({
    where: {
      active: true,
      ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
      tradeSets: { some: { entries: { some: { quantity: { gt: 0 } } } } },
    },
    select: {
      username: true,
      displayName: true,
      tradeSets: {
        where: { entries: { some: { quantity: { gt: 0 } } } },
        select: {
          entries: {
            where: { quantity: { gt: 0 } },
            select: { quantity: true, imageUrl: true },
            orderBy: { updatedAt: "desc" },
          },
        },
      },
    },
    orderBy: { displayName: "asc" },
  });

  return owners
    .map((owner) => {
      const unitCount = owner.tradeSets.reduce(
        (sum, set) => sum + set.entries.reduce((inner, entry) => inner + entry.quantity, 0),
        0,
      );
      const sampleImages = owner.tradeSets
        .flatMap((set) => set.entries.map((entry) => entry.imageUrl).filter((url): url is string => Boolean(url)))
        .slice(0, 4);
      return {
        username: owner.username,
        displayName: owner.displayName,
        setCount: owner.tradeSets.length,
        unitCount,
        sampleImages,
      };
    })
    .filter((owner) => owner.unitCount > 0);
}

export async function getTradeOwnerByUsername(username: string): Promise<TradeOwner | null> {
  const user = await prisma.user.findUnique({
    where: { username: username.trim().toLowerCase() },
    select: { id: true, username: true, displayName: true, active: true },
  });
  if (!user || !user.active) return null;
  return toOwner(user);
}

export async function findTradeSetOwner(tradeSetId: string): Promise<TradeOwner | null> {
  const row = await prisma.tradeSet.findUnique({
    where: { id: tradeSetId },
    select: { user: { select: { id: true, username: true, displayName: true, active: true } } },
  });
  if (!row?.user.active) return null;
  return toOwner(row.user);
}

export async function listTradeStock(userId: string): Promise<TradeStockSet[]> {
  const rows = await prisma.tradeSet.findMany({
    where: { userId, entries: { some: { quantity: { gt: 0 } } } },
    include: {
      user: { select: { id: true, username: true, displayName: true } },
      entries: { where: { quantity: { gt: 0 } }, orderBy: { name: "asc" } },
    },
    orderBy: { name: "asc" },
  });

  return rows.map((row) => ({
    id: row.id,
    tcgSetId: row.tcgSetId,
    name: row.name,
    logoUrl: row.logoUrl,
    language: row.language,
    official: row.official,
    unitCount: row.entries.reduce((sum, entry) => sum + entry.quantity, 0),
    owner: toOwner(row.user),
    entries: row.entries.map((entry) => ({
      tcgId: entry.tcgId,
      name: entry.name,
      localId: entry.localId,
      number: entry.cardNumber ?? entry.localId,
      imageUrl: entry.imageUrl,
      quantity: entry.quantity,
    })),
  }));
}

export function tradeBoardFromStock(set: TradeStockSet): TradeBoard {
  return {
    id: set.id,
    tcgSetId: set.tcgSetId,
    name: set.name,
    logoUrl: set.logoUrl,
    language: set.language,
    official: set.official,
    total: set.entries.length,
    ownedSlots: set.entries.length,
    unitCount: set.unitCount,
    slots: set.entries,
    owner: set.owner,
  };
}

export async function listTradeSets(userId: string): Promise<TradeSetSummary[]> {
  const rows = await prisma.tradeSet.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: { entries: { select: { quantity: true } } },
  });

  return rows.map((row) => ({
    id: row.id,
    tcgSetId: row.tcgSetId,
    name: row.name,
    logoUrl: row.logoUrl,
    language: row.language,
    official: row.official,
    entryCount: row.entries.length,
    unitCount: row.entries.reduce((sum, entry) => sum + entry.quantity, 0),
  }));
}

export async function resolveTradeSetsFromCardNumber(
  query: string,
  language: LanguageValue,
): Promise<TradeSetCandidate[]> {
  const parsed = parseCardNumber(query);
  if (!parsed || (!parsed.infinite && parsed.official == null)) {
    throw new AppError("Use o formato do número da carta, ex.: 001/094 ou 095/∞.", 400);
  }

  const lang = catalogLanguage(language);
  const sets = await readCatalogJson<TcgSetBrief[]>(`${lang}/sets`);
  if (!Array.isArray(sets) || sets.length === 0) {
    throw new AppError("Não foi possível listar as coleções do catálogo.", 502);
  }

  const matches = parsed.infinite
    ? sets.filter((set) => Boolean(set.id && set.name) && isPromoSetBrief(set))
    : sets.filter(
        (set) => Boolean(set.id && set.name) && (set.cardCount?.official ?? 0) === parsed.official,
      );

  const candidates: TradeSetCandidate[] = [];
  for (const brief of matches.slice(0, parsed.infinite ? 60 : 12)) {
    const set = await readCatalogJson<TcgSet>(`${lang}/sets/${encodeURIComponent(brief.id!)}`);
    if (!set?.id || !set.name || !set.cards?.length) continue;

    const matchCard = set.cards.find((card) => localNumber(card.localId) === parsed.localKey);
    if (!matchCard) continue;

    const official = set.cardCount?.official ?? parsed.official ?? 0;
    const promo = parsed.infinite || isPromoSetBrief(set);
    const localId = String(matchCard.localId ?? parsed.localId);
    candidates.push({
      tcgSetId: set.id,
      name: set.name,
      logoUrl: catalogLogoUrl(set.logo),
      official,
      total: set.cards.length,
      sampleNumber: printedNumber(localId, official, promo),
    });
  }

  return candidates;
}

export async function createTradeSet(userId: string, tcgSetId: string, language: LanguageValue) {
  const set = await loadCatalogSet(tcgSetId, language);
  const official = set.cardCount?.official ?? 0;
  const existing = await prisma.tradeSet.findUnique({
    where: { userId_tcgSetId_language: { userId, tcgSetId: set.id!, language } },
  });
  if (existing) return existing;

  return prisma.tradeSet.create({
    data: {
      userId,
      tcgSetId: set.id!,
      name: set.name!,
      logoUrl: catalogLogoUrl(set.logo),
      language,
      official,
    },
  });
}

export async function getTradeBoard(userId: string, id: string): Promise<TradeBoard> {
  const tradeSet = await prisma.tradeSet.findFirst({
    where: { id, userId },
    include: {
      entries: true,
      user: { select: { id: true, username: true, displayName: true } },
    },
  });
  if (!tradeSet) throw new AppError("Coleção de troca não encontrada.", 404);

  const catalog = await loadCatalogSet(tradeSet.tcgSetId, tradeSet.language);
  const official = catalog.cardCount?.official ?? tradeSet.official;
  const promo = isPromoSetBrief(catalog);
  const slots = (catalog.cards ?? [])
    .map((card) => slotFromBrief(card, catalog.id!, official, promo))
    .filter((slot): slot is TradeSlot => Boolean(slot));

  const byTcg = new Map(tradeSet.entries.map((entry) => [entry.tcgId, entry.quantity]));
  for (const slot of slots) {
    slot.quantity = byTcg.get(slot.tcgId) ?? 0;
  }

  return {
    id: tradeSet.id,
    tcgSetId: tradeSet.tcgSetId,
    name: tradeSet.name,
    logoUrl: catalogLogoUrl(catalog.logo) ?? tradeSet.logoUrl,
    language: tradeSet.language,
    official,
    total: slots.length,
    ownedSlots: slots.filter((slot) => slot.quantity > 0).length,
    unitCount: slots.reduce((sum, slot) => sum + slot.quantity, 0),
    slots,
    owner: toOwner(tradeSet.user),
  };
}

export async function setTradeQuantity(userId: string, tradeSetId: string, tcgId: string, quantity: number) {
  const tradeSet = await prisma.tradeSet.findFirst({ where: { id: tradeSetId, userId } });
  if (!tradeSet) throw new AppError("Coleção de troca não encontrada.", 404);

  const next = Math.max(0, Math.floor(quantity));
  const catalog = await loadCatalogSet(tradeSet.tcgSetId, tradeSet.language);
  const card = catalog.cards?.find((item) => item.id === tcgId);
  if (!card?.id || !card.name || card.localId === undefined) {
    throw new AppError("Carta não encontrada nesta coleção.", 404);
  }

  const localId = String(card.localId);
  const official = catalog.cardCount?.official ?? tradeSet.official;
  const promo = isPromoSetBrief(catalog);
  const number = printedNumber(localId, official, promo);
  const imageUrl = catalogSlotImage(catalog.id, card, "low");

  if (next <= 0) {
    await prisma.tradeEntry.deleteMany({ where: { tradeSetId, tcgId } });
    return;
  }

  await prisma.tradeEntry.upsert({
    where: { tradeSetId_tcgId: { tradeSetId, tcgId } },
    create: {
      tradeSetId,
      tcgId,
      name: card.name,
      localId,
      cardNumber: number,
      imageUrl,
      quantity: next,
    },
    update: {
      name: card.name,
      localId,
      cardNumber: number,
      imageUrl,
      quantity: next,
    },
  });

  await prisma.tradeSet.update({ where: { id: tradeSetId }, data: { updatedAt: new Date() } });
}

export async function deleteTradeSet(userId: string, id: string) {
  const existing = await prisma.tradeSet.findFirst({ where: { id, userId } });
  if (!existing) throw new AppError("Coleção de troca não encontrada.", 404);
  await prisma.tradeSet.delete({ where: { id } });
}

async function resolveTcgSetId(language: LanguageValue, setCode: string | null, setName: string) {
  if (setCode && SET_ID.test(setCode.trim())) {
    const byCode = await fetchTcg<TcgSet>(language, `sets/${encodeURIComponent(setCode.trim())}`);
    if (byCode?.id) return byCode.id;
  }

  const rows = await fetchTcg<TcgSetBrief[]>(language, `sets?name=${encodeURIComponent(setName)}`);
  if (!Array.isArray(rows)) return null;
  const exact = rows.find((row) => row.name?.toLowerCase() === setName.toLowerCase() && row.id);
  if (exact?.id) return exact.id;
  const first = rows.find((row) => row.id);
  return first?.id ?? null;
}

export async function syncTradeExcessFromCard(
  userId: string,
  card: {
  name: string;
  cardNumber: string | null;
  quantity: number;
  language: LanguageValue;
  imageUrl: string | null;
  set: { name: string; code: string | null };
},
) {
  const excess = Math.max(0, Math.floor(card.quantity) - 1);
  const localId = localNumber(card.cardNumber);
  if (!localId) return;

  const tcgSetId = await resolveTcgSetId(card.language, card.set.code, card.set.name);
  if (!tcgSetId) return;

  let catalog: TcgSet;
  try {
    catalog = await loadCatalogSet(tcgSetId, card.language);
  } catch {
    return;
  }

  const match = catalog.cards?.find((item) => localNumber(item.localId) === localId);
  if (!match?.id || !match.name || match.localId === undefined) return;

  const tradeSet = await createTradeSet(userId, tcgSetId, card.language);
  const official = catalog.cardCount?.official ?? tradeSet.official;
  const promo = isPromoSetBrief(catalog);
  const number = printedNumber(String(match.localId), official, promo);
  const imageUrl = catalogSlotImage(catalog.id, match, "low") ?? card.imageUrl;

  if (excess <= 0) {
    await prisma.tradeEntry.deleteMany({ where: { tradeSetId: tradeSet.id, tcgId: match.id } });
    return;
  }

  await prisma.tradeEntry.upsert({
    where: { tradeSetId_tcgId: { tradeSetId: tradeSet.id, tcgId: match.id } },
    create: {
      tradeSetId: tradeSet.id,
      tcgId: match.id,
      name: match.name,
      localId: String(match.localId),
      cardNumber: number,
      imageUrl,
      quantity: excess,
    },
    update: {
      name: match.name,
      localId: String(match.localId),
      cardNumber: number,
      imageUrl,
      quantity: excess,
    },
  });

  await prisma.tradeSet.update({ where: { id: tradeSet.id }, data: { updatedAt: new Date() } });
}
