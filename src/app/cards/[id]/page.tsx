import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteCardAction } from "@/actions/cards";
import { CardBack } from "@/components/cards/card-back";
import { SetTag } from "@/components/cards/set-tag";
import { DeleteCardButton } from "@/components/cards/delete-card-button";
import { ButtonLink } from "@/components/ui/button";
import { getSessionUser, isAdmin } from "@/lib/auth";
import { formatDate, formatMoney, formatMoneyOrDash, lotValue } from "@/lib/format";
import { CONDITION_LABEL, LANGUAGE_LABEL } from "@/lib/labels";
import { getCard } from "@/services/cards";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const user = await getSessionUser();
  const card = user ? await getCard(user.id, id) : null;
  return { title: card?.name ?? "Carta" };
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-line py-3">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-1 text-base">{value}</dd>
    </div>
  );
}

export default async function CardDetailPage({ params }: Props) {
  const { id } = await params;
  const user = await getSessionUser();
  const [card, admin] = await Promise.all([
    user ? getCard(user.id, id) : null,
    isAdmin(),
  ]);
  if (!card) notFound();

  return (
    <div className="space-y-6">
      <Link href="/cards" className="text-sm text-muted underline-offset-4 hover:underline">
        Voltar para a galeria
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
          <h1 className="font-display text-4xl tracking-tight sm:text-5xl">{card.name}</h1>
          <dl className="mt-6 max-w-xl">
            <Fact label="Número" value={card.cardNumber ?? "—"} />
            <Fact label="Condição" value={CONDITION_LABEL[card.condition]} />
            <Fact label="Idioma" value={LANGUAGE_LABEL[card.language]} />
            <Fact label="Quantidade" value={String(card.quantity)} />
            <Fact label="Valor de mercado" value={formatMoney(card.marketValue)} />
            <Fact label="Preço pago" value={formatMoneyOrDash(card.purchasePrice)} />
            <Fact label="Valor do lote" value={lotValue(card.marketValue, card.quantity)} />
            <Fact label="Cadastrada em" value={formatDate(card.createdAt)} />
          </dl>
          {admin ? (
            <div className="mt-6 flex flex-wrap gap-3">
              <ButtonLink href={`/cards/${card.id}/edit`} variant="secondary">
                Editar
              </ButtonLink>
              <DeleteCardButton action={deleteCardAction.bind(null, card.id)} />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
