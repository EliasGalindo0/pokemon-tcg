import type { Metadata } from "next";
import { createDeckAction } from "@/actions/decks";
import { DeckForm } from "@/components/decks/deck-form";
import { DeckImportForm } from "@/components/decks/deck-import-form";
import { PageHeader } from "@/components/layout/page-header";
import { requireAdminPage } from "@/lib/auth-page";

export const metadata: Metadata = {
  title: "Novo deck",
};

export default async function NewDeckPage() {
  await requireAdminPage("/decks/new");

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <PageHeader
        kicker="Jogo"
        title="Novo deck"
        description="Crie em branco ou importe uma decklist colada de sites como Limitless."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <DeckForm action={createDeckAction} submitLabel="Criar deck" layout="panel" />
        <DeckImportForm layout="panel" />
      </div>
    </div>
  );
}
