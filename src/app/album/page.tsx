import { redirect } from "next/navigation";
import { requireAdminPage } from "@/lib/auth-page";

export const dynamic = "force-dynamic";

/** Legado: busca de coleção agora em /cards?buscar=1 */
export default async function AlbumPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; language?: string }>;
}) {
  await requireAdminPage("/album");
  const raw = await searchParams;
  const params = new URLSearchParams();
  params.set("buscar", "1");
  if (raw.q?.trim()) params.set("q", raw.q.trim());
  if (raw.language) params.set("language", raw.language);
  redirect(`/cards?${params.toString()}`);
}
