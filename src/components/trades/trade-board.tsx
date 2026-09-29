"use client";

import { useRef, useState, useTransition } from "react";
import { setTradeQuantityAction } from "@/actions/trades";
import { CatalogImg } from "@/components/cards/catalog-img";
import { TradeOfferDialog } from "@/components/trades/trade-offer-dialog";
import type { TradeBoard, TradeSlot } from "@/types/trade";

type Filter = "all" | "missing" | "owned";

export function TradeBoardView({
  board,
  readOnly = false,
  stockOnly = false,
  canOffer,
  viewerDisplayName,
  compact = false,
}: {
  board: TradeBoard;
  readOnly?: boolean;
  stockOnly?: boolean;
  canOffer?: boolean;
  viewerDisplayName?: string | null;
  compact?: boolean;
}) {
  const allowOffer = canOffer ?? readOnly;
  const [filter, setFilter] = useState<Filter>(readOnly || stockOnly ? "owned" : "all");
  const [message, setMessage] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [offerSlot, setOfferSlot] = useState<TradeSlot | null>(null);
  const inflight = useRef(new Set<string>());

  const visible = board.slots.filter((slot) => {
    if (filter === "missing") return slot.quantity === 0;
    if (filter === "owned") return slot.quantity > 0;
    return true;
  });
  const missing = board.total - board.ownedSlots;

  function setQuantity(tcgId: string, quantity: number) {
    if (readOnly) return;
    if (inflight.current.has(tcgId)) return;
    inflight.current.add(tcgId);
    setMessage(null);
    setPendingId(tcgId);
    startTransition(async () => {
      const result = await setTradeQuantityAction(board.id, tcgId, quantity);
      inflight.current.delete(tcgId);
      setPendingId(null);
      if (!result.ok) setMessage(result.message ?? "Não foi possível atualizar esta carta.");
    });
  }

  return (
    <div className="space-y-6">
      {compact ? null : (
        <div>
          <p className="text-sm text-muted">
            {board.ownedSlots} de {board.total} cartas para troca
            {board.unitCount > board.ownedSlots ? ` · ${board.unitCount} unidades` : ""}
            {board.official > 0 ? ` · ${board.official} oficiais` : ""}
          </p>
          <p className="mt-1 max-w-xl text-sm text-muted">
            {readOnly
              ? allowOffer
                ? `Escolha uma carta de ${board.owner.displayName} e proponha uma troca. O pedido vai só para este colecionador.`
                : "Estas são as suas cartas disponíveis para troca."
              : "As cartas que você ainda não tem para troca ficam apagadas. Clique para marcar e use +/− para a quantidade disponível."}
          </p>
        </div>
      )}

      {message ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-ember" role="alert">
          {message}
        </p>
      ) : null}

      {stockOnly ? null : (
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filtrar cartas para troca">
          {(
            [
              ["all", `Todas (${board.total})`],
              ["missing", `Sem estoque (${missing})`],
              ["owned", `Para troca (${board.ownedSlots})`],
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
      )}

      {visible.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-line bg-card/70 px-6 py-12 text-center text-sm text-muted">
          Nenhuma carta neste filtro.
        </p>
      ) : (
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
          {visible.map((slot) => {
            const busy = pending && pendingId === slot.tcgId;
            const owned = slot.quantity > 0;
            return (
              <li key={slot.tcgId} className="space-y-1">
                <div
                  className={`relative overflow-hidden rounded-xl border bg-card ${
                    owned ? "border-navy/30 shadow-sm" : "border-line"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      if (readOnly) {
                        if (owned && allowOffer) setOfferSlot(slot);
                        return;
                      }
                      if (owned) return;
                      setQuantity(slot.tcgId, 1);
                    }}
                    disabled={busy || (!readOnly && owned) || (readOnly && (!owned || !allowOffer))}
                    aria-pressed={owned}
                    aria-label={
                      readOnly
                        ? owned
                          ? allowOffer
                            ? `Propor troca por ${slot.name} ${slot.number} com ${board.owner.displayName}`
                            : `${slot.name} ${slot.number}, ${slot.quantity} para troca`
                          : `${slot.name} ${slot.number}, indisponível`
                        : owned
                          ? `${slot.name} ${slot.number}, ${slot.quantity} para troca`
                          : `Marcar ${slot.name} ${slot.number} para troca`
                    }
                    className="block w-full text-left disabled:cursor-default"
                  >
                    <span className={`block aspect-[63/88] ${owned ? "" : "opacity-40 grayscale"}`}>
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

                  {owned && !readOnly ? (
                    <div className="absolute bottom-1.5 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1">
                      <button
                        type="button"
                        className="grid h-7 w-7 place-items-center rounded-full border border-line bg-white text-sm leading-none shadow-sm"
                        disabled={busy}
                        onClick={() => setQuantity(slot.tcgId, slot.quantity - 1)}
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
                        onClick={() => setQuantity(slot.tcgId, slot.quantity + 1)}
                        aria-label={`Aumentar ${slot.name}`}
                      >
                        +
                      </button>
                    </div>
                  ) : null}

                  {owned && readOnly && allowOffer ? (
                    <span className="pointer-events-none absolute bottom-1.5 left-1/2 z-10 -translate-x-1/2 rounded-full bg-navy px-2 py-1 text-[10px] font-semibold text-paper">
                      Trocar{slot.quantity > 1 ? ` · ${slot.quantity}` : ""}
                    </span>
                  ) : owned && readOnly && slot.quantity > 1 ? (
                    <span className="pointer-events-none absolute bottom-1.5 left-1/2 z-10 -translate-x-1/2 rounded-full bg-navy px-2 py-1 text-[10px] font-semibold text-paper">
                      {slot.quantity}
                    </span>
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
              </li>
            );
          })}
        </ul>
      )}

      {offerSlot ? (
        <TradeOfferDialog
          tradeSetId={board.id}
          ownerUsername={board.owner.username}
          ownerDisplayName={board.owner.displayName}
          viewerDisplayName={viewerDisplayName}
          language={board.language}
          slot={offerSlot}
          onClose={() => setOfferSlot(null)}
        />
      ) : null}
    </div>
  );
}
