import { localIdSearchVariants, printedCardNumber } from "@/lib/card-number";
import { AppError } from "@/lib/errors";
import type { ParsedDeckListLine } from "@/lib/deck-list-import";
import { tcgdxSetIdForAbbrev } from "@/lib/pokemon-set-codes";
import type { LanguageValue } from "@/lib/labels";
import { fetchCatalogCard, fetchTcg, findEnergyArtwork, searchCatalog } from "@/services/catalog";
import type { CatalogHit } from "@/types/catalog";

type TcgSetDetail = {
  id?: string;
  cardCount?: { official?: number; total?: number };
  cards?: { id?: string; localId?: string | number; name?: string }[];
};

function normalizeName(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function namesMatch(wanted: string, candidate: string) {
  const a = normalizeName(wanted);
  const b = normalizeName(candidate);
  if (!a || !b) return false;
  if (a === b) return true;
  if (a.includes(b) || b.includes(a)) return true;
  const stripSuffix = (s: string) =>
    s.replace(/\s+(ex|gx|v|vmax|vstar|do n|de n)$/i, "").trim();
  const as = stripSuffix(a);
  const bs = stripSuffix(b);
  return as === bs || as.includes(bs) || bs.includes(as);
}

async function loadSet(language: LanguageValue, setId: string): Promise<TcgSetDetail | null> {
  const primary = await fetchTcg<TcgSetDetail>(language, `sets/${encodeURIComponent(setId)}`);
  if (primary?.cards?.length) return primary;
  if (language !== "EN") {
    return fetchTcg<TcgSetDetail>("EN", `sets/${encodeURIComponent(setId)}`);
  }
  return primary;
}

async function hitFromId(id: string): Promise<CatalogHit | null> {
  return (await fetchCatalogCard("PT_BR", id)) ?? (await fetchCatalogCard("EN", id));
}

async function resolveBySetAndNumber(
  setId: string,
  cardNumber: string,
  name: string,
): Promise<CatalogHit | null> {
  for (const localId of localIdSearchVariants(cardNumber)) {
    const direct = await hitFromId(`${setId}-${localId}`);
    if (direct && namesMatch(name, direct.name)) return direct;
    if (direct && !name.trim()) return direct;
  }

  const detail = (await loadSet("PT_BR", setId)) ?? (await loadSet("EN", setId));
  if (!detail?.cards?.length) return null;

  const official = detail.cardCount?.official ?? 0;
  const wantedKey = cardNumber.replace(/^0+(?=\d)/, "");

  for (const card of detail.cards) {
    if (!card.id || card.localId === undefined) continue;
    const local = String(card.localId);
    const localKey = local.replace(/^0+(?=\d)/, "");
    if (localKey === wantedKey) {
      const hit = await hitFromId(card.id);
      if (hit && namesMatch(name, hit.name)) return hit;
    }
    if (official > 0) {
      const printed = printedCardNumber(local, official).split("/")[0]?.replace(/^0+(?=\d)/, "");
      if (printed === wantedKey) {
        const hit = await hitFromId(card.id);
        if (hit && namesMatch(name, hit.name)) return hit;
      }
    }
  }

  for (const card of detail.cards) {
    if (!card.id || !card.name) continue;
    if (namesMatch(name, card.name)) {
      return hitFromId(card.id);
    }
  }

  return null;
}

async function resolveDeckListLine(line: ParsedDeckListLine): Promise<CatalogHit | null> {
  const name = line.name.trim();
  if (!name) return null;

  if (line.setCode && line.cardNumber) {
    const setId = tcgdxSetIdForAbbrev(line.setCode);
    if (setId) {
      const bySet = await resolveBySetAndNumber(setId, line.cardNumber, name);
      if (bySet) return bySet;
    }
    const guessed = await hitFromId(`${line.setCode.toLowerCase()}-${line.cardNumber}`);
    if (guessed && namesMatch(name, guessed.name)) return guessed;
  }

  const query = line.cardNumber ? `${name} ${line.cardNumber}` : name;
  const search = await searchCatalog(query, "PT_BR");
  const named = search.items.find((item) => namesMatch(name, item.name));
  if (named) return named;
  return search.items[0] ?? null;
}

export type ImportDeckLineResult = {
  line: ParsedDeckListLine;
  hit: CatalogHit | null;
};

export async function resolveDeckListLines(lines: ParsedDeckListLine[]): Promise<ImportDeckLineResult[]> {
  const results: ImportDeckLineResult[] = [];
  for (const line of lines) {
    const hit = await resolveDeckListLine(line);
    results.push({ line, hit });
  }
  return results;
}

export async function catalogHitDeckImage(hit: CatalogHit) {
  if (hit.imageUrl) return hit.imageUrl;
  return findEnergyArtwork(hit.name, hit.language);
}

export function importSummaryMessage(
  resolved: ImportDeckLineResult[],
  parseWarnings: string[],
): { message: string; unresolved: string[] } {
  const unresolved = resolved
    .filter((row) => !row.hit)
    .map((row) => row.line.raw || `${row.line.quantity} ${row.line.name}`);

  const parts: string[] = [];
  const imported = resolved.filter((row) => row.hit).length;
  if (imported > 0) parts.push(`${imported} carta(s) importada(s).`);
  if (unresolved.length > 0) {
    parts.push(`${unresolved.length} linha(s) sem correspondência no catálogo.`);
  }
  if (parseWarnings.length > 0) {
    parts.push(`${parseWarnings.length} linha(s) ignorada(s) no texto.`);
  }

  return {
    message: parts.join(" ") || "Nenhuma carta encontrada na lista.",
    unresolved,
  };
}

export function assertImportHasCards(resolved: ImportDeckLineResult[]) {
  const count = resolved.filter((row) => row.hit).length;
  if (count === 0) {
    throw new AppError("Não foi possível reconhecer nenhuma carta na lista. Confira o formato e os códigos de expansão.", 400);
  }
}
