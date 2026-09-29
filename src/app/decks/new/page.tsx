import type { Metadata } from "next";
import { createDeckAction } from "@/actions/decks";
import { DeckForm } from "@/components/decks/deck-form";
import { PageHeader } from "@/components/layout/page-header";
import { requireAdminPage } from "@/lib/auth-page";

export const metadata: Metadata = {
  title: "Novo deck",
};

export default async function NewDeckPage() {
  await requireAdminPage("/decks/new");

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <PageHeader
        kicker="Jogo"
        title="Novo deck"
        description="Dê um nome e escolha o formato. As cartas entram na página seguinte."
      />
      <DeckForm action={createDeckAction} submitLabel="Criar deck" />
    </div>
  );
}
