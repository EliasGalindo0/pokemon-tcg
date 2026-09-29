import { prisma } from "@/lib/prisma";
import { cacheGet, cacheSet, getCacheVersion } from "@/lib/redis";
import { fillMissingImages } from "@/services/catalog";
import { countDecks, listDecks } from "@/services/decks";
import type { DashboardData } from "@/types/card";

export async function getDashboard(userId: string): Promise<DashboardData> {
  await fillMissingImages(userId);
  const version = await getCacheVersion();
  const key = `v${version}:u:${userId}:dashboard:v5`;
  const cached = await cacheGet<DashboardData>(key);
  if (cached) return cached;

  const [totals, setCount, deckCount, decks] = await Promise.all([
    prisma.$queryRaw<{ totalCards: number; estimatedValue: string }[]>`
      SELECT
        COALESCE(SUM("quantity"), 0)::int AS "totalCards",
        COALESCE(SUM("marketValue" * "quantity"), 0)::text AS "estimatedValue"
      FROM "Card"
      WHERE "userId" = ${userId}
    `,
    prisma.set.count({ where: { userId } }),
    countDecks(userId),
    listDecks(userId),
  ]);

  const row = totals[0];
  const result: DashboardData = {
    totalCards: Number(row?.totalCards ?? 0),
    estimatedValue: String(row?.estimatedValue ?? "0"),
    setCount,
    deckCount,
    decks: decks.slice(0, 4),
  };

  await cacheSet(key, result, 30);
  return result;
}
