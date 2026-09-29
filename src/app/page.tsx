import type { Metadata } from "next";
import { CardTile } from "@/components/cards/card-tile";
import { StatCard } from "@/components/dashboard/stat-card";
import { PageHeader } from "@/components/layout/page-header";
import { ButtonLink } from "@/components/ui/button";
import { isAdmin } from "@/lib/auth";
import { formatMoney } from "@/lib/format";
import { getDashboard } from "@/services/dashboard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Painel",
};

export default async function DashboardPage() {
  const [dashboard, admin] = await Promise.all([getDashboard(), isAdmin()]);
  const empty = dashboard.totalCards === 0;

  return (
    <div className="space-y-10">
      <PageHeader
        kicker="Coleção"
        title="Painel"
        description="Quantidade, valor de mercado e os decks que você está montando."
      >
        {admin ? (
          <div className="flex flex-wrap gap-2">
            <ButtonLink href="/decks/new" variant="secondary">
              Novo deck
            </ButtonLink>
            <ButtonLink href="/cards/new">Cadastrar carta</ButtonLink>
          </div>
        ) : (
          <ButtonLink href="/trocas" variant="secondary">
            Ver trocas
          </ButtonLink>
        )}
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
            Cadastre a primeira carta para ver o valor da coleção e as raridades aqui.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/album">Abrir álbum</ButtonLink>
            {admin ? (
              <ButtonLink href="/cards/new" variant="secondary">
                Cadastrar carta
              </ButtonLink>
            ) : null}
          </div>
        </section>
      ) : (
        <div className="grid gap-10 lg:grid-cols-2">
          <section className="space-y-4">
            <h2 className="font-display text-2xl">Mais raras</h2>
            <div className="grid grid-cols-2 gap-4">
              {dashboard.rarest.map((card) => (
                <CardTile key={card.id} card={card} />
              ))}
            </div>
          </section>
          <section className="space-y-4">
            <h2 className="font-display text-2xl">Recém-cadastradas</h2>
            <div className="grid grid-cols-2 gap-4">
              {dashboard.recent.map((card) => (
                <CardTile key={card.id} card={card} />
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
