import type { DeckEntryDTO } from "@/types/deck";

export type DeckListSection = "Pokémon" | "Treinador" | "Estádio" | "Energia";

export type DeckListLine = {
  section: DeckListSection;
  quantity: number;
  name: string;
};

export type ParsedDeckListLine = {
  raw: string;
  quantity: number;
  name: string;
  setCode: string | null;
  cardNumber: string | null;
  section: DeckListSection | null;
};

export type ParsedDeckList = {
  name: string | null;
  lines: ParsedDeckListLine[];
};

const SECTION_ORDER: DeckListSection[] = ["Pokémon", "Treinador", "Estádio", "Energia"];

export function classifyDeckCard(
  name: string,
  category?: string | null,
  trainerType?: string | null,
): DeckListSection {
  const cat = (category ?? "").trim().toLowerCase();
  const type = (trainerType ?? "").trim().toLowerCase();
  const n = name.trim().toLowerCase();

  if (
    cat.includes("energy") ||
    cat.includes("energia") ||
    /^energia\b/.test(n) ||
    /\benergy\b/.test(n)
  ) {
    return "Energia";
  }

  if (
    type.includes("stadium") ||
    type.includes("estádio") ||
    type.includes("estadio") ||
    /^est[aá]dio\b/.test(n) ||
    /^stadium\b/.test(n)
  ) {
    return "Estádio";
  }

  if (cat.includes("trainer") || cat.includes("treinador")) {
    return "Treinador";
  }

  if (cat.includes("pokemon") || cat.includes("pokémon")) {
    return "Pokémon";
  }

  // Heurística sem metadados do catálogo
  if (/^energia\b/.test(n)) return "Energia";
  if (/^est[aá]dio\b/.test(n)) return "Estádio";
  return "Pokémon";
}

export function formatDeckList(
  deckName: string,
  lines: DeckListLine[],
): string {
  const grouped = new Map<DeckListSection, DeckListLine[]>();
  for (const section of SECTION_ORDER) grouped.set(section, []);

  for (const line of lines) {
    grouped.get(line.section)?.push(line);
  }

  const blocks: string[] = [deckName, ""];
  for (const section of SECTION_ORDER) {
    const items = grouped.get(section) ?? [];
    if (items.length === 0) continue;
    const sorted = [...items].sort((a, b) => a.name.localeCompare(b.name, "pt"));
    const total = sorted.reduce((sum, item) => sum + item.quantity, 0);
    blocks.push(`${section} (${total})`);
    for (const item of sorted) {
      blocks.push(`${item.quantity} ${item.name}`);
    }
    blocks.push("");
  }

  return blocks.join("\n").trimEnd();
}

export function deckEntriesToListLines(
  entries: Array<
    Pick<DeckEntryDTO, "name" | "quantity"> & {
      category?: string | null;
      trainerType?: string | null;
    }
  >,
): DeckListLine[] {
  return entries
    .filter((entry) => entry.quantity > 0 && entry.name.trim())
    .map((entry) => ({
      section: classifyDeckCard(entry.name, entry.category, entry.trainerType),
      quantity: entry.quantity,
      name: entry.name.trim(),
    }));
}

const SECTION_HEADER =
  /^(?:#{1,3}\s*)?(pok[eé]mon|treinadores?|trainers?|est[aá]dios?|stadiums?|energias?|energ(?:y|ies))\b/i;
const TOTAL_LINE = /^(?:total(?:\s+de)?\s+cartas?|total\s+cards?)\b/i;
const DECORATIVE = /^[\s*#=\-_—–]+$/;
const SKIP_WORDS = /^(de|da|do|das|dos|em|na|no|nas|nos|ex|gx|v|vmax|vstar)$/i;

function parseSectionHeader(line: string): DeckListSection | null {
  const match = line.match(SECTION_HEADER);
  if (!match) return null;
  const key = match[1].normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
  if (key.startsWith("pok")) return "Pokémon";
  if (key.startsWith("trein") || key.startsWith("train")) return "Treinador";
  if (key.startsWith("est") || key.startsWith("stad")) return "Estádio";
  if (key.startsWith("energ")) return "Energia";
  return null;
}

function looksLikeSetCode(token: string) {
  const value = token.trim();
  if (!value || SKIP_WORDS.test(value)) return false;
  if (/^[A-Za-z]{2,6}[0-9]?$/.test(value)) return true;
  if (/^[A-Za-z]{2,5}:(?:TG|GG|SV|CC)$/i.test(value)) return true;
  if (/^[A-Za-z]\d[A-Za-z]?$/.test(value)) return true;
  return false;
}

function looksLikeCardNumber(token: string) {
  return /^(?:\d{1,4}[A-Za-z]?|[A-Za-z]{1,6}\d{1,4}[A-Za-z]?)$/.test(token.trim());
}

function parseCardLine(raw: string): Omit<ParsedDeckListLine, "section"> | null {
  const line = raw.replace(/^\*\s+/, "").replace(/\s+\((?:PH|RH|Holofoil|Reverse)\)$/i, "").trim();
  const qtyMatch = line.match(/^(\d+)\s+(.+)$/);
  if (!qtyMatch) return null;

  const quantity = Number(qtyMatch[1]);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) return null;

  const rest = qtyMatch[2].trim();
  const withParens = rest.match(/^(.+?)\s+\(([A-Za-z][A-Za-z0-9:-]{1,8})\s+(\d{1,4}[A-Za-z]?)\)$/);
  if (withParens && looksLikeSetCode(withParens[2])) {
    return {
      raw,
      quantity,
      name: withParens[1].trim(),
      setCode: withParens[2].toUpperCase(),
      cardNumber: withParens[3],
    };
  }

  const tokens = rest.split(/\s+/);
  if (tokens.length >= 2) {
    const number = tokens[tokens.length - 1] ?? "";
    const setCode = tokens[tokens.length - 2] ?? "";
    if (looksLikeCardNumber(number) && looksLikeSetCode(setCode) && tokens.length >= 3) {
      const name = tokens.slice(0, -2).join(" ").trim();
      if (name) {
        return { raw, quantity, name, setCode: setCode.toUpperCase(), cardNumber: number };
      }
    }
    if (looksLikeCardNumber(number) && !looksLikeSetCode(setCode)) {
      const name = tokens.slice(0, -1).join(" ").trim();
      if (name) {
        return { raw, quantity, name, setCode: null, cardNumber: number };
      }
    }
  }

  if (rest) return { raw, quantity, name: rest, setCode: null, cardNumber: null };
  return null;
}

export function normalizeCardName(name: string) {
  return name
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/['’`]/g, "")
    .replace(/\b(n'?s|do n)\b/g, " ")
    .replace(/\b(basica|basic)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function cardNamesMatch(left: string, right: string) {
  const a = normalizeCardName(left);
  const b = normalizeCardName(right);
  if (!a || !b) return false;
  if (a === b) return true;
  if (a.includes(b) || b.includes(a)) return true;
  const sa = new Set(a.split(" "));
  const sb = new Set(b.split(" "));
  let overlap = 0;
  for (const token of sa) if (sb.has(token)) overlap += 1;
  const min = Math.min(sa.size, sb.size);
  return min > 0 && overlap / min >= 0.75;
}

const NAME_STOP = new Set(["de", "da", "do", "das", "dos", "the", "of", "a", "o", "e", "and"]);

function significantTokens(name: string) {
  return new Set(
    normalizeCardName(name)
      .split(" ")
      .filter((token) => token.length > 1 && !NAME_STOP.has(token)),
  );
}

function editDistance(left: string, right: string) {
  if (left === right) return 0;
  const rows = left.length + 1;
  const cols = right.length + 1;
  const grid = Array.from({ length: rows }, (_, i) => {
    const row = new Array<number>(cols);
    row[0] = i;
    return row;
  });
  for (let j = 0; j < cols; j += 1) grid[0][j] = j;
  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      const cost = left[i - 1] === right[j - 1] ? 0 : 1;
      grid[i][j] = Math.min(grid[i - 1][j] + 1, grid[i][j - 1] + 1, grid[i - 1][j - 1] + cost);
    }
  }
  return grid[left.length][right.length];
}

/** Looser than `cardNamesMatch` — used when set + number already agree. */
export function namesCompatible(left: string, right: string) {
  if (cardNamesMatch(left, right)) return true;
  const sa = significantTokens(left);
  const sb = significantTokens(right);
  if (sa.size === 0 || sb.size === 0) return false;

  let overlap = 0;
  let fuzzy = 0;
  for (const token of sa) {
    if (sb.has(token)) {
      overlap += 1;
      continue;
    }
    for (const other of sb) {
      if (Math.min(token.length, other.length) >= 4 && editDistance(token, other) <= 2) {
        fuzzy += 1;
        break;
      }
    }
  }

  return (overlap + fuzzy) / Math.min(sa.size, sb.size) >= 0.5;
}

export function parseDeckList(text: string): ParsedDeckList {
  const lines: ParsedDeckListLine[] = [];
  let name: string | null = null;
  let section: DeckListSection | null = null;
  let seenCard = false;

  for (const raw of text.replace(/^\uFEFF/, "").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || DECORATIVE.test(line) || TOTAL_LINE.test(line)) continue;

    const startsAsCard = /^\d/.test(line) || /^\*\s+\d/.test(line);
    if (startsAsCard) {
      const card = parseCardLine(line);
      if (card) {
        seenCard = true;
        lines.push({
          ...card,
          section: section ?? classifyDeckCard(card.name),
        });
        continue;
      }
    }

    const header = parseSectionHeader(line);
    if (header) {
      section = header;
      continue;
    }

    if (!startsAsCard) {
      const card = parseCardLine(line);
      if (card) {
        seenCard = true;
        lines.push({
          ...card,
          section: section ?? classifyDeckCard(card.name),
        });
        continue;
      }
    }

    if (!seenCard && !name && line.length <= 80) name = line;
  }

  return { name, lines };
}

export function inferDeckName(lines: ParsedDeckListLine[]) {
  const pokemon = lines.filter((line) => (line.section ?? classifyDeckCard(line.name)) === "Pokémon");
  const pool = pokemon.length > 0 ? pokemon : lines;
  const ace = pool.find((line) => /\b(ex|gx|vstar|vmax)\b/i.test(line.name));
  if (ace) return ace.name;
  return [...pool].sort((a, b) => b.quantity - a.quantity)[0]?.name ?? "Deck importado";
}
