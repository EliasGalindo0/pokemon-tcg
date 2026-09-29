"use client";

import { useState, useTransition } from "react";
import { acceptTradeOfferAction, rejectTradeOfferAction } from "@/actions/trade-offers";
import { Button } from "@/components/ui/button";
import { LANGUAGE_LABEL, RARITY_LABEL, type LanguageValue, type RarityValue } from "@/lib/labels";
import type { TradeOfferDTO } from "@/types/trade-offer";

function labelLanguage(value: string) {
  return LANGUAGE_LABEL[value as LanguageValue] ?? value;
}

function labelRarity(value: string) {
  return RARITY_LABEL[value as RarityValue] ?? value;
}

export function OffersList({ offers }: { offers: TradeOfferDTO[] }) {
  const [message, setMessage] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run(id: string, kind: "accept" | "reject") {
    setMessage(null);
    setPendingId(id);
    startTransition(async () => {
      const result =
        kind === "accept" ? await acceptTradeOfferAction(id) : await rejectTradeOfferAction(id);
      setPendingId(null);
      if (!result.ok) setMessage(result.message);
      else setMessage(result.message ?? null);
    });
  }

  if (offers.length === 0) {
    return (
      <p className="rounded-3xl border border-dashed border-line bg-card/70 px-6 py-12 text-center text-sm text-muted">
        Nenhuma oferta neste filtro.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {message ? (
        <p className="rounded-2xl border border-line bg-card px-4 py-3 text-sm" role="status">
          {message}
        </p>
      ) : null}
      <ul className="space-y-4">
        {offers.map((offer) => {
          const busy = pending && pendingId === offer.id;
          return (
            <li key={offer.id} className="rounded-3xl border border-line bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                    {offer.status === "PENDING"
                      ? "Pendente"
                      : offer.status === "ACCEPTED"
                        ? "Aceita"
                        : offer.status === "REJECTED"
                          ? "Recusada"
                          : "Cancelada"}
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    {offer.visitorName ? `De ${offer.visitorName}` : "Visitante"}
                    {" · "}
                    {new Date(offer.createdAt).toLocaleString("pt-BR")}
                  </p>
                </div>
                {offer.status === "PENDING" ? (
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" disabled={busy} onClick={() => run(offer.id, "accept")}>
                      {busy ? "…" : "Aceitar"}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={busy}
                      onClick={() => run(offer.id, "reject")}
                    >
                      Recusar
                    </Button>
                  </div>
                ) : null}
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="flex gap-3 rounded-2xl border border-line bg-white p-3">
                  <span className="h-20 w-14 shrink-0 overflow-hidden rounded-lg bg-navy">
                    {offer.wantedImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={offer.wantedImageUrl} alt="" className="h-full w-full object-cover" />
                    ) : null}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs text-muted">Você entrega</p>
                    <p className="font-medium">{offer.wantedName}</p>
                    <p className="text-xs text-muted">
                      {offer.wantedTradeSetName}
                      {offer.wantedNumber ? ` · ${offer.wantedNumber}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 rounded-2xl border border-navy/25 bg-white p-3">
                  <span className="h-20 w-14 shrink-0 overflow-hidden rounded-lg bg-navy">
                    {offer.offeredImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={offer.offeredImageUrl} alt="" className="h-full w-full object-cover" />
                    ) : null}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs text-muted">Você recebe</p>
                    <p className="font-medium">{offer.offeredName}</p>
                    <p className="text-xs text-muted">
                      {offer.offeredSetName}
                      {offer.offeredNumber ? ` · ${offer.offeredNumber}` : ""}
                      {" · "}
                      {labelLanguage(offer.offeredLanguage)}
                      {" · "}
                      {labelRarity(offer.offeredRarity)}
                    </p>
                  </div>
                </div>
              </div>

              {offer.visitorNote ? (
                <p className="mt-3 text-sm text-muted">“{offer.visitorNote}”</p>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
