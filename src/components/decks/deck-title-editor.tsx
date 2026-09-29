"use client";

import { useActionState } from "react";
import type { DeckActionState } from "@/actions/decks";
import { Button } from "@/components/ui/button";
import { DECK_FORMAT_LABEL, DECK_FORMATS, type DeckFormatValue } from "@/lib/labels";

const initial: DeckActionState = {};

export function DeckTitleEditor({
  action,
  name,
  format,
}: {
  action: (prev: DeckActionState, formData: FormData) => Promise<DeckActionState>;
  name: string;
  format: DeckFormatValue;
}) {
  const [state, formAction, pending] = useActionState(action, initial);

  return (
    <form action={formAction} className="space-y-3">
      <label className="block">
        <span className="sr-only">Formato</span>
        <select
          name="format"
          defaultValue={format}
          className="rounded-full border border-line bg-card px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-ember outline-none focus:border-navy focus:ring-2 focus:ring-navy/15"
        >
          {DECK_FORMATS.map((value) => (
            <option key={value} value={value}>
              {DECK_FORMAT_LABEL[value]}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="sr-only">Nome do deck</span>
        <input
          name="name"
          defaultValue={name}
          required
          className="w-full max-w-xl border-0 bg-transparent p-0 font-display text-4xl tracking-tight text-ink outline-none placeholder:text-muted focus:ring-0 sm:text-5xl"
          placeholder="Nome do deck"
        />
      </label>
      {state.fieldErrors?.name || state.message ? (
        <p className={`text-sm ${state.ok ? "text-navy" : "text-ember"}`} role="status">
          {state.fieldErrors?.name ?? state.message}
        </p>
      ) : null}
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? "Salvando…" : "Salvar nome"}
      </Button>
    </form>
  );
}
