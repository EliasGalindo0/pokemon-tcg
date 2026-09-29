import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createCardAction } from "@/actions/cards";
import { CardForm } from "@/components/cards/card-form";
import { PageHeader } from "@/components/layout/page-header";
import { getSessionUser } from "@/lib/auth";
import { listSets } from "@/services/sets";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Nova carta",
};

export default async function NewCardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/cards/new");
  const sets = await listSets(user.id);

  return (
    <div className="space-y-6">
      <PageHeader kicker="Cadastro" title="Nova carta" />
      <CardForm action={createCardAction} sets={sets} submitLabel="Adicionar à coleção" />
    </div>
  );
}
