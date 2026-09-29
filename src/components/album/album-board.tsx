"use client";

import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { ownEntireAlbum, toggleAlbumSlot } from "@/actions/album";
import { setCardQuantityAction } from "@/actions/cards";
import { CatalogImg } from "@/components/cards/catalog-img";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/format";
import type { AlbumView } from "@/types/album";

type Filter = "all" | "missing" | "owned";

export function AlbumBoard({
  album,
  language,
  readOnly = false,
  manage = false,
}: {
  album: AlbumView;
  language: string;
  readOnly?: boolean;
  /** Quantidade, valores e link de edição — em Minha coleção. */
  manage?: boolean;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const [message, setMessage] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [filling, startFill] = useTransition();
  const inflight = useRef(new Set<string>());

  const visible = album.slots.filter((slot) => {
    if (filter === "missing") return !slot.owned;
    if (filter === "owned") return slot.owned;
    return true;
  });
  const missing = album.total - album.ownedSlots;

  function toggle(slotId: string, ownedIds: string[], owned: boolean) {
    if (readOnly) return;
    if (inflight.current.has(slotId)) return;
    if (owned && !window.confirm("Tirar esta carta do álbum?")) return;
    inflight.current.add(slotId);
    setMessage(null);
    setPendingId(slotId);
    startTransition(async () => {
      const result = await toggleAlbumSlot(album.setId, language, slotId, ownedIds);
      inflight.current.delete(slotId);
      setPendingId(null);
      if (!result.ok) setMessage(result.message ?? "Não foi possível atualizar esta carta.");
    });
  }

  function setQuantity(cardId: string, quantity: number) {
    if (readOnly || !manage) return;
    if (inflight.current.has(cardId)) return;
    inflight.current.add(cardId);
    setMessage(null);
    setPendingId(cardId);
    startTransition(async () => {
      const result = await setCardQuantityAction(cardId, quantity);
      inflight.current.delete(cardId);
      setPendingId(null);
      if (!result.ok) setMessage(result.message ?? "Não foi possível atualizar a quantidade.");
    });
  }

  function ownAll() {
    if (readOnly) return;
    setMessage(null);
    startFill(async () => {
      const result = await ownEntireAlbum(album.setId, language);
      if (!result.ok) setMessage(result.message ?? "Não foi possível marcar a coleção.");
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted">
            {album.ownedSlots} de {album.total} cartas
            {album.ownedUnits > album.ownedSlots ? ` · ${album.ownedUnits} unidades` : ""}
            {album.official > 0 ? ` · ${album.official} oficiais` : ""}
            {manage && album.estimatedValue ? ` · ${formatMoney(album.estimatedValue)}` : ""}
          </p>
          <p className="mt-1 max-w-xl text-sm text-muted">
            {readOnly
              ? "Visualização somente leitura."
              : manage
                ? "Cartas que faltam ficam apagadas. Clique para marcar; use +/− para quantidade e abra a carta para editar valor."
                : "As cartas que você não tem ficam apagadas. Clique para marcar ou tirar. Se a coleção estiver quase completa, marque todas e remova só as que faltam."}
          </p>
        </div>
        {readOnly ? null : (
          <Button type="button" onClick={ownAll} disabled={filling || missing === 0}>
            {filling ? "Marcando…" : "Tenho todas"}
          </Button>
        )}
      </div>

      {message ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-ember" role="alert">
          {message}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filtrar cartas do álbum">
        {(
          [
            ["all", `Todas (${album.total})`],
            ["missing", `Faltam (${missing})`],
            ["owned", `Tenho (${album.ownedSlots})`],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={filter === value}
            onClick={() => setFilter(value)}
            className={`rounded-full px-3 py-1.5 text-sm transition ${
              filter === value ? "bg-navy text-paper" : "bg-card text-ink hover:bg-white"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-line bg-card/70 px-6 py-12 text-center text-sm text-muted">
          Nenhuma carta neste filtro.
        </p>
      ) : (
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
          {visible.map((slot) => {
            const busy = pending && (pendingId === slot.tcgId || pendingId === slot.ownedIds[0]);
            const cardId = slot.ownedIds[0];
            return (
              <li key={slot.tcgId} className="space-y-1">
                <div
                  className={`relative overflow-hidden rounded-xl border bg-card ${
                    slot.owned ? "border-navy/30 shadow-sm" : "border-line"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggle(slot.tcgId, slot.ownedIds, slot.owned)}
                    disabled={busy || filling || readOnly || (manage && slot.owned)}
                    aria-pressed={slot.owned}
                    aria-label={
                      slot.owned
                        ? `${slot.name} ${slot.number}, ${slot.quantity} un.`
                        : `Marcar ${slot.name} ${slot.number} como minha`
                    }
                    className={`block w-full text-left disabled:cursor-default ${readOnly ? "" : ""}`}
                  >
                    <span className={`block aspect-[63/88] ${slot.owned ? "" : "opacity-40 grayscale"}`}>
                      {slot.imageUrl ? (
                        <CatalogImg
                          src={slot.imageUrl}
                          className="h-full w-full object-cover"
                          fallback={
                            <span className="grid h-full place-items-center bg-navy/5 px-2 text-center text-xs text-muted">
                              {slot.name}
                            </span>
                          }
                        />
                      ) : (
                        <span className="grid h-full place-items-center px-2 text-center text-xs text-muted">
                          {slot.name}
                        </span>
                      )}
                    </span>
                  </button>

                  {slot.owned && !manage ? (
                    <span className="absolute right-1.5 top-1.5 grid h-6 min-w-6 place-items-center rounded-full bg-navy px-1.5 text-[11px] font-medium text-paper">
                      {slot.quantity > 1 ? slot.quantity : "✓"}
                    </span>
                  ) : null}

                  {slot.owned && manage && cardId ? (
                    <div className="absolute bottom-1.5 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1">
                      <button
                        type="button"
                        className="grid h-7 w-7 place-items-center rounded-full border border-line bg-white text-sm leading-none shadow-sm"
                        disabled={busy}
                        onClick={() => setQuantity(cardId, slot.quantity - 1)}
                        aria-label={`Diminuir ${slot.name}`}
                      >
                        −
                      </button>
                      <span className="grid h-7 min-w-7 place-items-center rounded-full bg-navy px-1.5 text-[11px] font-semibold tabular-nums text-paper">
                        {slot.quantity}
                      </span>
                      <button
                        type="button"
                        className="grid h-7 w-7 place-items-center rounded-full border border-line bg-white text-sm leading-none shadow-sm"
                        disabled={busy}
                        onClick={() => setQuantity(cardId, slot.quantity + 1)}
                        aria-label={`Aumentar ${slot.name}`}
                      >
                        +
                      </button>
                    </div>
                  ) : null}

                  {busy ? (
                    <span className="absolute inset-0 grid place-items-center bg-paper/70 text-xs font-medium">
                      Salvando…
                    </span>
                  ) : null}
                </div>
                <div className="flex items-baseline justify-between gap-2 px-0.5">
                  <p className="truncate text-xs text-ink" title={slot.name}>
                    {slot.name}
                  </p>
                  <p className="shrink-0 text-[11px] text-muted">{slot.number}</p>
                </div>
                {slot.owned && manage && slot.marketValue ? (
                  <p className="px-0.5 text-[11px] font-medium text-ink">
                    {formatMoney(slot.marketValue)}
                    {slot.quantity > 1 ? ` · ${formatMoney(Number(slot.marketValue) * slot.quantity)}` : ""}
                  </p>
                ) : null}
                {slot.owned && cardId ? (
                  <Link href={`/cards/${cardId}`} className="block px-0.5 text-[11px] text-navy hover:underline">
                    {manage ? "Editar carta" : "Ver carta"}
                  </Link>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
