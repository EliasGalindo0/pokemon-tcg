import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CardBack } from "@/components/cards/card-back";
import { SetTag } from "@/components/cards/set-tag";
import { AppError } from "@/lib/errors";
import { formatMoney } from "@/lib/format";
import { CONDITION_LABEL, LANGUAGE_LABEL } from "@/lib/labels";
import { getPublicCard } from "@/services/public-gallery";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ username: string; cardId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username, cardId } = await params;
  try {
    const { card, owner } = await getPublicCard(username, cardId);
    return { title: `${card.name} · ${owner.displayName}` };
  } catch {
    return { title: "Carta" };
  }
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-line py-3">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-1 text-base">{value}</dd>
    </div>
  );
}

export default async function PublicCardPage({ params }: Props) {
  const { username, cardId } = await params;
  let owner;
  let card;
  try {
    ({ owner, card } = await getPublicCard(username, cardId));
  } catch (error) {
    if (error instanceof AppError && (error.status === 404 || error.status === 400)) notFound();
    throw error;
  }

  return (
    <div className="space-y-6">
      <Link
        href={`/galeria/${owner.username}`}
        className="text-sm text-muted underline-offset-4 hover:underline"
      >
        Voltar para a coleção de {owner.displayName}
      </Link>
      <div className="grid items-start gap-8 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="mx-auto w-full max-w-xs rounded-2xl border border-line bg-card shadow-[0_16px_40px_-28px_rgba(28,25,23,0.7)] lg:mx-0">
          <div className="relative">
            <div className="aspect-[5/7] overflow-hidden rounded-t-2xl bg-navy">
              {card.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={card.imageUrl} alt={card.name} className="h-full w-full object-cover" />
              ) : (
                <CardBack />
              )}
            </div>
            <span className="absolute -right-3 bottom-4 z-10">
              <SetTag name={card.set.name} logoUrl={card.set.logoUrl} />
            </span>
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ember">@{owner.username}</p>
          <h1 className="mt-2 font-display text-4xl tracking-tight sm:text-5xl">{card.name}</h1>
          <dl className="mt-6 max-w-xl">
            <Fact label="Número" value={card.cardNumber ?? "—"} />
            <Fact label="Condição" value={CONDITION_LABEL[card.condition]} />
            <Fact label="Idioma" value={LANGUAGE_LABEL[card.language]} />
            <Fact label="Quantidade" value={String(card.quantity)} />
            <Fact label="Valor de mercado" value={formatMoney(card.marketValue)} />
          </dl>
        </div>
      </div>
    </div>
  );
}
