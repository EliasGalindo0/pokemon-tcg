"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlbumBoard } from "@/components/album/album-board";
import { CatalogImg } from "@/components/cards/catalog-img";
import { formatMoney } from "@/lib/format";
import type { AlbumView } from "@/types/album";
import { TAB_PROMOS } from "@/types/player-card";

export type PromoSeriesOption = {
  id: string;
  name: string;
  ownedSlots?: number;
  total?: number;
};

export function PromoCollectionPanel({
  album,
  series,
  activeSeriesId,
  language,
}: {
  album: AlbumView | null;
  series: PromoSeriesOption[];
  activeSeriesId: string | null;
  language: string;
}) {
  const router = useRouter();

  function goSeries(id: string) {
    router.push(`/cards?tab=${TAB_PROMOS}&promo=${id}&language=${language}`);
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-3xl tracking-tight">Promos</h2>
        <p className="mt-1 text-sm text-muted">
          Grade completa da série: as que faltam ficam apagadas — clique para marcar as que você tem.
        </p>
      </div>

      {series.length > 0 ? (
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Séries promocionais">
          {series.map((item) => {
            const selected = item.id === activeSeriesId;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => goSeries(item.id)}
                className={`rounded-full px-3 py-1.5 text-sm transition ${
                  selected ? "bg-navy text-paper" : "bg-card text-ink hover:bg-white"
                }`}
              >
                {item.name}
                {typeof item.ownedSlots === "number" && typeof item.total === "number" ? (
                  <span className="ml-1.5 text-xs opacity-70">
                    · {item.ownedSlots}/{item.total}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}

      {album ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h3 className="font-display text-2xl tracking-tight">{album.name}</h3>
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
      ) : (
        <p className="rounded-3xl border border-dashed border-line bg-card/70 px-6 py-12 text-center text-sm text-muted">
          Nenhuma série promo carregada.{" "}
          <Link href={`/cards?tab=${TAB_PROMOS}&promo=mep&language=${language}`} className="text-navy hover:underline">
            Abrir MEP Black Star Promos
          </Link>
          {" · "}
          <Link href={`/cards?tab=${TAB_PROMOS}&promo=svp&language=${language}`} className="text-navy hover:underline">
            SVP
          </Link>
        </p>
      )}
    </div>
  );
}
