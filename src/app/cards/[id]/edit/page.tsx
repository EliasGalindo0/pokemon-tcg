import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { updateCardAction } from "@/actions/cards";
import { CardForm } from "@/components/cards/card-form";
import { getCard } from "@/services/cards";
import { listSets } from "@/services/sets";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Editar carta",
};

export default async function EditCardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [card, sets] = await Promise.all([getCard(id), listSets()]);
  if (!card) notFound();

  return (
    <div className="space-y-6">
      <Link href={`/cards/${card.id}`} className="text-sm text-muted underline-offset-4 hover:underline">
        Voltar para a carta
      </Link>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ember">Cadastro</p>
        <h1 className="mt-1 font-display text-4xl tracking-tight">Editar {card.name}</h1>
      </div>
      <CardForm
        action={updateCardAction.bind(null, card.id)}
        sets={sets}
        card={card}
        submitLabel="Salvar alterações"
      />
    </div>
  );
}
