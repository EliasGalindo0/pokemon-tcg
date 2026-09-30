"use client";

import { useState, useTransition } from "react";
import { proposeTradeOfferAction } from "@/actions/trade-offers";
import { CatalogSearch } from "@/components/cards/catalog-search";
import { Button } from "@/components/ui/button";
import { controlClass } from "@/components/ui/field";
import type { CatalogHit } from "@/types/catalog";
import type { TradeSlot } from "@/types/trade";

export function TradeOfferDialog({
  tradeSetId,
  ownerUsername,
  ownerDisplayName,
  viewerDisplayName,
  language,
  slot,
  onClose,
}: {
  tradeSetId: string;
  ownerUsername: string;
  ownerDisplayName: string;
  viewerDisplayName?: string | null;
  language: string;
  slot: TradeSlot;
  onClose: () => void;
}) {
  const [offered, setOffered] = useState<CatalogHit | null>(null);
  const [visitorName, setVisitorName] = useState(viewerDisplayName ?? "");
  const [visitorNote, setVisitorNote] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  function submit() {
    if (!offered) {
      setMessage("Escolha a carta que você oferece na troca.");
      return;
    }
    setMessage(null);
    startTransition(async () => {
      const result = await proposeTradeOfferAction({
        ownerUsername,
        wantedTradeSetId: tradeSetId,
        wantedTcgId: slot.tcgId,
        offeredTcgId: offered.id,
        offeredLanguage: offered.language || language,
        visitorName: viewerDisplayName || visitorName,
        visitorNote,
      });
      if (!result.ok) {
        setMessage(result.message);
        return;
      }
      setDone(true);
      setMessage(result.message ?? "Oferta enviada.");
    });
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-navy/50 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="trade-offer-title"
      onClick={(event) => {
        if (event.target === event.currentTarget && !pending) onClose();
      }}
    >
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-line bg-paper p-5 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ember">Propor troca</p>
            <h2 id="trade-offer-title" className="mt-1 font-display text-3xl tracking-tight">
              {slot.name}
            </h2>
            <p className="mt-1 text-sm text-muted">
              Carta de {ownerDisplayName}. Ofereça uma carta do catálogo para solicitar esta ({slot.number}).
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="rounded-full px-2 py-1 text-sm text-muted hover:bg-card"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        <div className="mt-4 flex gap-3 rounded-2xl border border-line bg-card p-3">
          <span className="h-24 w-[68px] shrink-0 overflow-hidden rounded-lg bg-navy">
            {slot.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={slot.imageUrl} alt="" className="h-full w-full object-cover" />
            ) : null}
          </span>
          <div className="min-w-0 self-center">
            <p className="font-medium">{slot.name}</p>
            <p className="text-sm text-muted">{slot.number} · {ownerDisplayName}</p>
          </div>
        </div>

        {done ? (
          <div className="mt-5 space-y-4">
            <p className="rounded-2xl border border-line bg-card px-4 py-3 text-sm" role="status">
              {message}
            </p>
            <Button type="button" onClick={onClose} className="w-full">
              Fechar
            </Button>
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            <CatalogSearch language={language} onPick={setOffered} />

            {offered ? (
              <div className="flex gap-3 rounded-2xl border border-navy/30 bg-white p-3">
                <span className="h-16 w-12 shrink-0 overflow-hidden rounded-md bg-navy">
                  {offered.thumbUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={offered.thumbUrl} alt="" className="h-full w-full object-cover" />
                  ) : null}
                </span>
                <div className="min-w-0">
                  <p className="text-xs text-muted">Você oferece</p>
                  <p className="truncate font-medium">{offered.name}</p>
                  <p className="truncate text-xs text-muted">
                    {offered.setName}
                    {offered.cardNumber ? ` · ${offered.cardNumber}` : ""}
                  </p>
                </div>
              </div>
            ) : null}

            {viewerDisplayName ? (
              <p className="text-sm text-muted">
                A oferta vai como <span className="font-medium text-ink">{viewerDisplayName}</span>.
              </p>
            ) : (
              <label className="block text-sm">
                <span className="mb-1.5 block text-muted">Seu nome (opcional)</span>
                <input
                  value={visitorName}
                  onChange={(event) => setVisitorName(event.target.value)}
                  maxLength={80}
                  className={controlClass}
                  placeholder="Como o dono pode te reconhecer"
                />
              </label>
            )}
            <label className="block text-sm">
              <span className="mb-1.5 block text-muted">Mensagem (opcional)</span>
              <textarea
                value={visitorNote}
                onChange={(event) => setVisitorNote(event.target.value)}
                maxLength={280}
                rows={2}
                className={controlClass}
                placeholder="Contato ou detalhes da troca"
              />
            </label>

            {message ? (
              <p className="text-sm text-ember" role="alert">
                {message}
              </p>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={submit} disabled={pending || !offered} className="flex-1">
                {pending ? "Enviando…" : "Enviar oferta"}
              </Button>
              <Button type="button" variant="secondary" onClick={onClose} disabled={pending}>
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
