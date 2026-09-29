"use client";

import { useEffect, useState, useTransition } from "react";
import {
  addCatalogCardAction,
  setDeckCardAction,
  setDeckCatalogAction,
  setDeckCoverAction,
} from "@/actions/decks";
import { Button } from "@/components/ui/button";
import { controlClass } from "@/components/ui/field";
import type { CatalogHit, CatalogSearchResult } from "@/types/catalog";
import type { DeckEntryDTO } from "@/types/deck";

function isNumberQuery(value: string) {
  return /^(?:#)?\d{1,4}(?:\s*\/\s*\d{1,4})?$/.test(value);
}

export function DeckBuilder({
  deckId,
  entries,
  coverEntryId = null,
  readOnly = false,
}: {
  deckId: string;
  entries: DeckEntryDTO[];
  coverEntryId?: string | null;
  readOnly?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<CatalogHit[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "empty" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [activeCoverId, setActiveCoverId] = useState(coverEntryId);

  useEffect(() => {
    setActiveCoverId(coverEntryId);
  }, [coverEntryId]);

  useEffect(() => {
    const name = query.trim();
    if (!isNumberQuery(name) && name.length < 2) {
      setHits([]);
      setStatus("idle");
      return;
    }
    const controller = new AbortController();
    const handle = window.setTimeout(() => {
      setStatus("loading");
      void fetch(`/api/catalog?q=${encodeURIComponent(name)}&language=PT_BR`, { signal: controller.signal })
        .then((response) => {
          if (!response.ok) throw new Error("catalog");
          return response.json() as Promise<CatalogSearchResult>;
        })
        .then((data) => {
          setHits(data.items ?? []);
          setStatus((data.items ?? []).length === 0 ? "empty" : "idle");
        })
        .catch((error: unknown) => {
          if (error instanceof DOMException && error.name === "AbortError") return;
          setHits([]);
          setStatus("error");
        });
    }, 300);
    return () => {
      controller.abort();
      window.clearTimeout(handle);
    };
  }, [query]);

  function run(key: string, task: () => Promise<{ ok: boolean; message?: string }>) {
    setMessage(null);
    setPendingId(key);
    startTransition(async () => {
      const result = await task();
      setPendingId(null);
      if (!result.ok) setMessage(result.message ?? "Não foi possível atualizar o deck.");
    });
  }

  function setCover(entryId: string) {
    setMessage(null);
    setPendingId(`cover:${entryId}`);
    startTransition(async () => {
      const result = await setDeckCoverAction(deckId, entryId);
      setPendingId(null);
      if (!result.ok) {
        setMessage(result.message ?? "Não foi possível definir a capa.");
        return;
      }
      setActiveCoverId(entryId);
    });
  }

  const inDeck = new Map<string, number>();
  for (const entry of entries) {
    if (entry.cardId) inDeck.set(entry.cardId, entry.quantity);
    if (entry.tcgId) inDeck.set(entry.tcgId, entry.quantity);
  }

  const searchVisible = isNumberQuery(query.trim()) || query.trim().length >= 2;

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        {entries.length === 0 ? (
          <p className="rounded-3xl border border-dashed border-line bg-card/70 px-6 py-12 text-center text-sm text-muted">
            Este deck ainda não tem cartas.
          </p>
        ) : (
          <>
            {!readOnly ? (
              <p className="text-sm text-muted">
                Clique em <span className="font-medium text-ink">Capa</span> na carta que deve aparecer na lista de
                decks.
              </p>
            ) : null}
            <ul className="grid grid-cols-3 gap-x-2.5 gap-y-6 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-9">
              {entries.map((entry) => {
                const key = entry.cardId ?? entry.tcgId ?? entry.id;
                const busy = pending && (pendingId === key || pendingId === `cover:${entry.id}`);
                const isCover = activeCoverId === entry.id;
                return (
                  <li key={entry.id} className="group relative pb-4">
                    <article className="relative">
                      <div
                        className={`aspect-5/7 overflow-hidden rounded-xl bg-navy shadow-[0_10px_28px_-14px_rgba(28,25,23,0.65)] ${
                          isCover ? "ring-2 ring-ember ring-offset-2 ring-offset-paper" : ""
                        }`}
                      >
                        {entry.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={entry.imageUrl} alt={entry.name} className="h-full w-full object-cover" title={entry.name} />
                        ) : (
                          <span className="grid h-full w-full place-items-center text-sm text-paper" title={entry.name}>
                            ?
                          </span>
                        )}
                      </div>

                      {!readOnly && entry.imageUrl ? (
                        <button
                          type="button"
                          disabled={busy || isCover}
                          onClick={() => setCover(entry.id)}
                          className={`absolute left-1.5 top-1.5 z-10 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide shadow-sm transition ${
                            isCover
                              ? "bg-ember text-white"
                              : "border border-line bg-white/95 text-ink hover:bg-white"
                          }`}
                          aria-label={isCover ? `${entry.name} é a capa do deck` : `Usar ${entry.name} como capa`}
                          aria-pressed={isCover}
                        >
                          Capa
                        </button>
                      ) : null}

                      {isCover && readOnly ? (
                        <span className="absolute left-1.5 top-1.5 z-10 rounded-full bg-ember px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white shadow-sm">
                          Capa
                        </span>
                      ) : null}

                      <div className="absolute bottom-0 left-1/2 z-10 flex -translate-x-1/2 translate-y-1/2 items-center gap-1">
                        {readOnly ? (
                          <span className="grid h-8 w-8 place-items-center rounded-full border border-line bg-white text-sm font-bold tabular-nums text-ink shadow-sm">
                            {entry.quantity}
                          </span>
                        ) : (
                          <>
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
                          </>
                        )}
                      </div>
                    </article>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </section>

      {message ? (
        <p className="text-sm text-ember" role="alert">
          {message}
        </p>
      ) : null}

      {readOnly ? null : (
        <section className="rounded-3xl border border-line bg-card p-5">
          <h2 className="font-display text-2xl">Adicionar cartas</h2>
          <p className="mt-1 text-sm text-muted">
            Busque pelo nome ou pelo número. A carta entra só no deck, sem alterar a coleção.
          </p>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Nome ou número, ex.: Charizard ou 006"
            className={`${controlClass} mt-4`}
            aria-label="Buscar carta"
          />
          {searchVisible && status === "loading" ? <p className="mt-3 text-sm text-muted">Buscando cartas…</p> : null}
          {searchVisible && status === "empty" ? <p className="mt-3 text-sm text-muted">Nenhuma carta encontrada.</p> : null}
          {searchVisible && status === "error" ? (
            <p className="mt-3 text-sm text-ember">Não foi possível consultar o catálogo.</p>
          ) : null}
          {hits.length > 0 ? (
            <ul className="mt-4 max-h-80 divide-y divide-line overflow-y-auto">
              {hits.map((card) => {
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
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={busy}
                      onClick={() => run(card.id, () => addCatalogCardAction(deckId, card.id))}
                    >
                      {busy ? "…" : "Adicionar"}
                    </Button>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </section>
      )}
    </div>
  );
}
