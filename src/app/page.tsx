import type { Metadata } from "next";
import Link from "next/link";
import { StatCard } from "@/components/dashboard/stat-card";
import { PageHeader } from "@/components/layout/page-header";
import { ButtonLink } from "@/components/ui/button";
import { requireAdminPage } from "@/lib/auth-page";
import { formatDate, formatMoney } from "@/lib/format";
import { DECK_FORMAT_LABEL, DECK_SIZE } from "@/lib/labels";
import { getDashboard } from "@/services/dashboard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Painel",
};

function ProgressBar({ value }: { value: number }) {
  const width = Math.min(100, Math.max(0, value));
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-line">
      <div className="h-full rounded-full bg-ember" style={{ width: `${width}%` }} />
    </div>
  );
}

export default async function DashboardPage() {
  const user = await requireAdminPage("/");
  const dashboard = await getDashboard(user.id);
  const empty = dashboard.totalCards === 0 && dashboard.deckCount === 0 && dashboard.pendingOffers === 0;

  const setsWithProgress = dashboard.sets.filter((set) => set.completionPercent !== null);
  const avgCompletion =
    setsWithProgress.length > 0
      ? Math.round(
          setsWithProgress.reduce((sum, set) => sum + (set.completionPercent ?? 0), 0) /
            setsWithProgress.length,
        )
      : null;

  return (
    <div className="space-y-10">
      <PageHeader
        kicker="Coleção"
        title="Painel"
        description="Visão geral da coleção, trocas, decks e progresso por set."
      >
        <div className="flex flex-wrap gap-2">
          <ButtonLink href="/decks/new" variant="secondary">
            Novo deck
          </ButtonLink>
          <ButtonLink href="/cards/new">Cadastrar carta</ButtonLink>
        </div>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Cartas"
          value={String(dashboard.totalCards)}
          detail="Unidades na coleção"
        />
        <StatCard
          label="Valor estimado"
          value={formatMoney(dashboard.estimatedValue)}
          detail="Mercado × quantidade"
        />
        <StatCard
          label="Coleções"
          value={String(dashboard.setCount)}
          detail={
            avgCompletion !== null
              ? `Média ${avgCompletion}% completa`
              : "Sets na sua coleção"
          }
        />
        <StatCard label="Decks" value={String(dashboard.deckCount)} detail="Baralhos jogáveis" />
        <StatCard
          label="Ofertas pendentes"
          value={String(dashboard.pendingOffers)}
          detail="Solicitações de troca aguardando"
        />
        <StatCard
          label="Listas de troca"
          value={String(dashboard.tradeSetCount)}
          detail="Coleções publicadas em Trocas"
        />
      </div>

      {empty ? (
        <section className="rounded-3xl border border-dashed border-line bg-card/70 px-6 py-16 text-center">
          <h2 className="font-display text-3xl">Nada por aqui ainda</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            Cadastre cartas, monte decks ou publique listas de troca para ver o resumo completo.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/cards/new">Cadastrar carta</ButtonLink>
            <ButtonLink href="/trocas" variant="secondary">
              Abrir trocas
            </ButtonLink>
          </div>
        </section>
      ) : (
        <div className="space-y-10">
          <section className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="font-display text-2xl">Solicitações de troca</h2>
                <p className="mt-1 text-sm text-muted">
                  {dashboard.pendingOffers > 0
                    ? `${dashboard.pendingOffers} aguardando sua resposta.`
                    : "Nenhuma oferta pendente no momento."}
                </p>
              </div>
              <Link href="/ofertas" className="text-sm text-navy hover:underline">
                Ver ofertas
              </Link>
            </div>
            {dashboard.recentOffers.length > 0 ? (
              <ul className="divide-y divide-line border-y border-line">
                {dashboard.recentOffers.map((offer) => (
                  <li key={offer.id}>
                    <Link
                      href="/ofertas"
                      className="flex flex-wrap items-baseline justify-between gap-2 py-3 transition hover:text-ember"
                    >
                      <span className="min-w-0">
                        <span className="block font-medium">
                          Pedem {offer.wantedName}
                          {offer.wantedNumber ? ` (${offer.wantedNumber})` : ""}
                        </span>
                        <span className="text-sm text-muted">
                          Oferecem {offer.offeredName}
                          {offer.visitorName ? ` · ${offer.visitorName}` : ""}
                        </span>
                      </span>
                      <span className="shrink-0 text-xs text-muted">{formatDate(offer.createdAt)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>

          <section className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="font-display text-2xl">Coleções</h2>
                <p className="mt-1 text-sm text-muted">
                  Valor e progresso estimado (com base no número impresso das cartas).
                </p>
              </div>
              <Link href="/cards" className="text-sm text-navy hover:underline">
                Minha coleção
              </Link>
            </div>
            {dashboard.sets.length === 0 ? (
              <p className="text-sm text-muted">Nenhuma coleção cadastrada ainda.</p>
            ) : (
              <ul className="space-y-3">
                {dashboard.sets.map((set) => (
                  <li
                    key={set.id}
                    className="rounded-2xl border border-line bg-card px-4 py-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium">{set.name}</p>
                        <p className="text-sm text-muted">
                          {set.uniqueCards}
                          {set.officialEstimate ? `/${set.officialEstimate}` : ""} distintas
                          {set.cardCount !== set.uniqueCards ? ` · ${set.cardCount} un.` : ""}
                          {set.code ? ` · ${set.code}` : ""}
                        </p>
                      </div>
                      <p className="shrink-0 font-semibold">{formatMoney(set.estimatedValue)}</p>
                    </div>
                    {set.completionPercent !== null ? (
                      <div className="mt-3">
                        <div className="mb-1 flex justify-between text-xs text-muted">
                          <span>Completude</span>
                          <span>{set.completionPercent}%</span>
                        </div>
                        <ProgressBar value={set.completionPercent} />
                      </div>
                    ) : (
                      <p className="mt-2 text-xs text-muted">
                        Sem estimativa de total — cadastre cartas com número no formato 012/198.
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="font-display text-2xl">Decks</h2>
                <p className="mt-1 text-sm text-muted">Progresso dos baralhos montados.</p>
              </div>
              <Link href="/decks" className="text-sm text-navy hover:underline">
                Ver todos
              </Link>
            </div>
            {dashboard.decks.length === 0 ? (
              <p className="text-sm text-muted">
                Nenhum deck ainda.{" "}
                <Link href="/decks/new" className="text-navy hover:underline">
                  Criar o primeiro
                </Link>
              </p>
            ) : (
              <ul className="space-y-3">
                {dashboard.decks.map((deck) => {
                  const progress = Math.min(100, Math.round((deck.cardCount / DECK_SIZE) * 100));
                  return (
                    <li key={deck.id}>
                      <Link
                        href={`/decks/${deck.id}`}
                        className="flex items-center gap-4 rounded-2xl border border-line bg-card px-4 py-3 transition hover:border-navy/30"
                      >
                        <div className="relative h-14 w-10 shrink-0 overflow-hidden rounded-lg bg-navy">
                          {deck.coverImageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={deck.coverImageUrl} alt="" className="h-full w-full object-cover" />
                          ) : null}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-baseline gap-x-2">
                            <p className="truncate font-medium">{deck.name}</p>
                            <p className="text-xs uppercase tracking-wide text-muted">
                              {DECK_FORMAT_LABEL[deck.format]}
                            </p>
                          </div>
                          <div className="mt-2">
                            <ProgressBar value={progress} />
                          </div>
                          <p className="mt-1 text-xs text-muted">
                            {deck.cardCount}/{DECK_SIZE} cartas
                          </p>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
