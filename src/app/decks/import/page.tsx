import type { Metadata } from "next";
import Link from "next/link";
import { createDeckFromListAction } from "@/actions/decks";
import { DeckListImportForm } from "@/components/decks/deck-list-import-form";
import { PageHeader } from "@/components/layout/page-header";
import { requireAdminPage } from "@/lib/auth-page";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export const metadata: Metadata = {
  title: "Importar deck",
};

export default async function ImportDeckPage() {
  await requireAdminPage("/decks/import");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        kicker="Jogo"
        title="Importar lista"
        description="Cole uma decklist com quantidade, nome, coleção e número. As cartas entram no deck sem alterar a coleção."
      />
      <p className="text-sm text-muted">
        Prefere começar vazio?{" "}
        <Link href="/decks/new" className="text-navy hover:underline">
          Criar deck sem lista
        </Link>
      </p>
      <DeckListImportForm action={createDeckFromListAction} />
    </div>
  );
}
