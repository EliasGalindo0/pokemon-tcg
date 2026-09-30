"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { CatalogImg } from "@/components/cards/catalog-img";
import { DeleteCardButton } from "@/components/cards/delete-card-button";
import { TradeBoardView } from "@/components/trades/trade-board";
import { deleteTradeSetAction } from "@/actions/trades";
import type { TradeBoard, TradeSetSummary } from "@/types/trade";

export function TradeTabs({
  sets,
  activeId,
  board,
  readOnly = false,
  stockOnly = false,
  canOffer,
  viewerDisplayName,
  basePath = "/trocas",
}: {
  sets: TradeSetSummary[];
  activeId: string | null;
  board: TradeBoard | null;
  readOnly?: boolean;
  stockOnly?: boolean;
  canOffer?: boolean;
  viewerDisplayName?: string | null;
  basePath?: string;
}) {
  const router = useRouter();

  if (sets.length === 0) {
    return (
      <p className="rounded-3xl border border-dashed border-line bg-card/70 px-6 py-12 text-center text-sm text-muted">
        {readOnly
          ? "Ainda não há cartas disponíveis para troca."
          : "Nenhuma coleção cadastrada ainda. Busque por um número como 001/094 para começar."}
      </p>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Coleções de troca">
        {sets.map((set) => {
          const selected = set.id === activeId;
          return (
            <button
              key={set.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => router.push(`${basePath}?tab=${set.id}`)}
              className={`rounded-full px-3 py-1.5 text-sm transition ${
                selected ? "bg-navy text-paper" : "bg-card text-ink hover:bg-white"
              }`}
            >
              {set.name}
              <span className="ml-1.5 text-xs opacity-70">· {set.unitCount}</span>
            </button>
          );
        })}
      </div>

      {board ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-3xl tracking-tight">{board.name}</h2>
              <p className="mt-1 text-sm text-muted">
                {board.ownedSlots} de {board.total} cartas · {board.unitCount} un.
              </p>
            </div>
            <div className="flex items-center gap-3">
              {board.logoUrl ? (
                <CatalogImg key={board.id} src={board.logoUrl} className="h-12 w-24 object-contain" />
              ) : null}
              {readOnly ? null : (
                <DeleteCardButton
                  action={deleteTradeSetAction.bind(null, board.id)}
                  label="Excluir coleção"
                  confirm={`Excluir a coleção de troca “${board.name}”?`}
                />
              )}
            </div>
          </div>
          <TradeBoardView
            board={board}
            readOnly={readOnly}
            stockOnly={stockOnly}
            canOffer={canOffer}
            viewerDisplayName={viewerDisplayName}
          />
        </div>
      ) : (
        <p className="rounded-3xl border border-dashed border-line bg-card/70 px-6 py-12 text-center text-sm text-muted">
          Selecione uma coleção nas abas.{" "}
          <Link href={`${basePath}?tab=${sets[0].id}`} className="text-navy hover:underline">
            Abrir {sets[0].name}
          </Link>
        </p>
      )}
    </div>
  );
}
