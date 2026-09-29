"use client";

import { useState, useTransition } from "react";
import { setSetPublicAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import type { SetDTO } from "@/types/card";

export function SetsVisibilityForm({ sets: initial }: { sets: SetDTO[] }) {
  const [sets, setSets] = useState(initial);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggle(setId: string, next: boolean) {
    setPendingId(setId);
    startTransition(async () => {
      const result = await setSetPublicAction(setId, next);
      if (result.ok) {
        setSets((current) =>
          current.map((set) => (set.id === setId ? { ...set, isPublic: next } : set)),
        );
        setMessage(result.message ?? null);
      } else {
        setMessage(result.message ?? "Não foi possível atualizar.");
      }
      setPendingId(null);
    });
  }

  if (sets.length === 0) {
    return (
      <section className="space-y-2 rounded-3xl border border-dashed border-line bg-card/70 p-5">
        <h2 className="font-display text-2xl">Privacidade das coleções</h2>
        <p className="text-sm text-muted">
          Cadastre cartas em uma coleção para poder torná-la pública ou privada.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-4 rounded-3xl border border-line bg-card p-5">
      <div>
        <h2 className="font-display text-2xl">Privacidade das coleções</h2>
        <p className="mt-1 text-sm text-muted">
          Cada set pode ser público ou privado. Só os públicos aparecem em Galerias (sem preço pago).
        </p>
      </div>
      <ul className="divide-y divide-line border-y border-line">
        {sets.map((set) => {
          const isPublic = Boolean(set.isPublic);
          const busy = pending && pendingId === set.id;
          return (
            <li key={set.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="font-medium">{set.name}</p>
                <p className="text-sm text-muted">
                  {set.cardCount ?? 0} {(set.cardCount ?? 0) === 1 ? "carta" : "cartas"}
                  {set.code ? ` · ${set.code}` : ""}
                  {" · "}
                  {isPublic ? "pública" : "privada"}
                </p>
              </div>
              <Button
                type="button"
                variant={isPublic ? "secondary" : "primary"}
                disabled={busy}
                onClick={() => toggle(set.id, !isPublic)}
              >
                {busy ? "Salvando…" : isPublic ? "Tornar privada" : "Tornar pública"}
              </Button>
            </li>
          );
        })}
      </ul>
      {message ? <p className="text-sm text-muted">{message}</p> : null}
    </section>
  );
}
