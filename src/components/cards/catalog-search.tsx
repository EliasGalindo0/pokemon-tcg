"use client";

import { useEffect, useState } from "react";
import { looksLikeCardNumberQuery } from "@/lib/card-number";
import { controlClass } from "@/components/ui/field";
import { RARITY_LABEL } from "@/lib/labels";
import type { CatalogHit, CatalogSearchResult } from "@/types/catalog";

function formatQuote(amount: string, currency: "USD" | "EUR" | "BRL") {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(Number(amount));
}

export function CatalogSearch({
  language,
  onPick,
}: {
  language: string;
  onPick: (card: CatalogHit) => void;
}) {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<CatalogHit[]>([]);
  const [resultLanguage, setResultLanguage] = useState(language);
  const [status, setStatus] = useState<"idle" | "loading" | "empty" | "error">("idle");

  useEffect(() => {
    const name = query.trim();
    const byNumber = looksLikeCardNumberQuery(name);
    if (!byNumber && name.length < 2) return;

    const controller = new AbortController();
    const timer = setTimeout(() => {
      void (async () => {
        setStatus("loading");
        try {
          const response = await fetch(
            `/api/catalog?q=${encodeURIComponent(name)}&language=${encodeURIComponent(language)}`,
            { signal: controller.signal },
          );
          if (!response.ok) throw new Error("catalog");
          const data = (await response.json()) as CatalogSearchResult;
          if (controller.signal.aborted) return;
          setItems(data.items);
          setResultLanguage(data.language);
          setStatus(data.items.length === 0 ? "empty" : "idle");
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") return;
          if (!controller.signal.aborted) setStatus("error");
        }
      })();
    }, 350);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query, language]);

  const trimmed = query.trim();
  const visible = looksLikeCardNumberQuery(trimmed) || trimmed.length >= 2;

  return (
    <section className="rounded-2xl border border-line bg-card p-4">
      <label className="block space-y-1.5" htmlFor="catalog-query">
        <span className="text-sm font-medium">Buscar no catálogo</span>
        <input
          id="catalog-query"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            const next = event.target.value.trim();
            if (!looksLikeCardNumberQuery(next) && next.length < 2) {
              setItems([]);
              setStatus("idle");
            }
          }}
          placeholder="Nome ou número, ex.: Lucario, 095/∞ ou 094/094"
          className={controlClass}
          autoComplete="off"
        />
      </label>
      <p className="mt-2 text-xs text-muted">
        Promos usam infinito (095/∞). O segundo número da coleção mantém zeros (094/094).
      </p>

      {visible && status === "loading" ? <p className="mt-3 text-sm text-muted">Buscando cartas…</p> : null}
      {visible && status === "empty" ? <p className="mt-3 text-sm text-muted">Nenhuma carta encontrada.</p> : null}
      {visible && status === "error" ? (
        <p className="mt-3 text-sm text-ember">Não foi possível consultar o catálogo.</p>
      ) : null}
      {visible && resultLanguage === "EN" && language !== "EN" && items.length > 0 ? (
        <p className="mt-3 text-xs text-muted">Sem resultados nesse idioma. Mostrando a versão em inglês.</p>
      ) : null}

      {visible && items.length > 0 ? (
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {items.map((card) => (
            <li key={card.id}>
              <button
                type="button"
                onClick={() => onPick(card)}
                className="flex w-full gap-3 rounded-xl border border-line bg-white p-2 text-left transition hover:border-navy"
              >
                <span className="h-16 w-12 shrink-0 overflow-hidden rounded-md bg-navy">
                  {card.thumbUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={card.thumbUrl} alt="" className="h-full w-full object-cover" />
                  ) : null}
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-medium">{card.name}</span>
                  <span className="block truncate text-xs text-muted">
                    {card.setName}
                    {card.cardNumber ? ` · ${card.cardNumber}` : ""}
                  </span>
                  <span className="mt-1 block text-xs text-muted">
                    {RARITY_LABEL[card.rarity]}
                    {card.marketValue && card.priceCurrency
                      ? ` · ${formatQuote(card.marketValue, card.priceCurrency)}${
                          card.sourceAmount && card.sourceCurrency
                            ? ` (cotação de ${formatQuote(card.sourceAmount, card.sourceCurrency)})`
                            : ""
                        }`
                      : ""}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
