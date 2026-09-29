import type { Metadata } from "next";
import Link from "next/link";
import { CatalogImg } from "@/components/cards/catalog-img";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { requireAdminPage } from "@/lib/auth-page";
import { LANGUAGE_LABEL, LANGUAGES } from "@/lib/labels";
import { albumLanguage, searchAlbumSets } from "@/services/album";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Álbum",
};

export default async function AlbumPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; language?: string }>;
}) {
  await requireAdminPage("/album");
  const raw = await searchParams;
  const query = raw.q?.trim() ?? "";
  const language = albumLanguage(raw.language);
  const sets = query.length >= 2 ? await searchAlbumSets(query, language) : [];

  return (
    <div className="space-y-8">
      <PageHeader
        kicker="Coleções"
        title="Álbum"
        description="Escolha uma coleção para ver todas as cartas. As que você ainda não tem aparecem apagadas, como num álbum de figurinhas."
      />

      <form className="flex flex-wrap items-end gap-3" action="/album">
        <label className="min-w-64 flex-1 text-sm">
          <span className="mb-1 block text-muted">Coleção</span>
          <input
            name="q"
            defaultValue={query}
            placeholder="Fogo Fantasmagórico"
            className="w-full rounded-2xl border border-line bg-card px-4 py-2.5 outline-none ring-navy/30 focus:ring-2"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-muted">Idioma</span>
          <select
            name="language"
            defaultValue={language}
            className="rounded-2xl border border-line bg-card px-4 py-2.5 outline-none ring-navy/30 focus:ring-2"
          >
            {LANGUAGES.map((item) => (
              <option key={item} value={item}>
                {LANGUAGE_LABEL[item]}
              </option>
            ))}
          </select>
        </label>
        <Button type="submit" variant="secondary">
          Buscar
        </Button>
      </form>

      {query.length < 2 ? (
        <p className="text-sm text-muted">Digite pelo menos duas letras do nome da coleção.</p>
      ) : sets.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-line bg-card/70 px-6 py-12 text-center text-sm text-muted">
          Nenhuma coleção encontrada para “{query}”.
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {sets.map((set) => (
            <li key={set.id}>
              <Link
                href={`/album/${set.id}?language=${language}`}
                className="flex items-center gap-4 rounded-3xl border border-line bg-card p-4 transition hover:border-navy/30"
              >
                {set.logo ? (
                  <CatalogImg
                    src={set.logo}
                    className="h-14 w-24 object-contain"
                    fallback={
                      <span className="grid h-14 w-24 place-items-center rounded-2xl bg-paper text-xs text-muted">
                        {set.id}
                      </span>
                    }
                  />
                ) : (
                  <span className="grid h-14 w-24 place-items-center rounded-2xl bg-paper text-xs text-muted">
                    {set.id}
                  </span>
                )}
                <span>
                  <span className="block font-medium">{set.name}</span>
                  <span className="text-sm text-muted">
                    {set.total || set.official} cartas
                    {set.official ? ` · ${set.official} oficiais` : ""}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
