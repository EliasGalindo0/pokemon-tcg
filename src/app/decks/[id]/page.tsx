import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteDeckAction, updateDeckAction } from "@/actions/decks";
import { DeckBuilder } from "@/components/decks/deck-builder";
import { DeckForm } from "@/components/decks/deck-form";
import { DeleteCardButton } from "@/components/cards/delete-card-button";
import { DECK_FORMAT_LABEL, DECK_SIZE } from "@/lib/labels";
import { getDeck } from "@/services/decks";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const deck = await getDeck(id);
  return { title: deck?.name ?? "Deck" };
}

export default async function DeckPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const deck = await getDeck(id);
  if (!deck) notFound();

  const progress = Math.min(100, Math.round((deck.cardCount / DECK_SIZE) * 100));
  const ready = deck.cardCount === DECK_SIZE;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link href="/decks" className="text-sm text-navy hover:underline">
            Todos os decks
          </Link>
          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-ember">
            {DECK_FORMAT_LABEL[deck.format]}
          </p>
          <h1 className="mt-1 font-display text-4xl tracking-tight sm:text-5xl">{deck.name}</h1>
          <p className="mt-2 text-sm text-muted">
            {deck.cardCount}/{DECK_SIZE} cartas{ready ? " · baralho completo" : ""}
          </p>
          <div className="mt-3 h-1.5 w-full max-w-sm overflow-hidden rounded-full bg-line">
            <div className="h-full rounded-full bg-ember" style={{ width: `${progress}%` }} />
          </div>
        </div>
        <DeleteCardButton action={deleteDeckAction.bind(null, deck.id)} label="Excluir deck" confirm="Excluir este deck?" />
      </div>

      <div className="grid gap-8 lg:grid-cols-[18rem_1fr]">
        <DeckForm
          action={updateDeckAction.bind(null, deck.id)}
          submitLabel="Salvar dados"
          name={deck.name}
          format={deck.format}
        />
        <DeckBuilder deckId={deck.id} entries={deck.entries} />
      </div>
    </div>
  );
}
