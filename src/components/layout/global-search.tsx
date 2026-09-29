"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import type { GlobalSearchHit, GlobalSearchResult } from "@/types/search";

const EMPTY: GlobalSearchResult = { q: "", cards: [], decks: [], trades: [] };

function HitList({
  title,
  items,
  onPick,
}: {
  title: string;
  items: GlobalSearchHit[];
  onPick: () => void;
}) {
  if (items.length === 0) return null;
  return (
    <div className="space-y-1">
      <p className="px-2 text-[11px] font-semibold uppercase tracking-wide text-white/50">{title}</p>
      <ul>
        {items.map((item) => (
          <li key={`${item.kind}-${item.id}`}>
            <Link
              href={item.href}
              onClick={onPick}
              className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-white/10"
            >
              {item.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.imageUrl} alt="" className="h-10 w-8 rounded object-cover" />
              ) : (
                <span className="grid h-10 w-8 place-items-center rounded bg-white/10 text-[10px] text-white/70">
                  ?
                </span>
              )}
              <span className="min-w-0">
                <span className="block truncate text-sm text-paper">{item.title}</span>
                <span className="block truncate text-xs text-white/55">{item.subtitle}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function GlobalSearch() {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<GlobalSearchResult>(EMPTY);
  const [status, setStatus] = useState<"idle" | "loading" | "empty" | "error">("idle");

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResult(EMPTY);
      setStatus("idle");
      return;
    }
    const controller = new AbortController();
    const handle = window.setTimeout(() => {
      setStatus("loading");
      void fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: controller.signal })
        .then((response) => {
          if (!response.ok) throw new Error("search");
          return response.json() as Promise<GlobalSearchResult>;
        })
        .then((data) => {
          setResult(data);
          const total = data.cards.length + data.decks.length + data.trades.length;
          setStatus(total === 0 ? "empty" : "idle");
          setOpen(true);
        })
        .catch((error: unknown) => {
          if (error instanceof DOMException && error.name === "AbortError") return;
          setStatus("error");
        });
    }, 300);
    return () => {
      controller.abort();
      window.clearTimeout(handle);
    };
  }, [query]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  const showPanel = open && query.trim().length >= 2;

  return (
    <div ref={rootRef} className="relative w-full min-w-0">
      <label className="sr-only" htmlFor={listId}>
        Busca global
      </label>
      <input
        id={listId}
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onFocus={() => {
          if (query.trim().length >= 2) setOpen(true);
        }}
        placeholder="Buscar coleção, deck, troca…"
        className="w-full min-w-0 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm text-paper outline-none placeholder:text-white/45 focus:border-white/35 focus:bg-white/15"
        autoComplete="off"
      />
      {showPanel ? (
        <div className="absolute left-0 right-0 z-40 mt-2 w-full max-w-[min(100vw-2rem,22rem)] rounded-2xl border border-white/10 bg-navy p-3 shadow-[0_20px_50px_-24px_rgba(0,0,0,0.8)] sm:left-auto sm:right-0">
          {status === "loading" ? <p className="px-2 text-sm text-white/60">Buscando…</p> : null}
          {status === "error" ? <p className="px-2 text-sm text-ember">Não foi possível buscar.</p> : null}
          {status === "empty" ? <p className="px-2 text-sm text-white/60">Nada encontrado.</p> : null}
          {status === "idle" ? (
            <div className="space-y-3">
              <HitList title="Coleção" items={result.cards} onPick={() => setOpen(false)} />
              <HitList title="Decks" items={result.decks} onPick={() => setOpen(false)} />
              <HitList title="Trocas" items={result.trades} onPick={() => setOpen(false)} />
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
