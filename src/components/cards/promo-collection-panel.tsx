"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { addPromoFromCatalogAction, type ActionState } from "@/actions/player-cards";
import { CatalogSearch } from "@/components/cards/catalog-search";
import { CardTile } from "@/components/cards/card-tile";
import { Button } from "@/components/ui/button";
import { Field, controlClass } from "@/components/ui/field";
import type { CardDTO } from "@/types/card";
import type { CatalogHit } from "@/types/catalog";

export function PromoCollectionPanel({
  cards,
  language,
  canAdd,
}: {
  cards: CardDTO[];
  language: string;
  canAdd: boolean;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(addPromoFromCatalogAction, {});
  const [picked, setPicked] = useState<CatalogHit | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-3xl tracking-tight">Promos</h2>
        <p className="mt-1 text-sm text-muted">
          Todas as cartas promocionais (MEP, Black Star, etc.) numa só aba. Busque com{" "}
          <span className="font-medium text-ink">086/∞</span> ou{" "}
          <span className="font-medium text-ink">Slowpoke 086/∞</span>.
        </p>
      </div>

      {canAdd ? (
        <>
          <CatalogSearch language={language} onPick={setPicked} />
          <form action={formAction} className="space-y-4 rounded-3xl border border-line bg-card p-5">
            <h3 className="font-display text-xl tracking-tight">Adicionar promo</h3>
            {state.message ? (
              <p className="rounded-2xl border border-line bg-paper px-4 py-3 text-sm" role="status">
                {state.message}
              </p>
            ) : null}
            <input type="hidden" name="imageUrl" value={picked?.imageUrl ?? picked?.thumbUrl ?? ""} />
            <input type="hidden" name="setCode" value={picked?.setCode ?? ""} />
            <input type="hidden" name="rarity" value={picked?.rarity ?? "PROMO"} />
            <input type="hidden" name="marketValue" value={picked?.marketValue ?? "0"} />
            <input type="hidden" name="language" value={picked?.language ?? language} />

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nome" name="name" error={state.fieldErrors?.name}>
                <input
                  id="name"
                  name="name"
                  required
                  key={picked?.id ?? "promo-name"}
                  defaultValue={picked?.name ?? ""}
                  className={controlClass}
                />
              </Field>
              <Field label="Número" name="cardNumber">
                <input
                  id="cardNumber"
                  name="cardNumber"
                  key={picked?.id ?? "promo-number"}
                  defaultValue={picked?.cardNumber ?? ""}
                  placeholder="095/∞"
                  className={controlClass}
                />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Coleção" name="setName" error={state.fieldErrors?.setName}>
                <input
                  id="setName"
                  name="setName"
                  required
                  key={picked?.id ?? "promo-set"}
                  defaultValue={picked?.setName ?? ""}
                  className={controlClass}
                />
              </Field>
              <Field label="Qtd." name="quantity" error={state.fieldErrors?.quantity}>
                <input
                  id="quantity"
                  name="quantity"
                  type="number"
                  min={1}
                  max={99}
                  defaultValue={1}
                  className={controlClass}
                />
              </Field>
            </div>
            <Button type="submit" disabled={pending}>
              {pending ? "Salvando…" : "Adicionar à coleção"}
            </Button>
          </form>
        </>
      ) : null}

      {cards.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-line bg-card/70 px-6 py-12 text-center text-sm text-muted">
          Nenhuma promo na coleção ainda.
          {!canAdd ? " Quando receber cartas promocionais, elas aparecem aqui." : null}
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {cards.map((card) => (
            <li key={card.id}>
              <CardTile card={card} />
            </li>
          ))}
        </ul>
      )}

      {cards.length > 0 ? (
        <p className="text-sm text-muted">
          Para editar quantidade ou valor, abra a carta.{" "}
          <Link href="/cards" className="text-navy hover:underline">
            Voltar às coleções
          </Link>
        </p>
      ) : null}
    </div>
  );
}
