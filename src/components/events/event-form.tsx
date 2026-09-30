"use client";

import { useActionState } from "react";
import {
  createPlayerEventAction,
  updatePlayerEventAction,
  type ActionState,
} from "@/actions/events";
import { Button } from "@/components/ui/button";
import { Field, controlClass } from "@/components/ui/field";
import { EVENT_KIND_LABEL, optionsFrom } from "@/lib/labels";
import type { PlayerEventDetail } from "@/types/event";

const kindOptions = optionsFrom(EVENT_KIND_LABEL);

export function EventForm({ event }: { event?: PlayerEventDetail }) {
  const action = event ? updatePlayerEventAction.bind(null, event.id) : createPlayerEventAction;
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, {});

  return (
    <form action={formAction} className="space-y-4 rounded-3xl border border-line bg-card p-5">
      {state.message ? (
        <p className="rounded-2xl border border-line bg-paper px-4 py-3 text-sm" role="status">
          {state.message}
        </p>
      ) : null}

      <Field label="Nome do evento" name="name" error={state.fieldErrors?.name}>
        <input
          id="name"
          name="name"
          required
          defaultValue={event?.name ?? ""}
          placeholder="Ex.: Liga de Curitiba — etapa março"
          className={controlClass}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Tipo" name="kind" error={state.fieldErrors?.kind}>
          <select id="kind" name="kind" defaultValue={event?.kind ?? "LEAGUE"} className={controlClass}>
            {kindOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Data" name="heldAt">
          <input
            id="heldAt"
            name="heldAt"
            type="date"
            defaultValue={event?.heldAt ?? ""}
            className={controlClass}
          />
        </Field>
      </div>

      <Field label="Local" name="location">
        <input
          id="location"
          name="location"
          defaultValue={event?.location ?? ""}
          placeholder="Cidade, loja ou arena"
          className={controlClass}
        />
      </Field>

      <Field label="Notas" name="notes">
        <textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={event?.notes ?? ""}
          placeholder="Colocação, formato, observações…"
          className={controlClass}
        />
      </Field>

      <Button type="submit" disabled={pending}>
        {pending ? "Salvando…" : event ? "Salvar evento" : "Criar evento"}
      </Button>
    </form>
  );
}
