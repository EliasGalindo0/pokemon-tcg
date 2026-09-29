"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlbumBoard } from "@/components/album/album-board";
import { CatalogImg } from "@/components/cards/catalog-img";
import { ButtonLink } from "@/components/ui/button";
import { formatMoney } from "@/lib/format";
import type { AlbumView } from "@/types/album";
import type { SetDTO } from "@/types/card";

export function MyCollectionTabs({
  sets,
  activeId,
  album,
  language,
  canAddSets,
  showSearchLink = false,
}: {
  sets: SetDTO[];
  activeId: string | null;
  album: AlbumView | null;
  language: string;
  canAddSets: boolean;
  showSearchLink?: boolean;
}) {
  const router = useRouter();

  if (sets.length === 0) {
    return (
      <section className="rounded-3xl border border-dashed border-line bg-card/70 px-6 py-16 text-center">
        <h2 className="font-display text-3xl">Nenhuma coleção cadastrada</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted">
          {canAddSets
            ? "Busque uma coleção no catálogo e marque as cartas que você tem — elas aparecem aqui em abas."
            : "Quando você receber cartas, as coleções aparecem aqui."}
        </p>
        {canAddSets ? (
          <div className="mt-6">
            <ButtonLink href="/cards?buscar=1">Buscar coleção</ButtonLink>
          </div>
        ) : null}
      </section>
    );
  }

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
                onClick={() => router.push(`/cards?tab=${set.id}&language=${language}`)}
                className={`rounded-full px-3 py-1.5 text-sm transition ${
                  selected ? "bg-navy text-paper" : "bg-card text-ink hover:bg-white"
                }`}
              >
                {set.name}
                {typeof set.cardCount === "number" ? (
                  <span className="ml-1.5 text-xs opacity-70">· {set.cardCount}</span>
                ) : null}
                {set.isPublic ? <span className="ml-1 text-[10px] uppercase opacity-70">público</span> : null}
              </button>
            );
          })}
        </div>
        {showSearchLink ? (
          <Link href="/cards?buscar=1" className="text-sm text-navy hover:underline">
            + Coleção
          </Link>
        ) : null}
      </div>

      {album ? (
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
