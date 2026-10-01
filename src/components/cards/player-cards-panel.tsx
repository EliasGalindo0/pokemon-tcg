"use client";

import { useActionState, useState } from "react";
import {
  addPlayerCardAction,
  deletePlayerCardAction,
  type ActionState,
} from "@/actions/player-cards";
import { CatalogSearch } from "@/components/cards/catalog-search";
import { Button } from "@/components/ui/button";
import { Field, controlClass } from "@/components/ui/field";
import { LANGUAGE_LABEL, RARITY_LABEL, optionsFrom } from "@/lib/labels";
import type { CatalogHit } from "@/types/catalog";
import type { PlayerCardDTO } from "@/types/player-card";

const rarityOptions = optionsFrom(RARITY_LABEL);
const languageOptions = optionsFrom(LANGUAGE_LABEL);

export function PlayerCardsPanel({
  cards,
  language,
}: {
  cards: PlayerCardDTO[];
  language: string;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(addPlayerCardAction, {});
  const [picked, setPicked] = useState<CatalogHit | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-3xl tracking-tight">Cartas de jogador</h2>
        <p className="mt-1 text-sm text-muted">
          Prêmios de ligas, campeonatos e eventos presenciais. Informe o evento em que ganhou cada carta.
        </p>
      </div>

      <CatalogSearch language={language} onPick={setPicked} />

      <form action={formAction} className="space-y-4 rounded-3xl border border-line bg-card p-5">
        <h3 className="font-display text-xl tracking-tight">Registrar carta</h3>
        {state.message ? (
          <p className="rounded-2xl border border-line bg-paper px-4 py-3 text-sm" role="status">
            {state.message}
          </p>
        ) : null}

        <input type="hidden" name="tcgId" value={picked?.id ?? ""} />
        <input type="hidden" name="imageUrl" value={picked?.imageUrl ?? picked?.thumbUrl ?? ""} />

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nome" name="name" error={state.fieldErrors?.name}>
            <input
              id="name"
              name="name"
              required
              key={picked?.id ?? "player-name"}
              defaultValue={picked?.name ?? ""}
              className={controlClass}
            />
          </Field>
          <Field label="Número" name="cardNumber">
            <input
              id="cardNumber"
              name="cardNumber"
              key={picked?.id ?? "player-number"}
              defaultValue={picked?.cardNumber ?? ""}
              className={controlClass}
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Coleção / série" name="setName">
            <input
              id="setName"
              name="setName"
              key={picked?.id ?? "player-set"}
              defaultValue={picked?.setName ?? ""}
              className={controlClass}
            />
          </Field>
          <Field label="Evento" name="eventName">
            <input
              id="eventName"
              name="eventName"
              placeholder="Ex.: Liga de Curitiba — etapa março"
              className={controlClass}
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Data do evento" name="eventDate">
            <input id="eventDate" name="eventDate" type="date" className={controlClass} />
          </Field>
          <Field label="Colocação / prêmio" name="placement">
            <input
              id="placement"
              name="placement"
              placeholder="Ex.: 1º, Top 8, participação"
              className={controlClass}
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Raridade" name="rarity" error={state.fieldErrors?.rarity}>
            <select
              id="rarity"
              name="rarity"
              key={picked?.id ?? "player-rarity"}
              defaultValue={picked?.rarity ?? "PROMO"}
              className={controlClass}
            >
              {rarityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Idioma" name="language" error={state.fieldErrors?.language}>
            <select
              id="language"
              name="language"
              key={picked?.id ?? "player-lang"}
              defaultValue={picked?.language ?? language}
              className={controlClass}
            >
              {languageOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
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

        <Field label="Notas" name="notes">
          <input id="notes" name="notes" className={controlClass} placeholder="Opcional" />
        </Field>

        <Button type="submit" disabled={pending}>
          {pending ? "Salvando…" : "Adicionar carta de jogador"}
        </Button>
      </form>

      {cards.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-line bg-card/70 px-6 py-12 text-center text-sm text-muted">
          Nenhuma carta de jogador registrada ainda.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {cards.map((card) => (
            <li key={card.id} className="space-y-2 rounded-2xl border border-line bg-card p-2">
              <div className="aspect-[63/88] overflow-hidden rounded-xl bg-navy/5">
                {card.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={card.imageUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="grid h-full place-items-center px-2 text-center text-xs text-muted">
                    {card.name}
                  </span>
                )}
              </div>
              <div className="px-0.5">
                <p className="truncate text-sm font-medium" title={card.name}>
                  {card.name}
                </p>
                <p className="truncate text-xs text-muted">
                  {card.cardNumber ?? "—"}
                  {card.quantity > 1 ? ` · ×${card.quantity}` : ""}
                </p>
                {card.eventName ? (
                  <p className="truncate text-xs text-muted" title={card.eventName}>
                    {card.eventName}
                  </p>
                ) : null}
                {card.placement ? <p className="text-xs text-muted">{card.placement}</p> : null}
              </div>
              <form action={deletePlayerCardAction.bind(null, card.id)}>
                <Button type="submit" variant="danger" className="w-full px-2 py-1.5 text-xs">
                  Remover
                </Button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
