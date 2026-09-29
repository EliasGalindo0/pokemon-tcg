import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { ButtonLink } from "@/components/ui/button";
import { getSessionUser } from "@/lib/auth";
import { listPublicCollectors } from "@/services/public-gallery";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Galerias",
};

export default async function PublicGalleriesPage() {
  const [collectors, user] = await Promise.all([listPublicCollectors(), getSessionUser()]);

  return (
    <div className="space-y-8">
      <PageHeader
        kicker="Comunidade"
        title="Galerias públicas"
        description="Escolha um colecionador. Só aparecem coleções (sets) que o dono marcou como públicas."
      >
        {user ? (
          <ButtonLink href="/cards" variant="secondary">
            Minha galeria
          </ButtonLink>
        ) : (
          <ButtonLink href="/login?next=/conta" variant="secondary">
            Entrar
          </ButtonLink>
        )}
      </PageHeader>

      {collectors.length === 0 ? (
        <section className="rounded-3xl border border-dashed border-line bg-card/70 px-6 py-16 text-center">
          <h2 className="font-display text-3xl">Nenhuma coleção pública</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            Quando alguém marcar um set como público em Conta, ele aparece nesta lista.
          </p>
        </section>
      ) : (
        <ul className="divide-y divide-line border-y border-line">
          {collectors.map((collector) => (
            <li key={collector.username}>
              <Link
                href={`/galeria/${collector.username}`}
                className="group flex flex-wrap items-baseline justify-between gap-3 py-4 transition hover:text-ember"
              >
                <span>
                  <span className="block font-display text-2xl tracking-tight group-hover:text-ember">
                    {collector.displayName}
                  </span>
                  <span className="text-sm text-muted">@{collector.username}</span>
                </span>
                <span className="text-sm text-muted">
                  {collector.cardCount} {collector.cardCount === 1 ? "carta" : "cartas"}
                  {collector.setCount > 0
                    ? ` · ${collector.setCount} ${collector.setCount === 1 ? "coleção" : "coleções"}`
                    : ""}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
