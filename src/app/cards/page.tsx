import type { Metadata } from "next";
import Link from "next/link";
import { MyCollectionTabs } from "@/components/cards/my-collection-tabs";
import { PageHeader } from "@/components/layout/page-header";
import { ButtonLink } from "@/components/ui/button";
import { requireUserPage } from "@/lib/auth-page";
import { isAdmin } from "@/lib/auth";
import { albumLanguage, getAlbum } from "@/services/album";
import { listSets } from "@/services/sets";
import type { AlbumView } from "@/types/album";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export const metadata: Metadata = {
  title: "Minha galeria",
};

export default async function GalleryPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; language?: string }>;
}) {
  const user = await requireUserPage("/cards");
  const admin = await isAdmin();
  const raw = await searchParams;
  const language = albumLanguage(raw.language);
  const sets = await listSets(user.id);
  const activeId = raw.tab && sets.some((set) => set.id === raw.tab) ? raw.tab : (sets[0]?.id ?? null);
  const activeSet = sets.find((set) => set.id === activeId) ?? null;

  let album: AlbumView | null = null;
  if (activeSet?.code) {
    try {
      album = await getAlbum(user.id, activeSet.code, language);
    } catch {
      album = null;
    }
  }

  const publicCount = sets.filter((set) => set.isPublic).length;

  return (
    <div className="space-y-8">
      <PageHeader
        kicker="Coleção"
        title="Minha galeria"
        description="Suas coleções em abas: o que você tem, o que falta, quantidades e valores."
      >
        <div className="flex flex-wrap gap-2">
          {admin ? (
            <>
              <ButtonLink href="/album" variant="secondary">
                Buscar coleção
              </ButtonLink>
              <ButtonLink href="/cards/new">Nova carta</ButtonLink>
            </>
          ) : null}
          <ButtonLink href="/conta" variant="secondary">
            Privacidade
          </ButtonLink>
        </div>
      </PageHeader>

      <p className="text-sm text-muted">
        {publicCount > 0 ? (
          <>
            {publicCount} {publicCount === 1 ? "coleção pública" : "coleções públicas"} em{" "}
            <Link href="/galeria" className="text-navy hover:underline">
              Galerias públicas
            </Link>
            . Ajuste em{" "}
            <Link href="/conta" className="text-navy hover:underline">
              Conta
            </Link>
            .
          </>
        ) : (
          <>
            Visitantes não veem suas cartas. Em{" "}
            <Link href="/conta" className="text-navy hover:underline">
              Conta
            </Link>{" "}
            você libera sets individuais para as{" "}
            <Link href="/galeria" className="text-navy hover:underline">
              Galerias públicas
            </Link>
            .
          </>
        )}
      </p>

      <MyCollectionTabs
        sets={sets}
        activeId={activeId}
        album={album}
        language={language}
        canAddSets={admin}
      />
    </div>
  );
}
