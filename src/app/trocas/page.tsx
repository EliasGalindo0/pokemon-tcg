import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CollectorList } from "@/components/collectors/collector-list";
import { PageHeader } from "@/components/layout/page-header";
import { ButtonLink } from "@/components/ui/button";
import { getSessionUser } from "@/lib/auth";
import { findTradeSetOwner, listPublicTraders } from "@/services/trades";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Trocas",
};

export default async function TrocasPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await getSessionUser();
  const { tab } = await searchParams;
  if (tab) {
    const owner = await findTradeSetOwner(tab);
    if (owner) redirect(`/trocas/${owner.username}?tab=${encodeURIComponent(tab)}`);
  }

  const traders = await listPublicTraders(user?.id);

  return (
    <div className="space-y-8">
      <PageHeader
        kicker="Comunidade"
        title="Trocas"
        description="Primeiro escolha o colecionador. Depois entre na coleção de troca dele para ver as cartas e solicitar só para aquele dono."
      >
        {user ? (
          <ButtonLink href={`/trocas/${user.username}`} variant="secondary">
            Minhas cartas para troca
          </ButtonLink>
        ) : (
          <ButtonLink href="/login?next=/trocas" variant="secondary">
            Entrar
          </ButtonLink>
        )}
      </PageHeader>

      <section className="space-y-4">
        <h2 className="font-display text-2xl">Colecionadores com cartas para troca</h2>
        <CollectorList
          items={traders.map((trader) => ({
            username: trader.username,
            displayName: trader.displayName,
            href: `/trocas/${trader.username}`,
            images: trader.sampleImages,
            meta: `${trader.unitCount} ${trader.unitCount === 1 ? "carta" : "cartas"} · ${trader.setCount} ${
              trader.setCount === 1 ? "coleção" : "coleções"
            }`,
          }))}
          emptyTitle="Nenhuma carta para troca"
          emptyDescription="Quando alguém marcar repetidas para troca, o colecionador aparece nesta lista."
        />
      </section>
    </div>
  );
}
