import { prisma } from "@/lib/prisma";
import { cacheGet, cacheSet, getCacheVersion } from "@/lib/redis";
import { fillMissingImages } from "@/services/catalog";
import { listDecks } from "@/services/decks";
import { countPendingTradeOffers } from "@/services/trade-offers";
import type { DashboardData, DashboardSetSummary } from "@/types/card";

function localNumber(value: string | null | undefined) {
  const head = String(value ?? "").split("/")[0]?.trim() ?? "";
  return head.replace(/^0+(?=\d)/, "") || head;
}

function officialFromNumber(value: string | null | undefined) {
  const match = String(value ?? "").match(/\/\s*(\d{1,4})\s*$/);
  if (!match) return 0;
  const n = Number(match[1]);
  return Number.isFinite(n) ? n : 0;
}

function summarizeSets(
  sets: {
    id: string;
    name: string;
    code: string | null;
    cards: { cardNumber: string | null; quantity: number; marketValue: { toString(): string } }[];
  }[],
): DashboardSetSummary[] {
  return sets
    .map((set) => {
      const unique = new Set<string>();
      let official = 0;
      let units = 0;
      let value = 0;

      for (const card of set.cards) {
        units += card.quantity;
        value += Number(card.marketValue.toString()) * card.quantity;
        const local = localNumber(card.cardNumber);
        if (local) unique.add(local);
        official = Math.max(official, officialFromNumber(card.cardNumber));
      }

      const uniqueCards = unique.size || set.cards.length;
      const completionPercent =
        official > 0 ? Math.min(100, Math.round((uniqueCards / official) * 100)) : null;

      return {
        id: set.id,
        name: set.name,
        code: set.code,
        cardCount: units,
        uniqueCards,
        officialEstimate: official > 0 ? official : null,
        completionPercent,
        estimatedValue: value.toFixed(2),
      };
    })
    .sort((a, b) => Number(b.estimatedValue) - Number(a.estimatedValue));
}

export async function getDashboard(userId: string): Promise<DashboardData> {
  await fillMissingImages(userId);
  const version = await getCacheVersion();
  const key = `v${version}:u:${userId}:dashboard:v6`;
  const cached = await cacheGet<DashboardData>(key);
  if (cached) return cached;

  const [totals, decks, pendingOffers, tradeSetCount, setRows, offerRows] = await Promise.all([
    prisma.$queryRaw<{ totalCards: number; estimatedValue: string }[]>`
      SELECT
        COALESCE(SUM("quantity"), 0)::int AS "totalCards",
        COALESCE(SUM("marketValue" * "quantity"), 0)::text AS "estimatedValue"
      FROM "Card"
      WHERE "userId" = ${userId}
    `,
    listDecks(userId),
    countPendingTradeOffers(userId),
    prisma.tradeSet.count({ where: { userId } }),
    prisma.set.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        code: true,
        cards: { select: { cardNumber: true, quantity: true, marketValue: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.tradeOffer.findMany({
      where: { userId, status: "PENDING" },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        wantedName: true,
        wantedNumber: true,
        offeredName: true,
        visitorName: true,
        createdAt: true,
      },
    }),
  ]);

  const row = totals[0];
  const sets = summarizeSets(setRows);
  const result: DashboardData = {
    totalCards: Number(row?.totalCards ?? 0),
    estimatedValue: String(row?.estimatedValue ?? "0"),
    setCount: sets.length,
    deckCount: decks.length,
    pendingOffers,
    tradeSetCount,
    decks: decks.slice(0, 5),
    sets,
    recentOffers: offerRows.map((offer) => ({
      id: offer.id,
      wantedName: offer.wantedName,
      wantedNumber: offer.wantedNumber,
      offeredName: offer.offeredName,
      visitorName: offer.visitorName,
      createdAt: offer.createdAt.toISOString(),
    })),
  };

  await cacheSet(key, result, 30);
  return result;
}
