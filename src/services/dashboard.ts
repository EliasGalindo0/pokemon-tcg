import { prisma } from "@/lib/prisma";
import { cacheGet, cacheSet, getCacheVersion } from "@/lib/redis";
import { rarestCardIds, toCardDto } from "@/services/cards";
import { withSetLogos } from "@/services/set-logos";
import { countDecks } from "@/services/decks";
import { fillMissingImages } from "@/services/catalog";
import type { CardDTO, DashboardData } from "@/types/card";

export async function getDashboard(): Promise<DashboardData> {
  await fillMissingImages();
  const version = await getCacheVersion();
  const key = `v${version}:dashboard:v4`;
  const cached = await cacheGet<DashboardData>(key);
  if (cached) return cached;

  const [totals, setCount, deckCount, recentRows, rareIds] = await Promise.all([
    prisma.$queryRaw<{ totalCards: number; estimatedValue: string }[]>`
      SELECT
        COALESCE(SUM("quantity"), 0)::int AS "totalCards",
        COALESCE(SUM("marketValue" * "quantity"), 0)::text AS "estimatedValue"
      FROM "Card"
    `,
    prisma.set.count(),
    countDecks(),
    prisma.card.findMany({
      include: { set: true },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
    rarestCardIds(4),
  ]);

  const rareRows =
    rareIds.length === 0
      ? []
      : await prisma.card.findMany({
          where: { id: { in: rareIds } },
          include: { set: true },
        });
  const rareById = new Map(rareRows.map((card) => [card.id, toCardDto(card)]));

  const row = totals[0];
  const result: DashboardData = {
    totalCards: Number(row?.totalCards ?? 0),
    estimatedValue: String(row?.estimatedValue ?? "0"),
    setCount,
    deckCount,
    recent: await withSetLogos(recentRows.map(toCardDto)),
    rarest: await withSetLogos(rareIds.map((id) => rareById.get(id)).filter((card): card is CardDTO => Boolean(card))),
  };

  await cacheSet(key, result, 30);
  return result;
}
