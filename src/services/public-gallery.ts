import "server-only";

import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { listCards, getCard, PAGE_SIZE } from "@/services/cards";
import { listSets } from "@/services/sets";
import type { CardDTO, CardListResult, CardQuery, SetDTO } from "@/types/card";

export { PAGE_SIZE };

export type PublicCollector = {
  username: string;
  displayName: string;
  cardCount: number;
  setCount: number;
  tradeUnitCount: number;
  tradeSetCount: number;
};

export type PublicOwner = {
  id: string;
  username: string;
  displayName: string;
};

function toPublicCard(card: CardDTO): CardDTO {
  return { ...card, purchasePrice: null };
}

export async function listPublicCollectors(excludeUserId?: string): Promise<PublicCollector[]> {
  const owners = await prisma.user.findMany({
    where: {
      active: true,
      ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
      OR: [
        { sets: { some: { isPublic: true, cards: { some: {} } } } },
        { tradeSets: { some: { entries: { some: { quantity: { gt: 0 } } } } } },
      ],
    },
    select: {
      username: true,
      displayName: true,
      sets: {
        where: { isPublic: true },
        select: { id: true, _count: { select: { cards: true } } },
      },
      tradeSets: {
        where: { entries: { some: { quantity: { gt: 0 } } } },
        select: { entries: { where: { quantity: { gt: 0 } }, select: { quantity: true } } },
      },
    },
    orderBy: { displayName: "asc" },
  });

  return owners
    .map((owner) => {
      const publicSets = owner.sets.filter((set) => set._count.cards > 0);
      const cardCount = publicSets.reduce((sum, set) => sum + set._count.cards, 0);
      const tradeUnitCount = owner.tradeSets.reduce(
        (sum, set) => sum + set.entries.reduce((inner, entry) => inner + entry.quantity, 0),
        0,
      );
      return {
        username: owner.username,
        displayName: owner.displayName,
        cardCount,
        setCount: publicSets.length,
        tradeUnitCount,
        tradeSetCount: owner.tradeSets.length,
      };
    })
    .filter((owner) => owner.cardCount > 0 || owner.tradeUnitCount > 0);
}

export async function getPublicOwner(username: string): Promise<PublicOwner> {
  const user = await prisma.user.findUnique({
    where: { username: username.trim().toLowerCase() },
    select: {
      id: true,
      username: true,
      displayName: true,
      active: true,
      sets: { where: { isPublic: true }, select: { id: true }, take: 1 },
      tradeSets: {
        where: { entries: { some: { quantity: { gt: 0 } } } },
        select: { id: true },
        take: 1,
      },
    },
  });
  if (!user || !user.active || (user.sets.length === 0 && user.tradeSets.length === 0)) {
    throw new AppError("Coleção não encontrada ou privada.", 404);
  }
  return { id: user.id, username: user.username, displayName: user.displayName };
}

export async function listPublicCards(username: string, query: CardQuery): Promise<{
  owner: PublicOwner;
  sets: SetDTO[];
  result: CardListResult;
}> {
  const owner = await getPublicOwner(username);
  const [sets, result] = await Promise.all([
    listSets(owner.id, { publicOnly: true }),
    listCards(owner.id, query, { publicOnly: true }),
  ]);
  return {
    owner,
    sets,
    result: {
      ...result,
      items: result.items.map(toPublicCard),
    },
  };
}

export async function getPublicCard(username: string, cardId: string): Promise<{
  owner: PublicOwner;
  card: CardDTO;
}> {
  const owner = await getPublicOwner(username);
  const card = await getCard(owner.id, cardId);
  if (!card) throw new AppError("Carta não encontrada.", 404);

  const set = await prisma.set.findFirst({
    where: { id: card.set.id, userId: owner.id, isPublic: true },
    select: { id: true },
  });
  if (!set) throw new AppError("Carta não encontrada ou privada.", 404);

  return { owner, card: toPublicCard(card) };
}
