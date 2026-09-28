import type { Metadata } from "next";
import { CardFilters } from "@/components/cards/card-filters";
import { CardTile } from "@/components/cards/card-tile";
import { Pagination } from "@/components/cards/pagination";
import { PageHeader } from "@/components/layout/page-header";
import { ButtonLink } from "@/components/ui/button";
import { parseCardQuery } from "@/lib/card-query";
import { listCards } from "@/services/cards";
import { listSets } from "@/services/sets";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Galeria",
};

export default async function GalleryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; setId?: string; rarity?: string; condition?: string; page?: string }>;
}) {
  const raw = await searchParams;
  const query = parseCardQuery(raw);
  const [sets, result] = await Promise.all([listSets(), listCards(query)]);
  const hasFilters = Boolean(query.q || query.setId || query.rarity || query.condition);
  const start = result.total === 0 ? 0 : (result.page - 1) * result.pageSize + 1;
  const end = Math.min(result.page * result.pageSize, result.total);

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Cartas"
        title="Galeria"
        description={result.total === 0 ? "Nenhum item" : `Mostrando ${start}–${end} de ${result.total} itens`}
      >
        <ButtonLink href="/cards/new" variant="secondary">
          Nova carta
        </ButtonLink>
      </PageHeader>

      <CardFilters
        sets={sets}
        values={{ q: query.q, setId: query.setId, rarity: query.rarity, condition: query.condition }}
      />

      {result.items.length === 0 ? (
        <section className="rounded-3xl border border-dashed border-line bg-card/70 px-6 py-16 text-center">
          <h2 className="font-display text-3xl">{hasFilters ? "Nada encontrado" : "Nenhuma carta por aqui"}</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            {hasFilters
              ? "Nenhuma carta combina com esses filtros."
              : "Abra uma coleção no álbum e marque as cartas que você tem."}
          </p>
          {hasFilters ? null : (
            <div className="mt-6">
              <ButtonLink href="/album">Abrir álbum</ButtonLink>
            </div>
          )}
        </section>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {result.items.map((card) => (
            <CardTile key={card.id} card={card} />
          ))}
        </div>
      )}

      <Pagination
        page={result.page}
        pageCount={result.pageCount}
        params={{ q: query.q, setId: query.setId, rarity: query.rarity, condition: query.condition }}
      />
    </div>
  );
}
