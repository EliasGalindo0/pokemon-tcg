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
    <div className="space-y-8">
      <section className="space-y-4">
        {entries.length === 0 ? (
          <p className="rounded-3xl border border-dashed border-line bg-card/70 px-6 py-12 text-center text-sm text-muted">
            Este deck ainda não tem cartas.
          </p>
        ) : (
          <ul className="grid grid-cols-3 gap-x-2.5 gap-y-6 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-9">
            {entries.map((entry) => {
              const key = entry.cardId ?? entry.tcgId ?? entry.id;
              const busy = pending && pendingId === key;
              return (
                <li key={entry.id} className="group relative pb-4">
                  <article className="relative">
                    <div className="aspect-5/7 overflow-hidden rounded-xl bg-navy shadow-[0_10px_28px_-14px_rgba(28,25,23,0.65)]">
                      {entry.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={entry.imageUrl} alt={entry.name} className="h-full w-full object-cover" title={entry.name} />
                      ) : (
                        <span className="grid h-full w-full place-items-center text-sm text-paper" title={entry.name}>
                          ?
                        </span>
                      )}
                    </div>
                    <div className="absolute bottom-0 left-1/2 z-10 flex -translate-x-1/2 translate-y-1/2 items-center gap-1">
                      <button
                        type="button"
                        className="grid h-7 w-7 place-items-center rounded-full border border-line bg-white text-base leading-none shadow-sm transition [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:group-focus-within:opacity-100"
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
                      <span className="grid h-8 w-8 place-items-center rounded-full border border-line bg-white text-sm font-bold tabular-nums text-ink shadow-sm">
                        {entry.quantity}
                      </span>
                      <button
                        type="button"
                        className="grid h-7 w-7 place-items-center rounded-full border border-line bg-white text-base leading-none shadow-sm transition [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:group-focus-within:opacity-100"
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
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {message ? (
        <p className="text-sm text-ember" role="alert">
          {message}
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
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
                      // eslint-disable-next-line @next/next/no-img-element
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
                      // eslint-disable-next-line @next/next/no-img-element
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
      </div>
    </div>
  );
}
