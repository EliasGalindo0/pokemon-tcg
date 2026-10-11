"use client";

import { useActionState } from "react";
import type { DeckActionState } from "@/actions/decks";
import { createDeckFromListAction } from "@/actions/decks";
import { Button } from "@/components/ui/button";
import { controlClass, Field } from "@/components/ui/field";
import { DECK_FORMAT_LABEL, DECK_FORMATS, type DeckFormatValue } from "@/lib/labels";

const initial: DeckActionState = {};

const EXAMPLE = `Pokémon: 17
4 Zorua do N JTG 97
4 Zoroark ex do N JTG 98

Treinador: 35
4 Determinação da Lílian MEG 119

Energia: 8
8 Energia de Escuridão Básica SVE 7`;

export function DeckImportForm({
  layout = "panel",
  defaultFormat = "STANDARD",
}: {
  layout?: "stack" | "panel";
  defaultFormat?: DeckFormatValue;
}) {
  const [state, formAction, pending] = useActionState(createDeckFromListAction, initial);
  const panel = layout === "panel";

  return (
    <form
      action={formAction}
      className={
        panel
          ? "flex h-full flex-col gap-4 rounded-3xl border border-line bg-card p-5"
          : "space-y-4 rounded-3xl border border-line bg-card p-5 shadow-[0_18px_40px_-32px_rgba(20,32,51,0.7)]"
      }
    >
      <div>
        <h2 className="font-display text-2xl">Importar decklist</h2>
        <p className="mt-1 text-sm text-muted">
          Cole uma lista com seções (Pokémon, Treinador, Energia) e cartas no formato{" "}
          <span className="font-mono text-xs">4 Nome SET 97</span> ou{" "}
          <span className="font-mono text-xs">4 Nome (SET-97)</span>.
        </p>
      </div>

      {state.message ? (
        <p className={`text-sm ${state.ok ? "text-navy" : "text-ember"}`} role="status">
          {state.message}
        </p>
      ) : null}

      <div className={panel ? "grid gap-4 sm:grid-cols-2" : "space-y-4"}>
        <Field label="Nome do deck" name="name" error={state.fieldErrors?.name}>
          <input id="deck-import-name" name="name" className={controlClass} placeholder="Zoroark do N" />
        </Field>
        <Field label="Formato" name="format" error={state.fieldErrors?.format}>
          <select id="deck-import-format" name="format" defaultValue={defaultFormat} className={controlClass}>
            {DECK_FORMATS.map((value) => (
              <option key={value} value={value}>
                {DECK_FORMAT_LABEL[value]}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Decklist" name="decklist" error={state.fieldErrors?.decklist}>
        <textarea
          id="deck-import-list"
          name="decklist"
          rows={14}
          className={`${controlClass} min-h-[12rem] resize-y font-mono text-sm leading-relaxed`}
          placeholder={EXAMPLE}
          spellCheck={false}
        />
      </Field>

      <div className={panel ? "mt-auto" : undefined}>
        <Button type="submit" disabled={pending} className={panel ? "w-full sm:w-auto" : undefined}>
          {pending ? "Importando…" : "Criar deck da lista"}
        </Button>
      </div>
    </form>
  );
}
