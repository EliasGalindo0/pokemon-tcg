import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { TradeSetSearch } from "@/components/trades/trade-set-search";
import { TradeTabs } from "@/components/trades/trade-tabs";
import { ButtonLink } from "@/components/ui/button";
import { getSessionUser } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import {
  findTradeSetOwner,
  getTradeBoard,
  getTradeOwnerByUsername,
  listTradeSets,
  listTradeStock,
  tradeBoardFromStock,
} from "@/services/trades";
import type { TradeBoard, TradeSetSummary } from "@/types/trade";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

type Props = {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ tab?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const owner = await getTradeOwnerByUsername(username);
  return { title: owner ? `Trocas de ${owner.displayName}` : "Trocas" };
}

function summariesFromStock(stock: Awaited<ReturnType<typeof listTradeStock>>): TradeSetSummary[] {
  return stock.map((set) => ({
    id: set.id,
    tcgSetId: set.tcgSetId,
    name: set.name,
    logoUrl: set.logoUrl,
    language: set.language,
    official: set.official,
    entryCount: set.entries.length,
    unitCount: set.unitCount,
  }));
}

export default async function TrocaUserPage({ params, searchParams }: Props) {
  const { username: rawUsername } = await params;
  const { tab } = await searchParams;
  const viewer = await getSessionUser();

  const bySetId = await findTradeSetOwner(rawUsername);
  if (bySetId) {
    redirect(`/trocas/${bySetId.username}?tab=${encodeURIComponent(rawUsername)}`);
  }

  const owner = await getTradeOwnerByUsername(rawUsername);
  if (!owner) notFound();

  const isOwn = viewer?.id === owner.id;
  const basePath = `/trocas/${owner.username}`;

  let sets: TradeSetSummary[] = [];
  let board: TradeBoard | null = null;

  if (isOwn) {
    sets = await listTradeSets(owner.id);
    const activeId = tab && sets.some((set) => set.id === tab) ? tab : (sets[0]?.id ?? null);
    if (activeId) {
      try {
        board = await getTradeBoard(owner.id, activeId);
      } catch (error) {
        if (!(error instanceof AppError && error.status === 404)) throw error;
      }
    }

    return (
      <div className="space-y-8">
        <div>
          <Link href="/trocas" className="text-sm text-navy hover:underline">
            Todas as coleções de troca
          </Link>
        </div>
        <PageHeader
          kicker={`@${owner.username}`}
          title="Minhas cartas para troca"
          description="Cadastre uma coleção pelo número da carta e marque quantas cópias você tem para trocar. Pedidos de outros colecionadores chegam em Ofertas."
        >
          <div className="flex flex-wrap gap-2">
            <ButtonLink href="/ofertas" variant="secondary">
              Ofertas
            </ButtonLink>
            <ButtonLink href={`/galeria/${owner.username}`} variant="secondary">
              Ver como os outros veem
            </ButtonLink>
          </div>
        </PageHeader>

        <section className="rounded-3xl border border-line bg-card p-5">
          <h2 className="font-display text-2xl">Cadastrar coleção</h2>
          <div className="mt-4">
            <TradeSetSearch username={owner.username} />
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-2xl">Coleções</h2>
          <TradeTabs sets={sets} activeId={activeId} board={board} basePath={basePath} />
        </section>
      </div>
    );
  }

  const stock = await listTradeStock(owner.id);
  if (stock.length === 0) notFound();

  sets = summariesFromStock(stock);
  const activeId = tab && sets.some((set) => set.id === tab) ? tab : (sets[0]?.id ?? null);
  const activeStock = stock.find((set) => set.id === activeId) ?? stock[0];
  board = activeStock ? tradeBoardFromStock(activeStock) : null;

  return (
    <div className="space-y-8">
      <div>
        <Link href="/trocas" className="text-sm text-navy hover:underline">
          Todas as coleções de troca
        </Link>
      </div>
      <PageHeader
        kicker={`@${owner.username}`}
        title={`Trocas de ${owner.displayName}`}
        description="Estas cartas pertencem a este colecionador. A solicitação de troca vai só para ele."
      >
        <Link href={`/galeria/${owner.username}`} className="text-sm text-navy hover:underline">
          Ver coleção pública
        </Link>
      </PageHeader>

      <TradeTabs
        sets={sets}
        activeId={activeId}
        board={board}
        readOnly
        stockOnly
        canOffer
        viewerDisplayName={viewer?.displayName}
        basePath={basePath}
      />
    </div>
  );
}
