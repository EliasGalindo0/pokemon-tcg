import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { ButtonLink } from "@/components/ui/button";
import { requireAdminPage } from "@/lib/auth-page";
import { DECK_FORMAT_LABEL, DECK_SIZE } from "@/lib/labels";
import { listDecks } from "@/services/decks";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Decks",
};

export default async function DecksPage() {
  const user = await requireAdminPage("/decks");
  const decks = await listDecks(user.id);

  return (
    <div className="space-y-8">
      <PageHeader
        kicker="Jogo"
        title="Decks"
        description="Monte os baralhos que você joga. As cartas do deck são independentes da coleção."
      >
        <ButtonLink href="/decks/new">Novo deck</ButtonLink>
      </PageHeader>

      {decks.length === 0 ? (
        <section className="rounded-3xl border border-dashed border-line bg-card/80 px-6 py-16 text-center">
          <h2 className="font-display text-3xl">Nenhum deck por aqui</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            Monte um baralho de {DECK_SIZE} cartas buscando no catálogo.
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
                  className="group relative flex min-h-[11rem] overflow-hidden rounded-3xl bg-navy text-paper shadow-[0_18px_40px_-28px_rgba(20,32,51,0.9)] transition hover:-translate-y-0.5"
                >
                  <span className="absolute inset-y-0 left-0 z-10 w-2 bg-ember" aria-hidden />
                  <div className="relative z-[1] flex min-w-0 flex-1 flex-col justify-between p-5 pl-7">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/60">
                        {DECK_FORMAT_LABEL[deck.format]}
                      </p>
                      <h2 className="mt-1 font-display text-3xl tracking-tight">{deck.name}</h2>
                      <p className="mt-3 text-sm text-white/75">
                        {deck.cardCount} {deck.cardCount === 1 ? "carta" : "cartas"}
                      </p>
                    </div>
                    <div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-white/15">
                        <div className="h-full rounded-full bg-ember" style={{ width: `${progress}%` }} />
                      </div>
                      <p className="mt-2 text-xs text-white/60">
                        {deck.cardCount}/{DECK_SIZE}
                      </p>
                    </div>
                  </div>
                  <div className="relative w-[38%] min-w-[7.5rem] shrink-0 self-stretch overflow-hidden bg-navy/80">
                    {deck.coverImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={deck.coverImageUrl}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover object-top transition duration-300 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <span className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
                    )}
                    <span className="absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-navy to-transparent" aria-hidden />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
