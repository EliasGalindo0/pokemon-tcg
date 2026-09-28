"use client";

import { useEffect, useState, useTransition } from "react";
import { addCatalogCardAction, setDeckCardAction, setDeckCatalogAction } from "@/actions/decks";
import { Button } from "@/components/ui/button";
import { controlClass } from "@/components/ui/field";
import type { CardDTO, CardListResult } from "@/types/card";
import type { CatalogHit, CatalogSearchResult } from "@/types/catalog";
import type { DeckEntryDTO } from "@/types/deck";

function isNumberQuery(value: string) {
  return /^(?:#)?\d{1,4}(?:\s*\/\s*\d{1,4})?$/.test(value);
}

export function DeckBuilder({ deckId, entries }: { deckId: string; entries: DeckEntryDTO[] }) {
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<CardDTO[]>([]);
  const [catalogQuery, setCatalogQuery] = useState("");
  const [catalogHits, setCatalogHits] = useState<CatalogHit[]>([]);
  const [catalogStatus, setCatalogStatus] = useState<"idle" | "loading" | "empty" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const name = query.trim();
    if (name.length < 2) {
      setHits([]);
      return;
    }
    const handle = window.setTimeout(() => {
      void fetch(`/api/cards?q=${encodeURIComponent(name)}`)
        .then((response) => response.json())
        .then((data: CardListResult) => setHits(data.items ?? []))
        .catch(() => setHits([]));
    }, 300);
    return () => window.clearTimeout(handle);
  }, [query]);

  useEffect(() => {
    const name = catalogQuery.trim();
    if (!isNumberQuery(name) && name.length < 2) {
      setCatalogHits([]);
      setCatalogStatus("idle");
      return;
    }
    const controller = new AbortController();
    const handle = window.setTimeout(() => {
      setCatalogStatus("loading");
      void fetch(`/api/catalog?q=${encodeURIComponent(name)}&language=PT_BR`, { signal: controller.signal })
        .then((response) => {
          if (!response.ok) throw new Error("catalog");
          return response.json() as Promise<CatalogSearchResult>;
        })
        .then((data) => {
          setCatalogHits(data.items ?? []);
          setCatalogStatus((data.items ?? []).length === 0 ? "empty" : "idle");
        })
        .catch((error: unknown) => {
          if (error instanceof DOMException && error.name === "AbortError") return;
          setCatalogHits([]);
          setCatalogStatus("error");
        });
    }, 300);
    return () => {
      controller.abort();
      window.clearTimeout(handle);
    };
  }, [catalogQuery]);

  function run(key: string, task: () => Promise<{ ok: boolean; message?: string }>) {
    setMessage(null);
    setPendingId(key);
    startTransition(async () => {
      const result = await task();
      setPendingId(null);
      if (!result.ok) setMessage(result.message ?? "Não foi possível atualizar o deck.");
    });
  }

  const inDeck = new Map<string, number>();
  for (const entry of entries) {
    if (entry.cardId) inDeck.set(entry.cardId, entry.quantity);
    if (entry.tcgId) inDeck.set(entry.tcgId, entry.quantity);
  }

  const catalogVisible = isNumberQuery(catalogQuery.trim()) || catalogQuery.trim().length >= 2;

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-line bg-card p-5">
        <h2 className="font-display text-2xl">Adicionar da coleção</h2>
        <p className="mt-1 text-sm text-muted">
          Busque pelo nome. Dá para colocar mais cópias do que você tem cadastradas.
        </p>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Nome da carta"
          className={`${controlClass} mt-4`}
          aria-label="Buscar carta da coleção"
        />
        {hits.length > 0 ? (
          <ul className="mt-4 divide-y divide-line">
            {hits.map((card) => {
              const current = inDeck.get(card.id) ?? 0;
              const busy = pending && pendingId === card.id;
              return (
                <li key={card.id} className="flex items-center gap-3 py-3">
                  {card.imageUrl ? (
                    <img src={card.imageUrl} alt="" className="h-16 w-12 rounded-md object-cover" />
                  ) : (
                    <span className="grid h-16 w-12 place-items-center rounded-md bg-navy text-[10px] text-paper">?</span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{card.name}</span>
                    <span className="block truncate text-xs text-muted">
                      {card.set.name}
                      {card.cardNumber ? ` · ${card.cardNumber}` : ""} · {card.quantity} na coleção
                      {current > 0 ? ` · ${current} no deck` : ""}
                    </span>
                  </span>
                  <Button type="button" variant="secondary" disabled={busy} onClick={() => run(card.id, () => setDeckCardAction(deckId, card.id, current + 1))}>
                    {busy ? "…" : "Adicionar"}
                  </Button>
                </li>
              );
            })}
          </ul>
        ) : null}
      </section>

      <section className="rounded-3xl border border-line bg-card p-5">
        <h2 className="font-display text-2xl">Adicionar fora da coleção</h2>
        <p className="mt-1 text-sm text-muted">
          Busque pelo nome ou pelo número no catálogo. A carta entra no deck e não é cadastrada na coleção.
        </p>
        <input
          value={catalogQuery}
          onChange={(event) => setCatalogQuery(event.target.value)}
          placeholder="Nome ou número, ex.: Charizard ou 006"
          className={`${controlClass} mt-4`}
          aria-label="Buscar carta no catálogo"
        />
        {catalogVisible && catalogStatus === "loading" ? <p className="mt-3 text-sm text-muted">Buscando cartas…</p> : null}
        {catalogVisible && catalogStatus === "empty" ? <p className="mt-3 text-sm text-muted">Nenhuma carta encontrada.</p> : null}
        {catalogVisible && catalogStatus === "error" ? (
          <p className="mt-3 text-sm text-ember">Não foi possível consultar o catálogo.</p>
        ) : null}
        {catalogHits.length > 0 ? (
          <ul className="mt-4 divide-y divide-line">
            {catalogHits.map((card) => {
              const current = inDeck.get(card.id) ?? 0;
              const busy = pending && pendingId === card.id;
              return (
                <li key={card.id} className="flex items-center gap-3 py-3">
                  {card.thumbUrl ? (
                    <img src={card.thumbUrl} alt="" className="h-16 w-12 rounded-md object-cover" />
                  ) : (
                    <span className="grid h-16 w-12 place-items-center rounded-md bg-navy text-[10px] text-paper">?</span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{card.name}</span>
                    <span className="block truncate text-xs text-muted">
                      {card.setName}
                      {card.cardNumber ? ` · ${card.cardNumber}` : ""}
                      {current > 0 ? ` · ${current} no deck` : ""}
                    </span>
                  </span>
                  <Button type="button" variant="secondary" disabled={busy} onClick={() => run(card.id, () => addCatalogCardAction(deckId, card.id))}>
                    {busy ? "…" : "Adicionar"}
                  </Button>
                </li>
              );
            })}
          </ul>
        ) : null}
      </section>

      {message ? (
        <p className="text-sm text-ember" role="alert">
          {message}
        </p>
      ) : null}

      <section className="space-y-3">
        <h2 className="font-display text-2xl">Lista</h2>
        {entries.length === 0 ? (
          <p className="rounded-3xl border border-dashed border-line bg-card/70 px-6 py-12 text-center text-sm text-muted">
            Este deck ainda não tem cartas.
          </p>
        ) : (
          <ul className="space-y-2">
            {entries.map((entry) => {
              const key = entry.cardId ?? entry.tcgId ?? entry.id;
              const busy = pending && pendingId === key;
              return (
                <li key={entry.id} className="flex items-center gap-3 rounded-2xl border border-line bg-card p-3">
                  {entry.imageUrl ? (
                    <img src={entry.imageUrl} alt="" className="h-20 w-14 rounded-md object-cover" />
                  ) : (
                    <span className="grid h-20 w-14 place-items-center rounded-md bg-navy text-xs text-paper">?</span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{entry.name}</span>
                    <span className="block truncate text-xs text-muted">
                      {entry.setName}
                      {entry.cardNumber ? ` · ${entry.cardNumber}` : ""}
                      {entry.owned == null ? " · fora da coleção" : ` · ${entry.owned} na coleção`}
                    </span>
                  </span>
                  <span className="flex items-center gap-2">
                    <button
                      type="button"
                      className="grid h-8 w-8 place-items-center rounded-full border border-line bg-white text-lg leading-none"
                      disabled={busy}
                      onClick={() =>
                        run(key, () =>
                          entry.tcgId
                            ? setDeckCatalogAction(deckId, entry.tcgId, entry.quantity - 1)
                            : setDeckCardAction(deckId, entry.cardId ?? "", entry.quantity - 1),
                        )
                      }
                      aria-label={`Diminuir ${entry.name}`}
                    >
                      −
                    </button>
                    <span className="min-w-6 text-center text-sm font-semibold tabular-nums">{entry.quantity}</span>
                    <button
                      type="button"
                      className="grid h-8 w-8 place-items-center rounded-full border border-line bg-white text-lg leading-none"
                      disabled={busy}
                      onClick={() =>
                        run(key, () =>
                          entry.tcgId
                            ? setDeckCatalogAction(deckId, entry.tcgId, entry.quantity + 1)
                            : setDeckCardAction(deckId, entry.cardId ?? "", entry.quantity + 1),
                        )
                      }
                      aria-label={`Aumentar ${entry.name}`}
                    >
                      +
                    </button>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
