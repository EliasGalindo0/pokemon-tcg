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
  layout = "stack",
}: {
  action: (prev: DeckActionState, formData: FormData) => Promise<DeckActionState>;
  submitLabel: string;
  name?: string;
  format?: DeckFormatValue;
  layout?: "stack" | "panel";
}) {
  const [state, formAction, pending] = useActionState(action, initial);
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
      {panel ? (
        <div>
          <h2 className="font-display text-2xl">Dados do deck</h2>
          <p className="mt-1 text-sm text-muted">Nome e formato do baralho.</p>
        </div>
      ) : null}

      {state.message ? (
        <p className={`text-sm ${state.ok ? "text-navy" : "text-ember"}`} role="status">
          {state.message}
        </p>
      ) : null}

      <div className={panel ? "grid gap-4 sm:grid-cols-2" : "space-y-4"}>
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
      </div>

      <div className={panel ? "mt-auto" : undefined}>
        <Button type="submit" disabled={pending} className={panel ? "w-full sm:w-auto" : undefined}>
          {pending ? "Salvando…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
