import type { Metadata } from "next";
import { createCardAction } from "@/actions/cards";
import { CardForm } from "@/components/cards/card-form";
import { PageHeader } from "@/components/layout/page-header";
import { listSets } from "@/services/sets";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Nova carta",
};

export default async function NewCardPage() {
  const sets = await listSets();

  return (
    <div className="space-y-6">
      <PageHeader kicker="Cadastro" title="Nova carta" />
      <CardForm action={createCardAction} sets={sets} submitLabel="Adicionar à coleção" />
    </div>
  );
}
