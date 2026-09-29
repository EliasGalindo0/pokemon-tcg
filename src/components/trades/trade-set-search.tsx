"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createTradeSetAction, searchTradeSetsAction } from "@/actions/trades";
import { Button } from "@/components/ui/button";
import { controlClass } from "@/components/ui/field";
import { LANGUAGE_LABEL, LANGUAGES } from "@/lib/labels";
import type { TradeSetCandidate } from "@/types/trade";

export function TradeSetSearch({ defaultLanguage = "PT_BR" }: { defaultLanguage?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [language, setLanguage] = useState(defaultLanguage);
  const [items, setItems] = useState<TradeSetCandidate[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [creatingId, setCreatingId] = useState<string | null>(null);

  function search() {
    setMessage(null);
    startTransition(async () => {
      const result = await searchTradeSetsAction(query, language);
      if (!result.ok) {
        setItems([]);
        setMessage(result.message ?? "Não foi possível buscar a coleção.");
        return;
      }
      setItems(result.items);
      if (result.items.length === 0) {
        setMessage("Nenhuma coleção encontrada para esse número.");
      }
    });
  }

  function register(tcgSetId: string) {
    setMessage(null);
    setCreatingId(tcgSetId);
    startTransition(async () => {
      const result = await createTradeSetAction(tcgSetId, language);
      setCreatingId(null);
      if (!result.ok || !result.id) {
        setMessage(result.message ?? "Não foi possível cadastrar a coleção.");
        return;
      }
      router.push(`/trocas?tab=${result.id}`);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          search();
        }}
      >
        <label className="min-w-64 flex-1 text-sm">
          <span className="mb-1 block text-muted">Número da carta</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="001/094"
            className={controlClass}
            aria-label="Número da carta da coleção"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-muted">Idioma</span>
          <select value={language} onChange={(event) => setLanguage(event.target.value)} className={controlClass}>
            {LANGUAGES.map((item) => (
              <option key={item} value={item}>
                {LANGUAGE_LABEL[item]}
              </option>
            ))}
          </select>
        </label>
        <Button type="submit" variant="secondary" disabled={pending}>
          {pending && !creatingId ? "Buscando…" : "Buscar coleção"}
        </Button>
      </form>

      <p className="text-sm text-muted">
        Informe o número impresso, como <span className="font-medium text-ink">001/094</span>. O segundo valor
        identifica a coleção (ex.: Fogo Fantasmagórico).
      </p>

      {message ? (
        <p className="text-sm text-ember" role="alert">
          {message}
        </p>
      ) : null}

      {items.length > 0 ? (
        <ul className="grid gap-3 sm:grid-cols-2">
          {items.map((set) => {
            const busy = pending && creatingId === set.tcgSetId;
            return (
              <li key={set.tcgSetId}>
                <button
                  type="button"
                  onClick={() => register(set.tcgSetId)}
                  disabled={pending}
                  className="flex w-full items-center gap-4 rounded-3xl border border-line bg-card p-4 text-left transition hover:border-navy/30 disabled:opacity-60"
                >
                  {set.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={set.logoUrl} alt="" className="h-14 w-24 object-contain" />
                  ) : (
                    <span className="grid h-14 w-24 place-items-center rounded-2xl bg-paper text-xs text-muted">
                      {set.tcgSetId}
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">{set.name}</span>
                    <span className="text-sm text-muted">
                      {set.total} cartas · {set.sampleNumber}
                      {busy ? " · cadastrando…" : ""}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
