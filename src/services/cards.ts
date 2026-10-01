import { Prisma, type Card, type Set as CardSet } from "@prisma/client";
import { AppError } from "@/lib/errors";
import { RARITY_RANK } from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import { bumpCacheVersion, cacheGet, cacheSet, getCacheVersion } from "@/lib/redis";
import { fillMissingImages } from "@/services/catalog";
import { withSetLogos } from "@/services/set-logos";
import { resolveSet } from "@/services/sets";
import { syncTradeExcessFromCard } from "@/services/trades";
import { deleteUpload } from "@/lib/uploads";
import type { CardDTO, CardListResult, CardPayload, CardQuery } from "@/types/card";
import type { LanguageValue } from "@/lib/labels";

export const PAGE_SIZE = 50;

type CardWithSet = Card & { set: CardSet };

export function toCardDto(card: CardWithSet): CardDTO {
  return {
    id: card.id,
    name: card.name,
    cardNumber: card.cardNumber,
    rarity: card.rarity,
    condition: card.condition,
    language: card.language,
    marketValue: card.marketValue.toString(),
    purchasePrice: card.purchasePrice?.toString() ?? null,
    quantity: card.quantity,
    imageUrl: card.imageUrl,
    createdAt: card.createdAt.toISOString(),
    updatedAt: card.updatedAt.toISOString(),
    set: { id: card.set.id, name: card.set.name, code: card.set.code },
  };
}

function rarityOrderSql() {
  const branches = Object.entries(RARITY_RANK)
    .map(([rarity, rank]) => `WHEN '${rarity}' THEN ${rank}`)
    .join(" ");
  return `CASE "rarity" ${branches} ELSE 0 END`;
}

function whereFrom(
  userId: string,
  query: CardQuery,
  options?: { publicOnly?: boolean },
): Prisma.CardWhereInput {
  return {
    userId,
    ...(options?.publicOnly ? { set: { isPublic: true } } : {}),
    ...(query.q ? { name: { contains: query.q, mode: "insensitive" } } : {}),
    ...(query.setId ? { setId: query.setId } : {}),
    ...(query.rarity ? { rarity: query.rarity } : {}),
    ...(query.condition ? { condition: query.condition } : {}),
  };
}

function money(value: number) {
  return new Prisma.Decimal(value.toFixed(2));
}

export async function listCards(
  userId: string,
  query: CardQuery,
  options?: { publicOnly?: boolean },
): Promise<CardListResult> {
  await fillMissingImages(userId);
  const version = await getCacheVersion();
  const key = `v${version}:u:${userId}:cards:v6:${options?.publicOnly ? "pub" : "all"}:${JSON.stringify(query)}`;
  const cached = await cacheGet<CardListResult>(key);
  if (cached) return cached;

  if (options?.publicOnly && query.setId) {
    const allowed = await prisma.set.findFirst({
      where: { id: query.setId, userId, isPublic: true },
      select: { id: true },
    });
    if (!allowed) {
      return { items: [], page: 1, pageSize: PAGE_SIZE, total: 0, pageCount: 1 };
    }
  }

  const where = whereFrom(userId, query, options);
  const total = await prisma.card.count({ where });
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(query.page, pageCount);
  const sort = query.sort ?? "recent";

  const orderBy: Prisma.CardOrderByWithRelationInput[] =
    sort === "name"
      ? [{ name: "asc" }, { cardNumber: "asc" }]
      : sort === "number"
        ? [{ cardNumber: "asc" }, { name: "asc" }]
        : [{ createdAt: "desc" }, { name: "asc" }];

  const cards = await prisma.card.findMany({
    where,
    include: { set: true },
    orderBy,
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  });

  const result: CardListResult = {
    items: await withSetLogos(cards.map(toCardDto)),
    page,
    pageSize: PAGE_SIZE,
    total,
    pageCount,
  };
  await cacheSet(key, result, 60);
  return result;
}

export async function getCard(userId: string, id: string) {
  await fillMissingImages(userId);
  const version = await getCacheVersion();
  const key = `v${version}:u:${userId}:card:v4:${id}`;
  const cached = await cacheGet<CardDTO>(key);
  if (cached) return cached;

  const card = await prisma.card.findFirst({
    where: { id, userId },
    include: { set: true },
  });
  if (!card) return null;
  const [dto] = await withSetLogos([toCardDto(card)]);
  await cacheSet(key, dto, 60);
  return dto;
}

/** Cartas promocionais da coleção (raridade PROMO ou set com “promo” no nome). */
export async function listPromoCards(userId: string): Promise<CardDTO[]> {
  await fillMissingImages(userId);
  const cards = await prisma.card.findMany({
    where: {
      userId,
      OR: [
        { rarity: "PROMO" },
        { set: { name: { contains: "promo", mode: "insensitive" } } },
        { set: { name: { contains: "black star", mode: "insensitive" } } },
      ],
    },
    include: { set: true },
    orderBy: [{ name: "asc" }, { cardNumber: "asc" }],
  });
  return withSetLogos(cards.map(toCardDto));
}

export async function createCard(userId: string, input: CardPayload) {
  const set = await resolveSet(userId, input);
  const card = await prisma.card.create({
    data: {
      userId,
      name: input.name,
      setId: set.id,
      cardNumber: input.cardNumber ?? null,
      rarity: input.rarity,
      condition: input.condition,
      language: input.language,
      marketValue: money(input.marketValue),
      purchasePrice: input.purchasePrice === null ? null : money(input.purchasePrice),
      quantity: input.quantity,
      imageUrl: input.imageUrl,
    },
    include: { set: true },
  });
  await bumpCacheVersion();
  await syncTradeExcessFromCard(userId, {
    name: card.name,
    cardNumber: card.cardNumber,
    quantity: card.quantity,
    language: card.language as LanguageValue,
    imageUrl: card.imageUrl,
    set: { name: card.set.name, code: card.set.code },
  });
  return toCardDto(card);
}

export async function updateCard(userId: string, id: string, input: CardPayload) {
  const existing = await prisma.card.findFirst({ where: { id, userId } });
  if (!existing) throw new AppError("Carta não encontrada.", 404);

  const set = await resolveSet(userId, input);
  const card = await prisma.card.update({
    where: { id },
    data: {
      name: input.name,
      setId: set.id,
      cardNumber: input.cardNumber ?? null,
      rarity: input.rarity,
      condition: input.condition,
      language: input.language,
      marketValue: money(input.marketValue),
      purchasePrice: input.purchasePrice === null ? null : money(input.purchasePrice),
      quantity: input.quantity,
      imageUrl: input.imageUrl,
    },
    include: { set: true },
  });

  if (existing.imageUrl !== input.imageUrl) {
    await deleteUpload(existing.imageUrl);
  }
  await bumpCacheVersion();
  await syncTradeExcessFromCard(userId, {
    name: card.name,
    cardNumber: card.cardNumber,
    quantity: card.quantity,
    language: card.language as LanguageValue,
    imageUrl: card.imageUrl,
    set: { name: card.set.name, code: card.set.code },
  });
  return toCardDto(card);
}

export async function setCardQuantity(userId: string, id: string, quantity: number) {
  if (!Number.isInteger(quantity) || quantity < 0 || quantity > 99) {
    throw new AppError("Quantidade inválida.", 400);
  }
  const existing = await prisma.card.findFirst({
    where: { id, userId },
    include: { set: true },
  });
  if (!existing) throw new AppError("Carta não encontrada.", 404);

  if (quantity === 0) {
    await prisma.card.delete({ where: { id } });
    await deleteUpload(existing.imageUrl);
    await bumpCacheVersion();
    return null;
  }

  const card = await prisma.card.update({
    where: { id },
    data: { quantity },
    include: { set: true },
  });
  await bumpCacheVersion();
  await syncTradeExcessFromCard(userId, {
    name: card.name,
    cardNumber: card.cardNumber,
    quantity: card.quantity,
    language: card.language as LanguageValue,
    imageUrl: card.imageUrl,
    set: { name: card.set.name, code: card.set.code },
  });
  return toCardDto(card);
}

export async function deleteCard(userId: string, id: string) {
  const existing = await prisma.card.findFirst({ where: { id, userId } });
  if (!existing) throw new AppError("Carta não encontrada.", 404);
  await prisma.card.delete({ where: { id } });
  await deleteUpload(existing.imageUrl);
  await bumpCacheVersion();
}

export async function createCards(userId: string, inputs: CardPayload[]) {
  if (inputs.length === 0) return 0;
  const set = await resolveSet(userId, inputs[0]);
  await prisma.card.createMany({
    data: inputs.map((input) => ({
      userId,
      name: input.name,
      setId: set.id,
      cardNumber: input.cardNumber ?? null,
      rarity: input.rarity,
      condition: input.condition,
      language: input.language,
      marketValue: money(input.marketValue),
      purchasePrice: input.purchasePrice === null ? null : money(input.purchasePrice),
      quantity: input.quantity,
      imageUrl: input.imageUrl,
    })),
  });
  await bumpCacheVersion();
  return inputs.length;
}

export async function deleteCards(userId: string, ids: string[]) {
  const unique = [...new Set(ids)];
  if (unique.length === 0) return;
  const existing = await prisma.card.findMany({ where: { id: { in: unique }, userId } });
  if (existing.length === 0) return;
  await prisma.card.deleteMany({ where: { id: { in: existing.map((card) => card.id) }, userId } });
  const setIds = [...new Set(existing.map((card) => card.setId))];
  for (const setId of setIds) {
    const remaining = await prisma.card.count({ where: { setId, userId } });
    if (remaining === 0) await prisma.set.deleteMany({ where: { id: setId, userId } });
  }
  await Promise.all(existing.map((card) => deleteUpload(card.imageUrl)));
  await bumpCacheVersion();
}

export async function rarestCardIds(userId: string, limit: number) {
  const rows = await prisma.$queryRaw<{ id: string }[]>`
    SELECT "id"
    FROM "Card"
    WHERE "userId" = ${userId}
    ORDER BY ${Prisma.raw(rarityOrderSql())} DESC, "createdAt" DESC
    LIMIT ${limit}
  `;
  return rows.map((row) => row.id);
}
