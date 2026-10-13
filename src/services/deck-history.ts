import { AsyncLocalStorage } from "node:async_hooks";
import { Prisma } from "@prisma/client";
import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { bumpCacheVersion } from "@/lib/redis";
import type { DeckRevisionView } from "@/types/deck";

const MAX_REVISIONS = 40;

const revisionScope = new AsyncLocalStorage<true>();

type SnapshotEntry = {
  cardId: string | null;
  tcgId: string | null;
  name: string;
  setName: string;
  cardNumber: string | null;
  imageUrl: string | null;
  quantity: number;
};

type DeckSnapshot = {
  entries: SnapshotEntry[];
  coverCardId: string | null;
  coverTcgId: string | null;
};

function entryKey(entry: {
  cardId?: string | null;
  tcgId?: string | null;
  name: string;
  cardNumber?: string | null;
}) {
  if (entry.cardId) return `c:${entry.cardId}`;
  if (entry.tcgId) return `t:${entry.tcgId}`;
  return `n:${entry.name}|${entry.cardNumber ?? ""}`;
}

function signature(entries: SnapshotEntry[]) {
  return entries
    .filter((entry) => entry.quantity > 0)
    .map((entry) => `${entryKey(entry)}:${entry.quantity}`)
    .sort()
    .join("\n");
}

function parseSnapshot(value: unknown): DeckSnapshot | null {
  if (!value || typeof value !== "object") return null;
  const entries = (value as { entries?: unknown }).entries;
  if (!Array.isArray(entries)) return null;
  const parsed: SnapshotEntry[] = [];
  for (const row of entries) {
    if (!row || typeof row !== "object") continue;
    const item = row as Partial<SnapshotEntry>;
    const quantity = Number(item.quantity);
    const name = typeof item.name === "string" ? item.name.trim() : "";
    if (!name || !Number.isFinite(quantity) || quantity <= 0) continue;
    parsed.push({
      cardId: typeof item.cardId === "string" ? item.cardId : null,
      tcgId: typeof item.tcgId === "string" ? item.tcgId : null,
      name,
      setName: typeof item.setName === "string" ? item.setName : "",
      cardNumber: typeof item.cardNumber === "string" ? item.cardNumber : null,
      imageUrl: typeof item.imageUrl === "string" ? item.imageUrl : null,
      quantity,
    });
  }
  const cover = value as { coverCardId?: unknown; coverTcgId?: unknown };
  return {
    entries: parsed,
    coverCardId: typeof cover.coverCardId === "string" ? cover.coverCardId : null,
    coverTcgId: typeof cover.coverTcgId === "string" ? cover.coverTcgId : null,
  };
}

async function loadSnapshot(deckId: string): Promise<DeckSnapshot | null> {
  const deck = await prisma.deck.findUnique({
    where: { id: deckId },
    select: {
      coverEntryId: true,
      entries: {
        include: { card: { include: { set: { select: { name: true } } } } },
      },
    },
  });
  if (!deck || deck.entries.length === 0) return null;

  const cover = deck.entries.find((entry) => entry.id === deck.coverEntryId);
  const entries: SnapshotEntry[] = deck.entries
    .filter((entry) => entry.quantity > 0)
    .map((entry) => ({
      cardId: entry.cardId,
      tcgId: entry.tcgId,
      name: (entry.card?.name ?? entry.name ?? "Carta").trim() || "Carta",
      setName: entry.card?.set.name ?? entry.setName ?? "",
      cardNumber: entry.card?.cardNumber ?? entry.cardNumber,
      imageUrl: entry.card?.imageUrl ?? entry.imageUrl,
      quantity: entry.quantity,
    }));
  if (entries.length === 0) return null;

  return {
    entries,
    coverCardId: cover?.cardId ?? null,
    coverTcgId: cover?.tcgId ?? null,
  };
}

function describeChanges(previous: SnapshotEntry[], current: SnapshotEntry[]) {
  const names = new Map<string, string>();
  const before = new Map<string, number>();
  const after = new Map<string, number>();
  for (const entry of previous) {
    const key = entryKey(entry);
    names.set(key, entry.name);
    before.set(key, (before.get(key) ?? 0) + entry.quantity);
  }
  for (const entry of current) {
    const key = entryKey(entry);
    names.set(key, names.get(key) ?? entry.name);
    after.set(key, (after.get(key) ?? 0) + entry.quantity);
  }

  const lines: string[] = [];
  for (const key of new Set([...before.keys(), ...after.keys()])) {
    const delta = (before.get(key) ?? 0) - (after.get(key) ?? 0);
    if (delta === 0) continue;
    const name = names.get(key) ?? "Carta";
    lines.push(delta > 0 ? `+${delta} ${name}` : `−${-delta} ${name}`);
  }
  lines.sort((a, b) => a.localeCompare(b, "pt"));
  return lines;
}

/** Remember the deck list before a change. Nested edits share one snapshot. */
export async function preservingHistory<T>(deckId: string, fn: () => Promise<T>): Promise<T> {
  if (revisionScope.getStore()) return fn();
  await saveDeckRevision(deckId);
  return revisionScope.run(true, fn);
}

/** Imports and restores apply many writes that should not each become a version. */
export async function withoutHistory<T>(fn: () => Promise<T>): Promise<T> {
  return revisionScope.run(true, fn);
}

export async function saveDeckRevision(deckId: string) {
  const snapshot = await loadSnapshot(deckId);
  if (!snapshot) return;

  const current = signature(snapshot.entries);
  const latest = await prisma.deckRevision.findFirst({
    where: { deckId },
    orderBy: { createdAt: "desc" },
    select: { snapshot: true },
  });
  const previous = latest ? parseSnapshot(latest.snapshot) : null;
  if (previous && signature(previous.entries) === current) return;

  const cardCount = snapshot.entries.reduce((sum, entry) => sum + entry.quantity, 0);
  await prisma.deckRevision.create({
    data: {
      deckId,
      cardCount,
      snapshot: snapshot as Prisma.InputJsonValue,
    },
  });

  const stale = await prisma.deckRevision.findMany({
    where: { deckId },
    orderBy: { createdAt: "desc" },
    skip: MAX_REVISIONS,
    select: { id: true },
  });
  if (stale.length > 0) {
    await prisma.deckRevision.deleteMany({ where: { id: { in: stale.map((row) => row.id) } } });
  }
}

export async function listDeckRevisions(userId: string, deckId: string): Promise<DeckRevisionView[]> {
  const deck = await prisma.deck.findFirst({ where: { id: deckId, userId }, select: { id: true } });
  if (!deck) return [];

  const [rows, current] = await Promise.all([
    prisma.deckRevision.findMany({
      where: { deckId },
      orderBy: { createdAt: "desc" },
      take: MAX_REVISIONS,
    }),
    loadSnapshot(deckId),
  ]);
  const currentEntries = current?.entries ?? [];
  const currentSignature = signature(currentEntries);

  return rows.flatMap((row) => {
    const snapshot = parseSnapshot(row.snapshot);
    if (!snapshot) return [];
    const allChanges = describeChanges(snapshot.entries, currentEntries);
    const changes = allChanges.slice(0, 6);
    if (allChanges.length > changes.length) {
      changes.push(`e mais ${allChanges.length - changes.length}`);
    }
    return [
      {
        id: row.id,
        createdAt: row.createdAt.toISOString(),
        cardCount: row.cardCount,
        changes,
        current: signature(snapshot.entries) === currentSignature,
      },
    ];
  });
}

export async function restoreDeckRevision(userId: string, deckId: string, revisionId: string) {
  const deck = await prisma.deck.findFirst({ where: { id: deckId, userId }, select: { id: true } });
  if (!deck) throw new AppError("Deck não encontrado.", 404);

  const revision = await prisma.deckRevision.findFirst({ where: { id: revisionId, deckId } });
  if (!revision) throw new AppError("Versão não encontrada.", 404);
  const snapshot = parseSnapshot(revision.snapshot);
  if (!snapshot || snapshot.entries.length === 0) throw new AppError("Essa versão não tem cartas para restaurar.", 400);

  const current = await loadSnapshot(deckId);
  if (current && signature(current.entries) === signature(snapshot.entries)) {
    throw new AppError("O deck já está nessa versão.", 400);
  }

  await saveDeckRevision(deckId);

  await revisionScope.run(true, async () => {
    await prisma.$transaction(async (tx) => {
      await tx.deck.update({ where: { id: deckId }, data: { coverEntryId: null } });
      await tx.deckEntry.deleteMany({ where: { deckId } });

      const created: Array<{ id: string; cardId: string | null; tcgId: string | null }> = [];
      for (const entry of snapshot.entries) {
        let cardId: string | null = null;
        if (entry.cardId) {
          const card = await tx.card.findFirst({ where: { id: entry.cardId, userId }, select: { id: true } });
          cardId = card?.id ?? null;
        }
        const row = await tx.deckEntry.create({
          data: {
            deckId,
            cardId,
            tcgId: entry.tcgId,
            quantity: entry.quantity,
            name: entry.name,
            setName: entry.setName || null,
            cardNumber: entry.cardNumber,
            imageUrl: entry.imageUrl,
          },
        });
        created.push({ id: row.id, cardId, tcgId: entry.tcgId });
      }

      const cover =
        created.find((entry) => snapshot.coverCardId && entry.cardId === snapshot.coverCardId) ??
        created.find((entry) => snapshot.coverTcgId && entry.tcgId === snapshot.coverTcgId);
      if (cover) {
        await tx.deck.update({ where: { id: deckId }, data: { coverEntryId: cover.id } });
      }
    });
  });

  await bumpCacheVersion();
}
