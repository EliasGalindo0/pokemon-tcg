import type { Metadata } from "next";
import Link from "next/link";
import { StatCard } from "@/components/dashboard/stat-card";
import { PageHeader } from "@/components/layout/page-header";
import { ButtonLink } from "@/components/ui/button";
import { requireAdminPage } from "@/lib/auth-page";
import { formatMoney } from "@/lib/format";
import { DECK_FORMAT_LABEL, DECK_SIZE } from "@/lib/labels";
import { getDashboard } from "@/services/dashboard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Painel",
};

const shortcuts = [
  {
    href: "/album",
    title: "Álbum",
    detail: "Marcar o que falta em cada coleção",
  },
  {
    href: "/cards",
    title: "Galeria",
    detail: "Ver e editar as cartas cadastradas",
  },
  {
    href: "/decks",
    title: "Decks",
    detail: "Montar baralhos para jogar",
  },
] as const;

export default async function DashboardPage() {
  const user = await requireAdminPage("/");
  const dashboard = await getDashboard(user.id);
  const empty = dashboard.totalCards === 0;

  return (
    <div className="space-y-10">
      <PageHeader
        kicker="Coleção"
        title="Painel"
        description="Resumo da coleção e atalhos para o que você costuma fazer."
      >
        <div className="flex flex-wrap gap-2">
          <ButtonLink href="/decks/new" variant="secondary">
            Novo deck
          </ButtonLink>
          <ButtonLink href="/cards/new">Cadastrar carta</ButtonLink>
        </div>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Cartas"
          value={String(dashboard.totalCards)}
          detail="Unidades, somando a quantidade de cada lote"
        />
        <StatCard
          label="Valor estimado"
          value={formatMoney(dashboard.estimatedValue)}
          detail="Valor de mercado × quantidade"
        />
        <StatCard label="Coleções" value={String(dashboard.setCount)} detail="Coleções cadastradas" />
        <StatCard label="Decks" value={String(dashboard.deckCount)} detail="Baralhos jogáveis" />
      </div>

      {empty ? (
        <section className="rounded-3xl border border-dashed border-line bg-card/70 px-6 py-16 text-center">
          <h2 className="font-display text-3xl">Seu álbum ainda está vazio</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            Cadastre a primeira carta para acompanhar quantidade e valor aqui.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/album">Abrir álbum</ButtonLink>
            <ButtonLink href="/cards/new" variant="secondary">
              Cadastrar carta
            </ButtonLink>
          </div>
        </section>
      ) : (
        <div className="space-y-10">
          <section className="space-y-4">
            <div>
              <h2 className="font-display text-2xl">Para onde ir</h2>
              <p className="mt-1 text-sm text-muted">Os caminhos mais usados da coleção.</p>
            </div>
            <ul className="divide-y divide-line border-y border-line">
              {shortcuts.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="group flex items-baseline justify-between gap-4 py-4 transition hover:text-ember"
                  >
                    <span>
                      <span className="block font-display text-xl tracking-tight group-hover:text-ember">
                        {item.title}
                      </span>
                      <span className="text-sm text-muted">{item.detail}</span>
                    </span>
                    <span className="shrink-0 text-sm text-muted group-hover:text-ember" aria-hidden>
                      →
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          {dashboard.decks.length > 0 ? (
            <section className="space-y-4">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="font-display text-2xl">Decks em andamento</h2>
                  <p className="mt-1 text-sm text-muted">Progresso dos baralhos que você está montando.</p>
                </div>
                <Link href="/decks" className="text-sm text-navy hover:underline">
                  Ver todos
                </Link>
              </div>
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
                          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line">
                            <div className="h-full rounded-full bg-ember" style={{ width: `${progress}%` }} />
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
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}
