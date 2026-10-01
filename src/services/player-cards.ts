import { AppError } from "@/lib/errors";
import { isOneOf, LANGUAGES, RARITIES } from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import type { PlayerCardDTO, PlayerCardPayload } from "@/types/player-card";

function parseEventDate(value: string | null | undefined) {
  if (!value?.trim()) return null;
  const date = new Date(`${value.trim()}T12:00:00`);
  if (Number.isNaN(date.getTime())) throw new AppError("Data do evento inválida.", 400);
  return date;
}

function toDto(row: {
  id: string;
  tcgId: string | null;
  name: string;
  setName: string | null;
  cardNumber: string | null;
  imageUrl: string | null;
  rarity: string;
  language: string;
  quantity: number;
  eventName: string | null;
  eventDate: Date | null;
  placement: string | null;
  notes: string | null;
}): PlayerCardDTO {
  return {
    id: row.id,
    tcgId: row.tcgId,
    name: row.name,
    setName: row.setName,
    cardNumber: row.cardNumber,
    imageUrl: row.imageUrl,
    rarity: row.rarity as PlayerCardDTO["rarity"],
    language: row.language as PlayerCardDTO["language"],
    quantity: row.quantity,
    eventName: row.eventName,
    eventDate: row.eventDate ? row.eventDate.toISOString().slice(0, 10) : null,
    placement: row.placement,
    notes: row.notes,
  };
}

export async function listPlayerCards(userId: string): Promise<PlayerCardDTO[]> {
  const rows = await prisma.playerCard.findMany({
    where: { userId },
    orderBy: [{ eventDate: "desc" }, { createdAt: "desc" }],
  });
  return rows.map(toDto);
}

export async function createPlayerCard(userId: string, payload: PlayerCardPayload) {
  const name = payload.name.trim();
  if (!name) throw new AppError("Informe o nome da carta.", 400);
  if (!isOneOf(RARITIES, payload.rarity)) throw new AppError("Raridade inválida.", 400);
  if (!isOneOf(LANGUAGES, payload.language)) throw new AppError("Idioma inválido.", 400);
  if (!Number.isInteger(payload.quantity) || payload.quantity < 1 || payload.quantity > 99) {
    throw new AppError("Quantidade inválida.", 400);
  }

  const row = await prisma.playerCard.create({
    data: {
      userId,
      tcgId: payload.tcgId?.trim() || null,
      name,
      setName: payload.setName?.trim() || null,
      cardNumber: payload.cardNumber?.trim() || null,
      imageUrl: payload.imageUrl?.trim() || null,
      rarity: payload.rarity,
      language: payload.language,
      quantity: payload.quantity,
      eventName: payload.eventName?.trim() || null,
      eventDate: parseEventDate(payload.eventDate),
      placement: payload.placement?.trim() || null,
      notes: payload.notes?.trim() || null,
    },
  });
  return toDto(row);
}

export async function deletePlayerCard(userId: string, id: string) {
  const existing = await prisma.playerCard.findFirst({ where: { id, userId } });
  if (!existing) throw new AppError("Carta de jogador não encontrada.", 404);
  await prisma.playerCard.delete({ where: { id } });
}
