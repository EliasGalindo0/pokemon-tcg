import { AppError } from "@/lib/errors";
import { isOneOf, LANGUAGES, RARITIES, type LanguageValue, type RarityValue } from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import { bumpCacheVersion } from "@/lib/redis";
import { fetchCatalogCard, fetchTcg } from "@/services/catalog";
import { createCard } from "@/services/cards";
import { createTradeSet, setTradeQuantity, tradeLanguage } from "@/services/trades";
import type { TradeOfferDTO, TradeOfferPayload } from "@/types/trade-offer";

function localNumber(value: string | number | null | undefined) {
  const head = String(value ?? "").split("/")[0]?.trim() ?? "";
  return head.replace(/^0+(?=\d)/, "") || head;
}

function toDto(row: {
  id: string;
  status: TradeOfferDTO["status"];
  wantedTradeSetId: string;
  wantedTradeSet: { name: string };
  wantedTcgId: string;
  wantedName: string;
  wantedNumber: string | null;
  wantedImageUrl: string | null;
  offeredTcgId: string;
  offeredName: string;
  offeredSetName: string;
  offeredSetCode: string | null;
  offeredNumber: string | null;
  offeredImageUrl: string | null;
  offeredLanguage: string;
  offeredRarity: string;
  visitorName: string | null;
  visitorNote: string | null;
  createdAt: Date;
  resolvedAt: Date | null;
}): TradeOfferDTO {
  return {
    id: row.id,
    status: row.status,
    wantedTradeSetId: row.wantedTradeSetId,
    wantedTradeSetName: row.wantedTradeSet.name,
    wantedTcgId: row.wantedTcgId,
    wantedName: row.wantedName,
    wantedNumber: row.wantedNumber,
    wantedImageUrl: row.wantedImageUrl,
    offeredTcgId: row.offeredTcgId,
    offeredName: row.offeredName,
    offeredSetName: row.offeredSetName,
    offeredSetCode: row.offeredSetCode,
    offeredNumber: row.offeredNumber,
    offeredImageUrl: row.offeredImageUrl,
    offeredLanguage: row.offeredLanguage,
    offeredRarity: row.offeredRarity,
    visitorName: row.visitorName,
    visitorNote: row.visitorNote,
    createdAt: row.createdAt.toISOString(),
    resolvedAt: row.resolvedAt?.toISOString() ?? null,
  };
}

async function ownerHasCard(
  userId: string,
  language: LanguageValue,
  setName: string,
  setCode: string | null,
  cardNumber: string | null,
) {
  const localId = localNumber(cardNumber);
  if (!localId) return false;

  const localSet = await prisma.set.findFirst({
    where: {
      userId,
      OR: [
        { name: { equals: setName, mode: "insensitive" } },
        ...(setCode ? [{ code: { equals: setCode, mode: "insensitive" as const } }] : []),
      ],
    },
  });
  if (!localSet) return false;

  const cards = await prisma.card.findMany({
    where: { userId, setId: localSet.id, language },
    select: { cardNumber: true },
  });
  return cards.some((card) => localNumber(card.cardNumber) === localId);
}

export async function countPendingTradeOffers(userId: string) {
  return prisma.tradeOffer.count({ where: { userId, status: "PENDING" } });
}

export async function listTradeOffers(
  userId: string,
  status?: TradeOfferDTO["status"],
): Promise<TradeOfferDTO[]> {
  const rows = await prisma.tradeOffer.findMany({
    where: { userId, ...(status ? { status } : {}) },
    include: { wantedTradeSet: { select: { name: true } } },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 100,
  });
  return rows.map(toDto);
}

export async function createTradeOffer(
  input: TradeOfferPayload,
  fromUser?: { id: string; displayName: string } | null,
) {
  const language = tradeLanguage(input.offeredLanguage);
  const ownerUsername = input.ownerUsername.trim().toLowerCase();
  if (!ownerUsername) throw new AppError("Informe o dono da carta.", 400);

  const visitorName = input.visitorName?.trim() || fromUser?.displayName || null;
  const visitorNote = input.visitorNote?.trim() || null;
  if (visitorName && visitorName.length > 80) throw new AppError("Nome muito longo.", 400);
  if (visitorNote && visitorNote.length > 280) throw new AppError("Mensagem muito longa.", 400);

  const tradeSet = await prisma.tradeSet.findUnique({
    where: { id: input.wantedTradeSetId },
    include: { user: { select: { id: true, username: true, active: true } } },
  });
  if (!tradeSet || !tradeSet.user.active) {
    throw new AppError("Coleção de troca não encontrada.", 404);
  }
  if (tradeSet.user.username !== ownerUsername) {
    throw new AppError("Essa carta não pertence a este colecionador.", 409);
  }
  if (fromUser?.id === tradeSet.userId) {
    throw new AppError("Você não pode solicitar troca das suas próprias cartas.", 400);
  }

  const wanted = await prisma.tradeEntry.findUnique({
    where: {
      tradeSetId_tcgId: { tradeSetId: input.wantedTradeSetId, tcgId: input.wantedTcgId },
    },
  });
  if (!wanted || wanted.quantity < 1) {
    throw new AppError("Essa carta não está mais disponível para troca.", 409);
  }

  if (input.offeredTcgId === input.wantedTcgId) {
    throw new AppError("Escolha uma carta diferente da que você quer receber.", 400);
  }

  const offered = await fetchCatalogCard(language, input.offeredTcgId);
  if (!offered) throw new AppError("Carta oferecida não encontrada no catálogo.", 404);

  const rarity = isOneOf(RARITIES, offered.rarity) ? (offered.rarity as RarityValue) : "COMMON";

  const pendingDup = await prisma.tradeOffer.findFirst({
    where: {
      userId: tradeSet.userId,
      status: "PENDING",
      wantedTradeSetId: input.wantedTradeSetId,
      wantedTcgId: input.wantedTcgId,
      offeredTcgId: input.offeredTcgId,
      visitorName,
    },
  });
  if (pendingDup) throw new AppError("Você já tem uma oferta pendente igual a esta.", 409);

  const row = await prisma.tradeOffer.create({
    data: {
      userId: tradeSet.userId,
      wantedTradeSetId: input.wantedTradeSetId,
      wantedTcgId: wanted.tcgId,
      wantedName: wanted.name,
      wantedNumber: wanted.cardNumber,
      wantedImageUrl: wanted.imageUrl,
      offeredTcgId: offered.id,
      offeredName: offered.name,
      offeredSetName: offered.setName,
      offeredSetCode: offered.setCode || null,
      offeredNumber: offered.cardNumber,
      offeredImageUrl: offered.thumbUrl ?? offered.imageUrl,
      offeredLanguage: language,
      offeredRarity: rarity,
      visitorName,
      visitorNote,
    },
    include: { wantedTradeSet: { select: { name: true } } },
  });

  return toDto(row);
}

export async function rejectTradeOffer(userId: string, id: string) {
  const offer = await prisma.tradeOffer.findFirst({ where: { id, userId } });
  if (!offer) throw new AppError("Oferta não encontrada.", 404);
  if (offer.status !== "PENDING") throw new AppError("Esta oferta já foi resolvida.", 409);

  await prisma.tradeOffer.update({
    where: { id },
    data: { status: "REJECTED", resolvedAt: new Date() },
  });
}

export async function acceptTradeOffer(userId: string, id: string) {
  const offer = await prisma.tradeOffer.findFirst({
    where: { id, userId },
    include: { wantedTradeSet: true },
  });
  if (!offer) throw new AppError("Oferta não encontrada.", 404);
  if (offer.status !== "PENDING") throw new AppError("Esta oferta já foi resolvida.", 409);

  const entry = await prisma.tradeEntry.findUnique({
    where: {
      tradeSetId_tcgId: {
        tradeSetId: offer.wantedTradeSetId,
        tcgId: offer.wantedTcgId,
      },
    },
  });
  if (!entry || entry.quantity < 1) {
    throw new AppError("A carta pedida não está mais disponível para troca.", 409);
  }

  const language = isOneOf(LANGUAGES, offer.offeredLanguage)
    ? offer.offeredLanguage
    : ("PT_BR" as LanguageValue);

  const alreadyOwned = await ownerHasCard(
    userId,
    language,
    offer.offeredSetName,
    offer.offeredSetCode,
    offer.offeredNumber,
  );

  await setTradeQuantity(userId, offer.wantedTradeSetId, offer.wantedTcgId, entry.quantity - 1);

  if (alreadyOwned) {
    const raw = await fetchTcg<{ set?: { id?: string } }>(
      language,
      `cards/${encodeURIComponent(offer.offeredTcgId)}`,
    );
    const tcgSetId = raw?.set?.id || offer.offeredSetCode;
    if (!tcgSetId) throw new AppError("Não foi possível localizar a coleção da carta oferecida.", 400);

    const tradeSet = await createTradeSet(userId, tcgSetId, language);
    const current = await prisma.tradeEntry.findUnique({
      where: { tradeSetId_tcgId: { tradeSetId: tradeSet.id, tcgId: offer.offeredTcgId } },
    });
    await setTradeQuantity(userId, tradeSet.id, offer.offeredTcgId, (current?.quantity ?? 0) + 1);
  } else {
    const hit = await fetchCatalogCard(language, offer.offeredTcgId);
    const rarity: RarityValue = isOneOf(RARITIES, offer.offeredRarity)
      ? offer.offeredRarity
      : hit?.rarity ?? "COMMON";
    await createCard(userId, {
      name: hit?.name ?? offer.offeredName,
      newSetName: hit?.setName ?? offer.offeredSetName,
      newSetCode: hit?.setCode || offer.offeredSetCode || undefined,
      cardNumber: hit?.cardNumber ?? offer.offeredNumber ?? undefined,
      rarity: hit?.rarity ?? rarity,
      condition: "NEAR_MINT",
      language,
      marketValue: hit?.marketValue ? Number(hit.marketValue) : 0,
      purchasePrice: null,
      quantity: 1,
      imageUrl: hit?.imageUrl ?? offer.offeredImageUrl,
    });
  }

  await prisma.tradeOffer.update({
    where: { id },
    data: { status: "ACCEPTED", resolvedAt: new Date() },
  });

  await bumpCacheVersion();
}
