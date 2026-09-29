import type { Metadata } from "next";
import Link from "next/link";
import { CardFilters } from "@/components/cards/card-filters";
import { CardTile } from "@/components/cards/card-tile";
import { Pagination } from "@/components/cards/pagination";
import { PageHeader } from "@/components/layout/page-header";
import { ButtonLink } from "@/components/ui/button";
import { requireUserPage } from "@/lib/auth-page";
import { parseCardQuery } from "@/lib/card-query";
import { isAdmin } from "@/lib/auth";
import { listCards } from "@/services/cards";
import { listSets } from "@/services/sets";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Minha galeria",
};

export default async function GalleryPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    setId?: string;
    rarity?: string;
    condition?: string;
    sort?: string;
    page?: string;
  }>;
}) {
  const user = await requireUserPage("/cards");
  const admin = await isAdmin();
  const raw = await searchParams;
  const query = parseCardQuery(raw);
  const [sets, result] = await Promise.all([listSets(user.id), listCards(user.id, query)]);
  const publicSets = sets.filter((set) => set.isPublic);
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
    <div className="space-y-6">
      <PageHeader
        kicker="Cartas"
        title="Minha galeria"
        description={
          result.total === 0
            ? "Nenhum item"
            : `Mostrando ${start}–${end} de ${result.total} itens · ${publicSets.length} ${
                publicSets.length === 1 ? "coleção pública" : "coleções públicas"
              }`
        }
      >
        <div className="flex flex-wrap gap-2">
          {admin ? (
            <ButtonLink href="/cards/new" variant="secondary">
              Nova carta
            </ButtonLink>
          ) : null}
          <ButtonLink href="/conta" variant="secondary">
            Privacidade
          </ButtonLink>
        </div>
      </PageHeader>

      <p className="text-sm text-muted">
        {publicSets.length > 0 ? (
          <>
            Visitantes veem {publicSets.length === 1 ? "a coleção" : "as coleções"}{" "}
            {publicSets.map((set) => set.name).join(", ")} em{" "}
            <Link href={`/galeria/${user.username}`} className="text-navy hover:underline">
              Galerias
            </Link>
            . Ajuste em{" "}
            <Link href="/conta" className="text-navy hover:underline">
              Conta
            </Link>
            .
          </>
        ) : (
          <>
            Todas as coleções estão privadas. Em{" "}
            <Link href="/conta" className="text-navy hover:underline">
              Conta
            </Link>{" "}
            você pode liberar sets individuais.
          </>
        )}
      </p>

      <CardFilters
        sets={sets}
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
          <h2 className="font-display text-3xl">{hasFilters ? "Nada encontrado" : "Nenhuma carta por aqui"}</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            {hasFilters
              ? "Nenhuma carta combina com esses filtros."
              : "Abra uma coleção no álbum e marque as cartas que você tem."}
          </p>
          {hasFilters || !admin ? null : (
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

      <Pagination page={result.page} pageCount={result.pageCount} params={filterParams} />
    </div>
  );
}
