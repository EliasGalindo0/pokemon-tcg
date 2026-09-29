import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CardFilters } from "@/components/cards/card-filters";
import { CardTile } from "@/components/cards/card-tile";
import { Pagination } from "@/components/cards/pagination";
import { PageHeader } from "@/components/layout/page-header";
import { TradeBoardView } from "@/components/trades/trade-board";
import { getSessionUser } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { parseCardQuery } from "@/lib/card-query";
import { listPublicCards, getPublicOwner } from "@/services/public-gallery";
import { listTradeStock, tradeBoardFromStock } from "@/services/trades";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ username: string }>;
  searchParams: Promise<{
    q?: string;
    setId?: string;
    rarity?: string;
    condition?: string;
    sort?: string;
    page?: string;
  }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  try {
    const owner = await getPublicOwner(username);
    return { title: `Coleção de ${owner.displayName}` };
  } catch {
    return { title: "Coleção" };
  }
}

export default async function PublicCollectorPage({ params, searchParams }: Props) {
  const { username } = await params;
  const raw = await searchParams;
  const query = parseCardQuery(raw);
  const basePath = `/galeria/${username}`;
  const viewer = await getSessionUser();

  let owner;
  let sets;
  let result;
  try {
    ({ owner, sets, result } = await listPublicCards(username, query));
  } catch (error) {
    if (error instanceof AppError && error.status === 404) notFound();
    throw error;
  }

  const stock = await listTradeStock(owner.id);
  const isOwn = viewer?.id === owner.id;
  const hasFilters = Boolean(
    query.q || query.setId || query.rarity || query.condition || (query.sort && query.sort !== "recent"),
  );
  const start = result.total === 0 ? 0 : (result.page - 1) * result.pageSize + 1;
  const end = Math.min(result.page * result.pageSize, result.total);
  const filterParams = {
    q: query.q,
    setId: query.setId,
    rarity: query.rarity,
    condition: query.condition,
    sort: query.sort && query.sort !== "recent" ? query.sort : undefined,
  };

  return (
    <div className="space-y-10">
      <div>
        <Link href="/galeria" className="text-sm text-navy hover:underline">
          Todas as coleções
        </Link>
      </div>
      <PageHeader
        kicker={`@${owner.username}`}
        title={owner.displayName}
        description={
          stock.length > 0
            ? "Cartas para troca deste colecionador, e a coleção pública que ele liberou."
            : result.total === 0
              ? "Coleção pública vazia"
              : `Mostrando ${start}–${end} de ${result.total} cartas públicas`
        }
      />

      {stock.length > 0 ? (
        <section className="space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl">Cartas para troca</h2>
              <p className="mt-1 max-w-xl text-sm text-muted">
                {isOwn
                  ? "Assim os outros colecionadores veem as suas repetidas."
                  : `Estas cartas pertencem a ${owner.displayName}. A solicitação de troca vai só para ele.`}
              </p>
            </div>
            <Link href={`/trocas/${owner.username}`} className="text-sm text-navy hover:underline">
              {isOwn ? "Gerenciar minhas trocas" : "Abrir coleção de troca"}
            </Link>
          </div>
          {stock.map((set) => (
            <div key={set.id} className="space-y-3">
              <h3 className="font-display text-xl tracking-tight">{set.name}</h3>
              <TradeBoardView
                board={tradeBoardFromStock(set)}
                readOnly
                stockOnly
                compact
                canOffer={!isOwn}
                viewerDisplayName={viewer?.displayName}
              />
            </div>
          ))}
        </section>
      ) : null}

      {sets.length > 0 || result.total > 0 || hasFilters ? (
        <section className="space-y-6">
          <h2 className="font-display text-2xl">Coleção pública</h2>
          <CardFilters
            sets={sets}
            action={basePath}
            clearHref={basePath}
            values={{
              q: query.q,
              setId: query.setId,
              rarity: query.rarity,
              condition: query.condition,
              sort: query.sort,
            }}
          />

          {result.items.length === 0 ? (
            <section className="rounded-3xl border border-dashed border-line bg-card/70 px-6 py-16 text-center">
              <h3 className="font-display text-3xl">{hasFilters ? "Nada encontrado" : "Sem cartas"}</h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted">
                {hasFilters
                  ? "Nenhuma carta combina com esses filtros."
                  : "Esta coleção pública ainda não tem cartas."}
              </p>
            </section>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {result.items.map((card) => (
                <CardTile key={card.id} card={card} href={`/galeria/${owner.username}/${card.id}`} />
              ))}
            </div>
          )}

          <Pagination
            page={result.page}
            pageCount={result.pageCount}
            params={filterParams}
            basePath={basePath}
          />
        </section>
      ) : null}
    </div>
  );
}
