import { AppError } from "@/lib/errors";
import { DECK_FORMATS, isOneOf, type DeckFormatValue } from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import { bumpCacheVersion } from "@/lib/redis";
import { fetchCatalogCard, findEnergyArtwork } from "@/services/catalog";
import type { CatalogHit } from "@/types/catalog";
import type { DeckDetail, DeckEntryDTO, DeckPayload, DeckSummary } from "@/types/deck";

function entryImage(entry: {
  imageUrl?: string | null;
  card?: { imageUrl: string | null; name?: string } | null;
}) {
  return entry.card?.imageUrl || entry.imageUrl || null;
}

function pickFallbackCover(
  entries: {
    quantity: number;
    imageUrl?: string | null;
    name?: string | null;
    card?: { imageUrl: string | null; name: string } | null;
  }[],
) {
  return [...entries]
    .sort((a, b) => {
      const aEnergy = /^energia\b/i.test(a.card?.name || a.name || "") ? 0 : 1;
      const bEnergy = /^energia\b/i.test(b.card?.name || b.name || "") ? 0 : 1;
      if (aEnergy !== bEnergy) return bEnergy - aEnergy;
      return b.quantity - a.quantity;
    })
    .map((entry) => entryImage(entry))
    .find((url): url is string => Boolean(url));
}

function summary(deck: {
  id: string;
  name: string;
  format: DeckFormatValue;
  coverEntryId?: string | null;
  updatedAt: Date;
  entries: {
    id?: string;
    quantity: number;
    imageUrl?: string | null;
    name?: string | null;
    card?: { imageUrl: string | null; name: string } | null;
  }[];
  coverEntry?: {
    imageUrl?: string | null;
    card?: { imageUrl: string | null } | null;
  } | null;
}): DeckSummary {
  const chosen =
    (deck.coverEntry ? entryImage(deck.coverEntry) : null) ||
    (deck.coverEntryId
      ? entryImage(deck.entries.find((entry) => entry.id === deck.coverEntryId) ?? {})
      : null) ||
    pickFallbackCover(deck.entries);

  return {
    id: deck.id,
    name: deck.name,
    format: deck.format,
    cardCount: deck.entries.reduce((sum, entry) => sum + entry.quantity, 0),
    coverEntryId: deck.coverEntryId ?? null,
    coverImageUrl: chosen ?? null,
    updatedAt: deck.updatedAt.toISOString(),
  };
}

export function parseDeckFormat(value: string | undefined): DeckFormatValue {
  return isOneOf(DECK_FORMATS, value) ? value : "STANDARD";
}

export async function listDecks(userId: string): Promise<DeckSummary[]> {
  const decks = await prisma.deck.findMany({
    where: { userId },
    include: {
      coverEntry: { include: { card: { select: { imageUrl: true, name: true } } } },
      entries: {
        select: {
          id: true,
          quantity: true,
          imageUrl: true,
          name: true,
          card: { select: { imageUrl: true, name: true } },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });
  return decks.map(summary);
}

function localNumber(value: string | null | undefined) {
  if (!value) return "";
  const head = value.split("/")[0]?.trim() ?? "";
  return head.replace(/^0+(?=\d)/, "");
}

export async function getDeck(userId: string, id: string): Promise<DeckDetail | null> {
  const deck = await prisma.deck.findFirst({
    where: { id, userId },
    include: {
      coverEntry: { include: { card: { select: { imageUrl: true, name: true } } } },
      entries: {
        include: { card: { include: { set: true } } },
      },
    },
  });
  if (!deck) return null;

  await Promise.all(
    deck.entries.map(async (entry) => {
      if (entry.imageUrl || !entry.name || !/^energia\b/i.test(entry.name)) return;
      const artwork = await findEnergyArtwork(entry.name, "PT_BR");
      if (!artwork) return;
      entry.imageUrl = artwork;
      await prisma.deckEntry.update({ where: { id: entry.id }, data: { imageUrl: artwork } });
    }),
  );

  const entries: DeckEntryDTO[] = deck.entries
    .map((entry) => {
      if (entry.card) {
        return {
          id: entry.id,
          quantity: entry.quantity,
          owned: entry.card.quantity,
          cardId: entry.card.id,
          tcgId: null,
          name: entry.card.name,
          setName: entry.card.set.name,
          cardNumber: entry.card.cardNumber,
          imageUrl: entry.card.imageUrl,
        };
      }
      return {
        id: entry.id,
        quantity: entry.quantity,
        owned: null,
        cardId: null,
        tcgId: entry.tcgId,
        name: entry.name ?? "Carta",
        setName: entry.setName ?? "",
        cardNumber: entry.cardNumber,
        imageUrl: entry.imageUrl,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, "pt"));

  return { ...summary(deck), entries };
}

export async function createDeck(userId: string, input: DeckPayload) {
  const deck = await prisma.deck.create({
    data: { userId, name: input.name, format: input.format },
    include: { entries: { select: { quantity: true } } },
  });
  await bumpCacheVersion();
  return summary(deck);
}

export async function updateDeck(userId: string, id: string, input: DeckPayload) {
  const existing = await prisma.deck.findFirst({ where: { id, userId } });
  if (!existing) throw new AppError("Deck não encontrado.", 404);
  const deck = await prisma.deck.update({
    where: { id },
    data: { name: input.name, format: input.format },
    include: { entries: { select: { quantity: true } } },
  });
  await bumpCacheVersion();
  return summary(deck);
}

export async function deleteDeck(userId: string, id: string) {
  const existing = await prisma.deck.findFirst({ where: { id, userId } });
  if (!existing) throw new AppError("Deck não encontrado.", 404);
  await prisma.deck.delete({ where: { id } });
  await bumpCacheVersion();
}

export async function setDeckCover(userId: string, deckId: string, entryId: string) {
  const deck = await prisma.deck.findFirst({ where: { id: deckId, userId } });
  if (!deck) throw new AppError("Deck não encontrado.", 404);

  const entry = await prisma.deckEntry.findFirst({
    where: { id: entryId, deckId },
    include: { card: { select: { imageUrl: true } } },
  });
  if (!entry) throw new AppError("Carta não encontrada neste deck.", 404);
  if (!entryImage(entry)) throw new AppError("Essa carta não tem imagem para usar como capa.", 400);

  await prisma.deck.update({
    where: { id: deckId },
    data: { coverEntryId: entryId },
  });
  await bumpCacheVersion();
}

export async function setDeckCardQuantity(userId: string, deckId: string, cardId: string, quantity: number) {
  const deck = await prisma.deck.findFirst({ where: { id: deckId, userId } });
  if (!deck) throw new AppError("Deck não encontrado.", 404);

  if (quantity <= 0) {
    const entry = await prisma.deckEntry.findUnique({ where: { deckId_cardId: { deckId, cardId } } });
    await prisma.deckEntry.deleteMany({ where: { deckId, cardId } });
    if (entry && deck.coverEntryId === entry.id) {
      await prisma.deck.update({ where: { id: deckId }, data: { coverEntryId: null } });
    }
    await bumpCacheVersion();
    return;
  }

  const card = await prisma.card.findFirst({ where: { id: cardId, userId } });
  if (!card) throw new AppError("Carta não encontrada na coleção.", 404);

  await prisma.deckEntry.upsert({
    where: { deckId_cardId: { deckId, cardId } },
    create: { deckId, cardId, quantity },
    update: { quantity },
  });
  await bumpCacheVersion();
}

async function matchingCollectionCard(userId: string, hit: CatalogHit) {
  const number = localNumber(hit.cardNumber);
  if (!number) return null;
  const cards = await prisma.card.findMany({
    where: { userId, set: { name: { equals: hit.setName, mode: "insensitive" } } },
    orderBy: { quantity: "desc" },
  });
  return cards.find((card) => localNumber(card.cardNumber) === number) ?? null;
}

export async function addCatalogCardToDeck(userId: string, deckId: string, tcgId: string) {
  const deck = await prisma.deck.findFirst({ where: { id: deckId, userId } });
  if (!deck) throw new AppError("Deck não encontrado.", 404);

  const hit = (await fetchCatalogCard("PT_BR", tcgId)) ?? (await fetchCatalogCard("EN", tcgId));
  if (!hit) throw new AppError("Carta não encontrada no catálogo.", 404);

  const owned = await matchingCollectionCard(userId, hit);
  if (owned) {
    const current = await prisma.deckEntry.findUnique({
      where: { deckId_cardId: { deckId, cardId: owned.id } },
    });
    await setDeckCardQuantity(userId, deckId, owned.id, (current?.quantity ?? 0) + 1);
    return;
  }

  const current = await prisma.deckEntry.findUnique({
    where: { deckId_tcgId: { deckId, tcgId: hit.id } },
  });
  const quantity = (current?.quantity ?? 0) + 1;
  const imageUrl = hit.imageUrl ?? (await findEnergyArtwork(hit.name, "PT_BR"));
  await prisma.deckEntry.upsert({
    where: { deckId_tcgId: { deckId, tcgId: hit.id } },
    create: {
      deckId,
      tcgId: hit.id,
      quantity,
      name: hit.name,
      setName: hit.setName,
      cardNumber: hit.cardNumber,
      imageUrl,
    },
    update: { quantity, imageUrl: imageUrl ?? undefined },
  });
  await bumpCacheVersion();
}

export async function setDeckCatalogQuantity(userId: string, deckId: string, tcgId: string, quantity: number) {
  const deck = await prisma.deck.findFirst({ where: { id: deckId, userId } });
  if (!deck) throw new AppError("Deck não encontrado.", 404);

  if (quantity <= 0) {
    const existing = await prisma.deckEntry.findUnique({ where: { deckId_tcgId: { deckId, tcgId } } });
    await prisma.deckEntry.deleteMany({ where: { deckId, tcgId } });
    if (existing && deck.coverEntryId === existing.id) {
      await prisma.deck.update({ where: { id: deckId }, data: { coverEntryId: null } });
    }
    await bumpCacheVersion();
    return;
  }

  const existing = await prisma.deckEntry.findUnique({ where: { deckId_tcgId: { deckId, tcgId } } });
  if (!existing) throw new AppError("Carta não encontrada neste deck.", 404);
  await prisma.deckEntry.update({ where: { id: existing.id }, data: { quantity } });
  await bumpCacheVersion();
}

export async function countDecks(userId: string) {
  return prisma.deck.count({ where: { userId } });
}
