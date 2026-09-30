import { AppError } from "@/lib/errors";
import { isOneOf, EVENT_KINDS, LANGUAGES, RARITIES, type EventKindValue } from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import type {
  PlayerEventDetail,
  PlayerEventPayload,
  PlayerEventPrizeDTO,
  PlayerEventPrizePayload,
  PlayerEventSummary,
} from "@/types/event";

function toPrize(row: {
  id: string;
  tcgId: string | null;
  name: string;
  setName: string | null;
  cardNumber: string | null;
  imageUrl: string | null;
  rarity: string;
  language: string;
  quantity: number;
  placement: string | null;
  notes: string | null;
}): PlayerEventPrizeDTO {
  return {
    id: row.id,
    tcgId: row.tcgId,
    name: row.name,
    setName: row.setName,
    cardNumber: row.cardNumber,
    imageUrl: row.imageUrl,
    rarity: row.rarity as PlayerEventPrizeDTO["rarity"],
    language: row.language as PlayerEventPrizeDTO["language"],
    quantity: row.quantity,
    placement: row.placement,
    notes: row.notes,
  };
}

function toSummary(row: {
  id: string;
  name: string;
  kind: string;
  location: string | null;
  heldAt: Date | null;
  notes: string | null;
  prizes: { quantity: number }[];
}): PlayerEventSummary {
  return {
    id: row.id,
    name: row.name,
    kind: row.kind as EventKindValue,
    location: row.location,
    heldAt: row.heldAt ? row.heldAt.toISOString().slice(0, 10) : null,
    notes: row.notes,
    prizeCount: row.prizes.length,
    unitCount: row.prizes.reduce((sum, prize) => sum + prize.quantity, 0),
  };
}

function parseHeldAt(value: string | null | undefined) {
  if (!value?.trim()) return null;
  const date = new Date(`${value.trim()}T12:00:00`);
  if (Number.isNaN(date.getTime())) throw new AppError("Data inválida.", 400);
  return date;
}

export async function listPlayerEvents(userId: string): Promise<PlayerEventSummary[]> {
  const rows = await prisma.playerEvent.findMany({
    where: { userId },
    orderBy: [{ heldAt: "desc" }, { updatedAt: "desc" }],
    include: { prizes: { select: { quantity: true } } },
  });
  return rows.map(toSummary);
}

export async function getPlayerEvent(userId: string, id: string): Promise<PlayerEventDetail> {
  const row = await prisma.playerEvent.findFirst({
    where: { id, userId },
    include: { prizes: { orderBy: { createdAt: "asc" } } },
  });
  if (!row) throw new AppError("Evento não encontrado.", 404);
  return {
    ...toSummary(row),
    prizes: row.prizes.map(toPrize),
  };
}

export async function createPlayerEvent(userId: string, payload: PlayerEventPayload) {
  const name = payload.name.trim();
  if (!name) throw new AppError("Informe o nome do evento.", 400);
  if (!isOneOf(EVENT_KINDS, payload.kind)) throw new AppError("Tipo de evento inválido.", 400);

  return prisma.playerEvent.create({
    data: {
      userId,
      name,
      kind: payload.kind,
      location: payload.location?.trim() || null,
      heldAt: parseHeldAt(payload.heldAt),
      notes: payload.notes?.trim() || null,
    },
  });
}

export async function updatePlayerEvent(userId: string, id: string, payload: PlayerEventPayload) {
  const existing = await prisma.playerEvent.findFirst({ where: { id, userId } });
  if (!existing) throw new AppError("Evento não encontrado.", 404);

  const name = payload.name.trim();
  if (!name) throw new AppError("Informe o nome do evento.", 400);
  if (!isOneOf(EVENT_KINDS, payload.kind)) throw new AppError("Tipo de evento inválido.", 400);

  return prisma.playerEvent.update({
    where: { id },
    data: {
      name,
      kind: payload.kind,
      location: payload.location?.trim() || null,
      heldAt: parseHeldAt(payload.heldAt),
      notes: payload.notes?.trim() || null,
    },
  });
}

export async function deletePlayerEvent(userId: string, id: string) {
  const existing = await prisma.playerEvent.findFirst({ where: { id, userId } });
  if (!existing) throw new AppError("Evento não encontrado.", 404);
  await prisma.playerEvent.delete({ where: { id } });
}

export async function addPlayerEventPrize(userId: string, eventId: string, payload: PlayerEventPrizePayload) {
  const event = await prisma.playerEvent.findFirst({ where: { id: eventId, userId } });
  if (!event) throw new AppError("Evento não encontrado.", 404);

  const name = payload.name.trim();
  if (!name) throw new AppError("Informe o nome da carta.", 400);
  if (!isOneOf(RARITIES, payload.rarity)) throw new AppError("Raridade inválida.", 400);
  if (!isOneOf(LANGUAGES, payload.language)) throw new AppError("Idioma inválido.", 400);
  if (!Number.isInteger(payload.quantity) || payload.quantity < 1 || payload.quantity > 99) {
    throw new AppError("Quantidade inválida.", 400);
  }

  const prize = await prisma.playerEventPrize.create({
    data: {
      eventId,
      tcgId: payload.tcgId?.trim() || null,
      name,
      setName: payload.setName?.trim() || null,
      cardNumber: payload.cardNumber?.trim() || null,
      imageUrl: payload.imageUrl?.trim() || null,
      rarity: payload.rarity,
      language: payload.language,
      quantity: payload.quantity,
      placement: payload.placement?.trim() || null,
      notes: payload.notes?.trim() || null,
    },
  });

  await prisma.playerEvent.update({ where: { id: eventId }, data: { updatedAt: new Date() } });
  return toPrize(prize);
}

export async function deletePlayerEventPrize(userId: string, prizeId: string) {
  const prize = await prisma.playerEventPrize.findFirst({
    where: { id: prizeId, event: { userId } },
  });
  if (!prize) throw new AppError("Carta do evento não encontrada.", 404);
  await prisma.playerEventPrize.delete({ where: { id: prizeId } });
  await prisma.playerEvent.update({ where: { id: prize.eventId }, data: { updatedAt: new Date() } });
}
