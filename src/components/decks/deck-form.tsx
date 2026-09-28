"use client";

import { useActionState } from "react";
import type { DeckActionState } from "@/actions/decks";
import { Button } from "@/components/ui/button";
import { controlClass, Field } from "@/components/ui/field";
import { DECK_FORMAT_LABEL, DECK_FORMATS, type DeckFormatValue } from "@/lib/labels";

const initial: DeckActionState = {};

export function DeckForm({
  action,
  submitLabel,
  name = "",
  format = "STANDARD",
}: {
  action: (prev: DeckActionState, formData: FormData) => Promise<DeckActionState>;
  submitLabel: string;
  name?: string;
  format?: DeckFormatValue;
}) {
  const [state, formAction, pending] = useActionState(action, initial);

  return (
    <form action={formAction} className="space-y-4 rounded-3xl border border-line bg-card p-5 shadow-[0_18px_40px_-32px_rgba(20,32,51,0.7)]">
      {state.message ? (
        <p className={`text-sm ${state.ok ? "text-navy" : "text-ember"}`} role="status">
          {state.message}
        </p>
      ) : null}
      <Field label="Nome" name="name" error={state.fieldErrors?.name}>
        <input id="name" name="name" defaultValue={name} className={controlClass} placeholder="Charizard ex" />
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
      <Button type="submit" disabled={pending}>
        {pending ? "Salvando…" : submitLabel}
      </Button>
    </form>
  );
}
