import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlbumBoard } from "@/components/album/album-board";
import { AppError } from "@/lib/errors";
import { albumLanguage, getAlbum } from "@/services/album";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ setId: string }>;
  searchParams: Promise<{ language?: string }>;
}): Promise<Metadata> {
  const { setId } = await params;
  const { language } = await searchParams;
  try {
    const album = await getAlbum(setId, albumLanguage(language));
    return { title: album.name };
  } catch {
    return { title: "Álbum" };
  }
}

export default async function AlbumSetPage({
  params,
  searchParams,
}: {
  params: Promise<{ setId: string }>;
  searchParams: Promise<{ language?: string }>;
}) {
  const { setId } = await params;
  const { language: languageRaw } = await searchParams;
  const language = albumLanguage(languageRaw);

  let album;
  try {
    album = await getAlbum(setId, language);
  } catch (error) {
    if (error instanceof AppError && (error.status === 404 || error.status === 400)) notFound();
    throw error;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link href={`/album?language=${language}`} className="text-sm text-navy hover:underline">
            Todas as coleções
          </Link>
          <h1 className="mt-1 font-display text-4xl tracking-tight">{album.name}</h1>
        </div>
        {album.logo ? <img src={album.logo} alt="" className="h-16 w-28 object-contain" /> : null}
      </div>
      <AlbumBoard album={album} language={language} />
    </div>
  );
}
