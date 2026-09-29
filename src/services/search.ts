import { prisma } from "@/lib/prisma";
import type { GlobalSearchHit, GlobalSearchResult } from "@/types/search";

const LIMIT = 6;

export async function globalSearch(userId: string, rawQuery: string): Promise<GlobalSearchResult> {
  const q = rawQuery.trim();
  if (q.length < 2) {
    return { q, cards: [], decks: [], trades: [] };
  }

  const [cards, decks, deckEntries, tradeEntries, tradeSets] = await Promise.all([
    prisma.card.findMany({
      where: {
        userId,
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { cardNumber: { contains: q, mode: "insensitive" } },
          { set: { name: { contains: q, mode: "insensitive" } } },
          { set: { code: { contains: q, mode: "insensitive" } } },
        ],
      },
      include: { set: true },
      orderBy: { name: "asc" },
      take: LIMIT,
    }),
    prisma.deck.findMany({
      where: { userId, name: { contains: q, mode: "insensitive" } },
      orderBy: { name: "asc" },
      take: LIMIT,
    }),
    prisma.deckEntry.findMany({
      where: {
        deck: { userId },
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { cardNumber: { contains: q, mode: "insensitive" } },
          { tcgId: { contains: q, mode: "insensitive" } },
          { setName: { contains: q, mode: "insensitive" } },
          { card: { name: { contains: q, mode: "insensitive" } } },
        ],
      },
      include: { deck: true, card: true },
      take: LIMIT,
    }),
    prisma.tradeEntry.findMany({
      where: {
        tradeSet: { userId },
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { cardNumber: { contains: q, mode: "insensitive" } },
          { localId: { contains: q, mode: "insensitive" } },
          { tcgId: { contains: q, mode: "insensitive" } },
        ],
      },
      include: { tradeSet: true },
      orderBy: { name: "asc" },
      take: LIMIT,
    }),
    prisma.tradeSet.findMany({
      where: {
        userId,
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { tcgSetId: { contains: q, mode: "insensitive" } },
        ],
      },
      orderBy: { name: "asc" },
      take: LIMIT,
    }),
  ]);

  const cardHits: GlobalSearchHit[] = cards.map((card) => ({
    id: card.id,
    kind: "card",
    title: card.name,
    subtitle: [card.set.name, card.cardNumber].filter(Boolean).join(" · "),
    href: `/cards/${card.id}`,
    imageUrl: card.imageUrl,
  }));

  const deckHitsById = new Map<string, GlobalSearchHit>();
  for (const deck of decks) {
    deckHitsById.set(deck.id, {
      id: deck.id,
      kind: "deck",
      title: deck.name,
      subtitle: "Deck",
      href: `/decks/${deck.id}`,
      imageUrl: null,
    });
  }
  for (const entry of deckEntries) {
    if (deckHitsById.has(entry.deckId)) continue;
    const name = entry.name ?? entry.card?.name ?? "Carta";
    deckHitsById.set(entry.deckId, {
      id: entry.deckId,
      kind: "deck",
      title: entry.deck.name,
      subtitle: `Contém ${name}`,
      href: `/decks/${entry.deckId}`,
      imageUrl: entry.imageUrl ?? entry.card?.imageUrl ?? null,
    });
  }

  const tradeHits: GlobalSearchHit[] = [
    ...tradeSets.map((set) => ({
      id: `set-${set.id}`,
      kind: "trade" as const,
      title: set.name,
      subtitle: "Coleção de troca",
      href: `/trocas?tab=${set.id}`,
      imageUrl: set.logoUrl,
    })),
    ...tradeEntries.map((entry) => ({
      id: entry.id,
      kind: "trade" as const,
      title: entry.name,
      subtitle: [entry.tradeSet.name, entry.cardNumber ?? entry.localId, `${entry.quantity} un.`]
        .filter(Boolean)
        .join(" · "),
      href: `/trocas?tab=${entry.tradeSetId}`,
      imageUrl: entry.imageUrl,
    })),
  ].slice(0, LIMIT);

  return {
    q,
    cards: cardHits,
    decks: [...deckHitsById.values()].slice(0, LIMIT),
    trades: tradeHits,
  };
}
