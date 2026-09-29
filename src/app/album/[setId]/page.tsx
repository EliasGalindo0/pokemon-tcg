import { redirect } from "next/navigation";
import { requireAdminPage } from "@/lib/auth-page";
import { albumLanguage } from "@/services/album";

export const dynamic = "force-dynamic";

/** Legado: catálogo de set agora em /cards?catalog= */
export default async function AlbumSetRedirectPage({
  params,
  searchParams,
}: {
  params: Promise<{ setId: string }>;
  searchParams: Promise<{ language?: string }>;
}) {
  const { setId } = await params;
  const { language: languageRaw } = await searchParams;
  await requireAdminPage(`/album/${setId}`);
  const language = albumLanguage(languageRaw);
  const paramsOut = new URLSearchParams({
    catalog: setId,
    language,
  });
  redirect(`/cards?${paramsOut.toString()}`);
}
