import Link from "next/link";
import { CardBack } from "@/components/cards/card-back";
import { SetTag } from "@/components/cards/set-tag";
import { formatMoney } from "@/lib/format";
import { CONDITION_LABEL } from "@/lib/labels";
import type { CardDTO } from "@/types/card";

export function CardTile({ card, href }: { card: CardDTO; href?: string }) {
  const setLine = card.cardNumber ?? card.set.name;
  const link = href ?? `/cards/${card.id}`;

  return (
    <article className="rounded-2xl border border-line bg-card shadow-[0_16px_40px_-28px_rgba(28,25,23,0.7)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-24px_rgba(28,25,23,0.55)]">
      <Link href={link} className="block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy">
        <div className="relative">
          <div className="aspect-[5/7] overflow-hidden rounded-t-2xl bg-navy">
            {card.imageUrl ? (
              // URLs vêm do usuário (qualquer host ou arquivo local).
              // eslint-disable-next-line @next/next/no-img-element
              <img src={card.imageUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <CardBack />
            )}
          </div>
          <span className="absolute -right-3 bottom-3 z-10">
            <SetTag name={card.set.name} logoUrl={card.set.logoUrl} />
          </span>
        </div>
        <div className="space-y-1 p-3">
          <h3 className="font-display text-lg leading-tight tracking-tight">{card.name}</h3>
          <p className="line-clamp-2 text-sm text-muted">{setLine}</p>
          <p className="text-xs text-muted">{CONDITION_LABEL[card.condition]}</p>
          <div className="flex items-end justify-between pt-2">
            <span className="text-sm font-semibold">{formatMoney(card.marketValue)}</span>
            <span className="text-xs text-muted">{card.quantity} un.</span>
          </div>
        </div>
      </Link>
    </article>
  );
}
