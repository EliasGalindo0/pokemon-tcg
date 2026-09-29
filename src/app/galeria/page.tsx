import type { Metadata } from "next";
import { CollectorList } from "@/components/collectors/collector-list";
import { PageHeader } from "@/components/layout/page-header";
import { ButtonLink } from "@/components/ui/button";
import { getSessionUser } from "@/lib/auth";
import { listPublicCollectors } from "@/services/public-gallery";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Coleções",
};

function collectorMeta(collector: {
  cardCount: number;
  setCount: number;
  tradeUnitCount: number;
}) {
  const parts: string[] = [];
  if (collector.cardCount > 0) {
    parts.push(
      `${collector.cardCount} ${collector.cardCount === 1 ? "carta" : "cartas"}`,
    );
    if (collector.setCount > 0) {
      parts.push(`${collector.setCount} ${collector.setCount === 1 ? "coleção" : "coleções"}`);
    }
  }
  if (collector.tradeUnitCount > 0) {
    parts.push(
      `${collector.tradeUnitCount} ${collector.tradeUnitCount === 1 ? "carta para troca" : "cartas para troca"}`,
    );
  }
  return parts.join(" · ");
}

export default async function PublicCollectionsPage() {
  const user = await getSessionUser();
  const collectors = await listPublicCollectors(user?.id);

  return (
    <div className="space-y-8">
      <PageHeader
        kicker="Comunidade"
        title="Coleções públicas"
        description="Primeiro escolha o colecionador. Depois entre na coleção dele para ver as cartas públicas e o que ele tem para trocar."
      >
        {user ? (
          <ButtonLink href="/cards" variant="secondary">
            Minha coleção
          </ButtonLink>
        ) : (
          <ButtonLink href="/login?next=/conta" variant="secondary">
            Entrar
          </ButtonLink>
        )}
      </PageHeader>

      <CollectorList
        items={collectors.map((collector) => ({
          username: collector.username,
          displayName: collector.displayName,
          href: `/galeria/${collector.username}`,
          meta: collectorMeta(collector),
        }))}
        emptyTitle="Nenhuma coleção pública"
        emptyDescription="Quando alguém marcar um set como público em Conta ou disponibilizar cartas para troca, o colecionador aparece nesta lista."
      />
    </div>
  );
}
