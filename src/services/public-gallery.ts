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
};

export type PublicOwner = {
  id: string;
  username: string;
  displayName: string;
};

function toPublicCard(card: CardDTO): CardDTO {
  return { ...card, purchasePrice: null };
}

export async function listPublicCollectors(): Promise<PublicCollector[]> {
  const owners = await prisma.user.findMany({
    where: { active: true, collectionPublic: true },
    select: {
      username: true,
      displayName: true,
      _count: { select: { cards: true, sets: true } },
    },
    orderBy: { displayName: "asc" },
  });

  return owners
    .filter((owner) => owner._count.cards > 0)
    .map((owner) => ({
      username: owner.username,
      displayName: owner.displayName,
      cardCount: owner._count.cards,
      setCount: owner._count.sets,
    }));
}

export async function getPublicOwner(username: string): Promise<PublicOwner> {
  const user = await prisma.user.findUnique({
    where: { username: username.trim().toLowerCase() },
    select: { id: true, username: true, displayName: true, active: true, collectionPublic: true },
  });
  if (!user || !user.active || !user.collectionPublic) {
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
  const [sets, result] = await Promise.all([listSets(owner.id), listCards(owner.id, query)]);
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
  return { owner, card: toPublicCard(card) };
}
