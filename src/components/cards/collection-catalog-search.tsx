import Link from "next/link";
import { CatalogImg } from "@/components/cards/catalog-img";
import { Button } from "@/components/ui/button";
import { LANGUAGE_LABEL, LANGUAGES } from "@/lib/labels";
import { albumLanguage, searchAlbumSets } from "@/services/album";

export async function CollectionCatalogSearch({
  query,
  language: languageRaw,
}: {
  query: string;
  language?: string;
}) {
  const language = albumLanguage(languageRaw);
  const trimmed = query.trim();
  const sets = trimmed.length >= 2 ? await searchAlbumSets(trimmed, language) : [];

  return (
    <section className="space-y-4 rounded-3xl border border-line bg-card p-5">
      <div>
        <h2 className="font-display text-2xl">Buscar coleção no catálogo</h2>
        <p className="mt-1 text-sm text-muted">
          Encontre um set oficial, marque as cartas que você tem e elas entram em Minha coleção.
        </p>
      </div>

      <form className="flex flex-wrap items-end gap-3" action="/cards" method="get">
        <input type="hidden" name="buscar" value="1" />
        <label className="min-w-64 flex-1 text-sm">
          <span className="mb-1 block text-muted">Nome da coleção</span>
          <input
            name="q"
            defaultValue={trimmed}
            placeholder="Fogo Fantasmagórico"
            className="w-full rounded-2xl border border-line bg-paper px-4 py-2.5 outline-none ring-navy/30 focus:ring-2"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-muted">Idioma</span>
          <select
            name="language"
            defaultValue={language}
            className="rounded-2xl border border-line bg-paper px-4 py-2.5 outline-none ring-navy/30 focus:ring-2"
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

      {trimmed.length > 0 && trimmed.length < 2 ? (
        <p className="text-sm text-muted">Digite pelo menos duas letras.</p>
      ) : null}

      {trimmed.length >= 2 && sets.length === 0 ? (
        <p className="text-sm text-muted">Nenhuma coleção encontrada para “{trimmed}”.</p>
      ) : null}

      {sets.length > 0 ? (
        <ul className="grid gap-3 sm:grid-cols-2">
          {sets.map((set) => (
            <li key={set.id}>
              <Link
                href={`/cards?catalog=${encodeURIComponent(set.id)}&language=${language}`}
                className="flex items-center gap-4 rounded-2xl border border-line bg-paper p-4 transition hover:border-navy/30"
              >
                {set.logo ? (
                  <CatalogImg
                    src={set.logo}
                    className="h-14 w-24 object-contain"
                    fallback={
                      <span className="grid h-14 w-24 place-items-center rounded-2xl bg-card text-xs text-muted">
                        {set.id}
                      </span>
                    }
                  />
                ) : (
                  <span className="grid h-14 w-24 place-items-center rounded-2xl bg-card text-xs text-muted">
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
      ) : null}
    </section>
  );
}
