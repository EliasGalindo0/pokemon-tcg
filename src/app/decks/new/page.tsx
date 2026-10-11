import type { Metadata } from "next";
import Link from "next/link";
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
      <p className="text-sm text-muted">
        Já tem uma lista pronta?{" "}
        <Link href="/decks/import" className="text-navy hover:underline">
          Criar a partir de uma decklist
        </Link>
      </p>
      <DeckForm action={createDeckAction} submitLabel="Criar deck" />
    </div>
  );
}
