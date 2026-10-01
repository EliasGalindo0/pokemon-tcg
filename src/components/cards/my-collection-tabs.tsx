"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlbumBoard } from "@/components/album/album-board";
import { CatalogImg } from "@/components/cards/catalog-img";
import { PlayerCardsPanel } from "@/components/cards/player-cards-panel";
import { PromoCollectionPanel } from "@/components/cards/promo-collection-panel";
import { ButtonLink } from "@/components/ui/button";
import { formatMoney } from "@/lib/format";
import type { AlbumView } from "@/types/album";
import type { CardDTO, SetDTO } from "@/types/card";
import type { PlayerCardDTO } from "@/types/player-card";
import { TAB_PLAYER, TAB_PROMOS } from "@/types/player-card";

export function MyCollectionTabs({
  sets,
  activeId,
  album,
  language,
  canAddSets,
  showSearchLink = false,
  promoCards,
  playerCards,
}: {
  sets: SetDTO[];
  activeId: string | null;
  album: AlbumView | null;
  language: string;
  canAddSets: boolean;
  showSearchLink?: boolean;
  promoCards: CardDTO[];
  playerCards: PlayerCardDTO[];
}) {
  const router = useRouter();
  const isPromos = activeId === TAB_PROMOS;
  const isPlayer = activeId === TAB_PLAYER;

  function goTab(tab: string) {
    router.push(`/cards?tab=${tab}&language=${language}`);
  }

  const tabClass = (selected: boolean) =>
    `rounded-full px-3 py-1.5 text-sm transition ${
      selected ? "bg-navy text-paper" : "bg-card text-ink hover:bg-white"
    }`;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Minhas coleções">
          {sets.map((set) => {
            const selected = set.id === activeId;
            return (
              <button
                key={set.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => goTab(set.id)}
                className={tabClass(selected)}
              >
                {set.name}
                {typeof set.cardCount === "number" ? (
                  <span className="ml-1.5 text-xs opacity-70">· {set.cardCount}</span>
                ) : null}
                {set.isPublic ? <span className="ml-1 text-[10px] uppercase opacity-70">público</span> : null}
              </button>
            );
          })}
          <button
            type="button"
            role="tab"
            aria-selected={isPromos}
            onClick={() => goTab(TAB_PROMOS)}
            className={tabClass(isPromos)}
          >
            Promoções
            {promoCards.length > 0 ? (
              <span className="ml-1.5 text-xs opacity-70">· {promoCards.length}</span>
            ) : null}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={isPlayer}
            onClick={() => goTab(TAB_PLAYER)}
            className={tabClass(isPlayer)}
          >
            Jogador
            {playerCards.length > 0 ? (
              <span className="ml-1.5 text-xs opacity-70">· {playerCards.length}</span>
            ) : null}
          </button>
        </div>
        {showSearchLink ? (
          <Link href="/cards?buscar=1" className="text-sm text-navy hover:underline">
            + Coleção
          </Link>
        ) : null}
      </div>

      {isPromos ? (
        <PromoCollectionPanel cards={promoCards} language={language} canAdd={canAddSets} />
      ) : isPlayer ? (
        <PlayerCardsPanel cards={playerCards} language={language} />
      ) : sets.length === 0 ? (
        <section className="rounded-3xl border border-dashed border-line bg-card/70 px-6 py-16 text-center">
          <h2 className="font-display text-3xl">Nenhuma coleção de set ainda</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            Use as abas Promoções e Jogador, ou{" "}
            {canAddSets ? "busque uma coleção no catálogo." : "aguarde cartas de sets."}
          </p>
          {canAddSets ? (
            <div className="mt-6">
              <ButtonLink href="/cards?buscar=1">Buscar coleção</ButtonLink>
            </div>
          ) : null}
        </section>
      ) : album ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-3xl tracking-tight">{album.name}</h2>
              <p className="mt-1 text-sm text-muted">
                {album.ownedSlots}/{album.total} distintas
                {album.estimatedValue ? ` · ${formatMoney(album.estimatedValue)}` : ""}
              </p>
            </div>
            {album.logo ? (
              <CatalogImg
                key={album.setId}
                src={album.logo}
                className="h-16 w-28 object-contain"
                fallback={<span className="text-xs text-muted">{album.setId}</span>}
              />
            ) : null}
          </div>
          <AlbumBoard album={album} language={language} manage />
        </div>
      ) : activeId ? (
        <p className="rounded-3xl border border-dashed border-line bg-card/70 px-6 py-12 text-center text-sm text-muted">
          Não foi possível carregar o catálogo desta coleção.{" "}
          {canAddSets ? (
            <Link href="/cards?buscar=1" className="text-navy hover:underline">
              Busque a coleção no catálogo
            </Link>
          ) : (
            "Confira o código do set com o administrador."
          )}
        </p>
      ) : (
        <p className="rounded-3xl border border-dashed border-line bg-card/70 px-6 py-12 text-center text-sm text-muted">
          Selecione uma coleção nas abas.
        </p>
      )}
    </div>
  );
}
