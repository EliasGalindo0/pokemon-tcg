"use client";

import { useActionState, useState } from "react";
import { addPlayerEventPrizeAction, deletePlayerEventPrizeAction, type ActionState } from "@/actions/events";
import { CatalogSearch } from "@/components/cards/catalog-search";
import { Button } from "@/components/ui/button";
import { Field, controlClass } from "@/components/ui/field";
import { LANGUAGE_LABEL, RARITY_LABEL, optionsFrom } from "@/lib/labels";
import type { CatalogHit } from "@/types/catalog";
import type { PlayerEventPrizeDTO } from "@/types/event";

const rarityOptions = optionsFrom(RARITY_LABEL);
const languageOptions = optionsFrom(LANGUAGE_LABEL);

export function EventPrizeBoard({
  eventId,
  language,
  prizes,
}: {
  eventId: string;
  language: string;
  prizes: PlayerEventPrizeDTO[];
}) {
  const bound = addPlayerEventPrizeAction.bind(null, eventId);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(bound, {});
  const [picked, setPicked] = useState<CatalogHit | null>(null);

  return (
    <div className="space-y-6">
      <CatalogSearch language={language} onPick={setPicked} />

      <form action={formAction} className="space-y-4 rounded-3xl border border-line bg-card p-5">
        <h2 className="font-display text-2xl tracking-tight">Carta ganha no evento</h2>
        {state.message ? (
          <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-ember" role="alert">
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
              key={picked?.id ?? "empty-name"}
              defaultValue={picked?.name ?? ""}
              className={controlClass}
            />
          </Field>
          <Field label="Número" name="cardNumber">
            <input
              id="cardNumber"
              name="cardNumber"
              key={picked?.id ?? "empty-number"}
              defaultValue={picked?.cardNumber ?? ""}
              placeholder="095/∞"
              className={controlClass}
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Coleção" name="setName">
            <input
              id="setName"
              name="setName"
              key={picked?.id ?? "empty-set"}
              defaultValue={picked?.setName ?? ""}
              className={controlClass}
            />
          </Field>
          <Field label="Colocação / prêmio" name="placement">
            <input
              id="placement"
              name="placement"
              placeholder="Ex.: 1º, Top 8, prêmio de participação"
              className={controlClass}
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Raridade" name="rarity" error={state.fieldErrors?.rarity}>
            <select
              id="rarity"
              name="rarity"
              key={picked?.id ?? "empty-rarity"}
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
              key={picked?.id ?? "empty-lang"}
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
          {pending ? "Adicionando…" : "Adicionar carta"}
        </Button>
      </form>

      {prizes.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-line bg-card/70 px-6 py-12 text-center text-sm text-muted">
          Nenhuma carta registrada neste evento ainda.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {prizes.map((prize) => (
            <li key={prize.id} className="space-y-2 rounded-2xl border border-line bg-card p-2">
              <div className="aspect-[63/88] overflow-hidden rounded-xl bg-navy/5">
                {prize.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={prize.imageUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="grid h-full place-items-center px-2 text-center text-xs text-muted">
                    {prize.name}
                  </span>
                )}
              </div>
              <div className="px-0.5">
                <p className="truncate text-sm font-medium" title={prize.name}>
                  {prize.name}
                </p>
                <p className="truncate text-xs text-muted">
                  {prize.cardNumber ?? "—"}
                  {prize.quantity > 1 ? ` · ×${prize.quantity}` : ""}
                </p>
                {prize.placement ? <p className="text-xs text-muted">{prize.placement}</p> : null}
              </div>
              <form action={deletePlayerEventPrizeAction.bind(null, eventId, prize.id)}>
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
