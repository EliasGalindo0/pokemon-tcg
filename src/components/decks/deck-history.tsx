"use client";

import { useState, useTransition } from "react";
import { restoreDeckRevisionAction } from "@/actions/decks";
import { Button } from "@/components/ui/button";
import type { DeckRevisionView } from "@/types/deck";

function formatWhen(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

export function DeckHistory({ deckId, revisions }: { deckId: string; revisions: DeckRevisionView[] }) {
  const [message, setMessage] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function restore(revisionId: string) {
    if (!window.confirm("Restaurar esta versão? A lista atual fica salva no histórico.")) return;
    setMessage(null);
    setPendingId(revisionId);
    startTransition(async () => {
      const result = await restoreDeckRevisionAction(deckId, revisionId);
      setPendingId(null);
      setMessage(result.message ?? (result.ok ? "Versão restaurada." : "Não foi possível restaurar."));
    });
  }

  return (
    <details className="group rounded-3xl border border-line bg-card p-5">
      <summary className="cursor-pointer list-none font-display text-2xl tracking-tight [&::-webkit-details-marker]:hidden">
        Histórico{revisions.length > 0 ? ` · ${revisions.length}` : ""}
      </summary>
      <div className="mt-3 space-y-3">
        <p className="text-sm text-muted">
          Cada edição da lista fica salva. Se um teste não der certo, dá para voltar a uma versão anterior. O + e o −
          comparam essa versão com a lista atual.
        </p>

        {message ? (
          <p className="text-sm text-navy" role="status">
            {message}
          </p>
        ) : null}

        {revisions.length === 0 ? (
          <p className="text-sm text-muted">Nenhuma versão anterior ainda. A próxima alteração do deck aparece aqui.</p>
        ) : (
          <ul className="space-y-3">
            {revisions.map((revision) => (
              <li key={revision.id} className="rounded-2xl border border-line bg-paper px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-ink">{formatWhen(revision.createdAt)}</p>
                    <p className="text-sm text-muted">{revision.cardCount} cartas</p>
                  </div>
                  {revision.current ? (
                    <span className="text-sm text-muted">Lista atual</span>
                  ) : (
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={pending}
                      onClick={() => restore(revision.id)}
                    >
                      {pending && pendingId === revision.id ? "Restaurando…" : "Restaurar"}
                    </Button>
                  )}
                </div>
                {revision.changes.length > 0 ? (
                  <ul className="mt-2 space-y-0.5 text-sm text-ink">
                    {revision.changes.map((change, index) => (
                      <li key={`${revision.id}-${index}`}>{change}</li>
                    ))}
                  </ul>
                ) : revision.current ? null : (
                  <p className="mt-2 text-sm text-muted">Mesma lista do deck atual.</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </details>
  );
}
