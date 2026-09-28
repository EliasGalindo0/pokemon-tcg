import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { ButtonLink } from "@/components/ui/button";
import { DECK_FORMAT_LABEL, DECK_SIZE } from "@/lib/labels";
import { listDecks } from "@/services/decks";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Decks",
};

export default async function DecksPage() {
  const decks = await listDecks();

  return (
    <div className="space-y-8">
      <PageHeader
        kicker="Jogo"
        title="Decks"
        description="Cadastre os baralhos que você joga. Use cartas da coleção ou busque no catálogo uma carta que você ainda não tem."
      >
        <ButtonLink href="/decks/new">Novo deck</ButtonLink>
      </PageHeader>

      {decks.length === 0 ? (
        <section className="rounded-3xl border border-dashed border-line bg-card/80 px-6 py-16 text-center">
          <h2 className="font-display text-3xl">Nenhum deck por aqui</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            Monte um baralho de {DECK_SIZE} cartas. Dá para incluir cartas que ainda não estão na coleção.
          </p>
          <div className="mt-6">
            <ButtonLink href="/decks/new">Criar deck</ButtonLink>
          </div>
        </section>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {decks.map((deck) => {
            const progress = Math.min(100, Math.round((deck.cardCount / DECK_SIZE) * 100));
            return (
              <li key={deck.id}>
                <Link
                  href={`/decks/${deck.id}`}
                  className="relative block overflow-hidden rounded-3xl bg-navy p-5 pl-7 text-paper shadow-[0_18px_40px_-28px_rgba(20,32,51,0.9)] transition hover:-translate-y-0.5"
                >
                  <span className="absolute inset-y-0 left-0 w-2 bg-ember" aria-hidden />
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/60">
                    {DECK_FORMAT_LABEL[deck.format]}
                  </p>
                  <h2 className="mt-1 font-display text-3xl tracking-tight">{deck.name}</h2>
                  <p className="mt-3 text-sm text-white/75">
                    {deck.cardCount} {deck.cardCount === 1 ? "carta" : "cartas"}
                  </p>
                  <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/15">
                    <div className="h-full rounded-full bg-ember" style={{ width: `${progress}%` }} />
                  </div>
                  <p className="mt-2 text-xs text-white/60">
                    {deck.cardCount}/{DECK_SIZE}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
