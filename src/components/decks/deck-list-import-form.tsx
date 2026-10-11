"use client";

import { useActionState } from "react";
import type { DeckActionState } from "@/actions/decks";
import { Button } from "@/components/ui/button";
import { controlClass, Field } from "@/components/ui/field";
import { DECK_FORMAT_LABEL, DECK_FORMATS, type DeckFormatValue } from "@/lib/labels";

const initial: DeckActionState = {};

const PLACEHOLDER = `Pokémon: 17
4 Zorua do N JTG 97
4 Zoroark ex do N JTG 98
2 Munkidori TWM 95

Treinador: 35
4 Determinação da Lílian MEG 119
2 Ultra Bola SVI 196

Energia: 8
8 Energia de Escuridão Básica SVE 7

Total de Cartas: 60`;

export function DeckListImportForm({
  action,
  format = "STANDARD",
}: {
  action: (prev: DeckActionState, formData: FormData) => Promise<DeckActionState>;
  format?: DeckFormatValue;
}) {
  const [state, formAction, pending] = useActionState(action, initial);

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-3xl border border-line bg-card p-5 shadow-[0_18px_40px_-32px_rgba(20,32,51,0.7)]"
    >
      {state.message ? (
        <p className={`text-sm ${state.ok ? "text-navy" : "text-ember"}`} role="status">
          {state.message}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nome" name="name" error={state.fieldErrors?.name} hint="Opcional. Sem nome, usamos o Pokémon principal.">
          <input id="name" name="name" className={controlClass} placeholder="Zoroark ex do N" />
        </Field>
        <Field label="Formato" name="format" error={state.fieldErrors?.format}>
          <select id="format" name="format" defaultValue={format} className={controlClass}>
            {DECK_FORMATS.map((value) => (
              <option key={value} value={value}>
                {DECK_FORMAT_LABEL[value]}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field
        label="Lista do deck"
        name="list"
        error={state.fieldErrors?.list}
        hint="Cole o texto exportado do jogo, Limitless ou desta coleção. Linhas no formato 4 Zorua do N JTG 97."
      >
        <textarea
          id="list"
          name="list"
          required
          rows={16}
          className={`${controlClass} resize-y font-mono text-sm`}
          placeholder={PLACEHOLDER}
        />
      </Field>

      <Button type="submit" disabled={pending}>
        {pending ? "Importando cartas…" : "Criar deck da lista"}
      </Button>
    </form>
  );
}
