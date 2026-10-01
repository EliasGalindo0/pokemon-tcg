import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlbumBoard } from "@/components/album/album-board";
import { CollectionCatalogSearch } from "@/components/cards/collection-catalog-search";
import { CatalogImg } from "@/components/cards/catalog-img";
import { MyCollectionTabs } from "@/components/cards/my-collection-tabs";
import { PageHeader } from "@/components/layout/page-header";
import { ButtonLink } from "@/components/ui/button";
import { requireUserPage } from "@/lib/auth-page";
import { isAdmin } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { NAV_COLLECTIONS, PAGE_MY_COLLECTION } from "@/lib/site-copy";
import { albumLanguage, getAlbum } from "@/services/album";
import { listPromoCards } from "@/services/cards";
import { listPlayerCards } from "@/services/player-cards";
import { listSets } from "@/services/sets";
import type { AlbumView } from "@/types/album";
import { isSpecialCollectionTab, TAB_PROMOS } from "@/types/player-card";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export const metadata: Metadata = {
  title: PAGE_MY_COLLECTION,
};

export default async function MyCollectionPage({
  searchParams,
}: {
  searchParams: Promise<{
    tab?: string;
    language?: string;
    buscar?: string;
    q?: string;
    catalog?: string;
  }>;
}) {
  const user = await requireUserPage("/cards");
  const admin = await isAdmin();
  const raw = await searchParams;
  const language = albumLanguage(raw.language);

  if (raw.catalog && admin) {
    let album;
    try {
      album = await getAlbum(user.id, raw.catalog, language);
    } catch (error) {
      if (error instanceof AppError && (error.status === 404 || error.status === 400)) notFound();
      throw error;
    }
    return (
      <div className="space-y-6">
        <Link
          href={`/cards?buscar=1&language=${language}`}
          className="text-sm text-navy hover:underline"
        >
          ← Buscar outra coleção
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl tracking-tight">{album.name}</h1>
            <p className="mt-1 text-sm text-muted">
              Marque as cartas que você tem — elas aparecem nas abas de Minha coleção.
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
        <AlbumBoard album={album} language={language} />
      </div>
    );
  }

  if (raw.catalog && !admin) {
    notFound();
  }

  const [sets, promoCards, playerCards] = await Promise.all([
    listSets(user.id),
    listPromoCards(user.id),
    listPlayerCards(user.id),
  ]);

  const tab = raw.tab;
  const activeId = isSpecialCollectionTab(tab)
    ? tab
    : tab && sets.some((set) => set.id === tab)
      ? tab
      : (sets[0]?.id ?? TAB_PROMOS);

  const activeSet = !isSpecialCollectionTab(activeId)
    ? (sets.find((set) => set.id === activeId) ?? null)
    : null;

  let album: AlbumView | null = null;
  if (activeSet?.code) {
    try {
      album = await getAlbum(user.id, activeSet.code, language);
    } catch {
      album = null;
    }
  }

  const publicCount = sets.filter((set) => set.isPublic).length;
  const showSearch = admin && raw.buscar === "1";

  return (
    <div className="space-y-8">
      <PageHeader
        kicker="Suas cartas"
        title={PAGE_MY_COLLECTION}
        description="Sets, promoções e cartas de jogador em abas. O que for público aparece em Coleções."
      >
        {admin ? (
          <div className="flex flex-wrap gap-2">
            <ButtonLink href="/cards?buscar=1" variant="secondary">
              Buscar coleção
            </ButtonLink>
            <ButtonLink href="/cards/new">Nova carta</ButtonLink>
          </div>
        ) : null}
      </PageHeader>

      <p className="text-sm text-muted">
        {publicCount > 0 ? (
          <>
            {publicCount} {publicCount === 1 ? "coleção pública" : "coleções públicas"} em{" "}
            <Link href="/galeria" className="text-navy hover:underline">
              {NAV_COLLECTIONS}
            </Link>
            . Visibilidade em{" "}
            <Link href="/conta" className="text-navy hover:underline">
              Conta
            </Link>
            .
          </>
        ) : (
          <>
            Nada público ainda. Em{" "}
            <Link href="/conta" className="text-navy hover:underline">
              Conta
            </Link>{" "}
            você libera sets para{" "}
            <Link href="/galeria" className="text-navy hover:underline">
              {NAV_COLLECTIONS}
            </Link>
            .
          </>
        )}
      </p>

      {showSearch ? <CollectionCatalogSearch query={raw.q ?? ""} language={language} /> : null}

      <MyCollectionTabs
        sets={sets}
        activeId={activeId}
        album={album}
        language={language}
        canAddSets={admin}
        showSearchLink={admin && !showSearch}
        promoCards={promoCards}
        playerCards={playerCards}
      />
    </div>
  );
}
