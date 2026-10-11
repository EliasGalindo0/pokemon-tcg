import type { DeckListSection } from "@/lib/deck-list";

export type ParsedDeckListLine = {
  section: DeckListSection;
  quantity: number;
  name: string;
  setCode?: string;
  cardNumber?: string;
  raw: string;
};

export type ParseDeckListResult = {
  lines: ParsedDeckListLine[];
  warnings: string[];
};

const SECTION_ALIASES: Record<string, DeckListSection> = {
  pokemon: "Pokémon",
  pokémon: "Pokémon",
  treinador: "Treinador",
  trainer: "Treinador",
  estádio: "Estádio",
  estadio: "Estádio",
  stadium: "Estádio",
  energia: "Energia",
  energy: "Energia",
};

const SECTION_HEADER =
  /^(pok[eé]mon|treinador|trainer|est[aá]dio|stadium|energia|energy)\s*(?:[:(]\s*(\d+)\s*\)?|:?\s*(\d+)\s*)?$/i;

const TOTAL_LINE = /^total\b/i;

/** Limitless play site: `4 N's Zorua (JTG-97)` */
const LIMITLESS_PAREN =
  /^(\d{1,2})\s+(.+?)\s+\(([A-Za-z][A-Za-z0-9.]{1,8})-(\d{1,4}[A-Za-z]?)\)\s*$/;

/** Limitless-style: `4 Zorua do N JTG 97` */
const LIMITLESS_CARD =
  /^(\d{1,2})\s+(.+?)\s+([A-Za-z][A-Za-z0-9]{1,5})\s+(\d{1,4}[A-Za-z]?)\s*$/;

/** Our export: `4 Zorua do N` */
const SIMPLE_CARD = /^(\d{1,2})\s+(.+?)\s*$/;

function sectionFromHeader(line: string): DeckListSection | null {
  const match = line.trim().match(SECTION_HEADER);
  if (!match) return null;
  const key = match[1].toLowerCase();
  return SECTION_ALIASES[key] ?? null;
}

function parseCardLine(
  line: string,
  section: DeckListSection,
): ParsedDeckListLine | { error: string } {
  const paren = line.match(LIMITLESS_PAREN);
  if (paren) {
    const quantity = Number(paren[1]);
    const name = paren[2].trim();
    const setCode = paren[3].trim();
    const cardNumber = paren[4].trim();
    if (!name) return { error: "Nome da carta ausente." };
    if (!Number.isFinite(quantity) || quantity < 1 || quantity > 60) {
      return { error: "Quantidade inválida." };
    }
    return { section, quantity, name, setCode, cardNumber, raw: line };
  }

  const limitless = line.match(LIMITLESS_CARD);
  if (limitless) {
    const quantity = Number(limitless[1]);
    const name = limitless[2].trim();
    const setCode = limitless[3].trim();
    const cardNumber = limitless[4].trim();
    if (!name) return { error: "Nome da carta ausente." };
    if (!Number.isFinite(quantity) || quantity < 1 || quantity > 60) {
      return { error: "Quantidade inválida." };
    }
    return { section, quantity, name, setCode, cardNumber, raw: line };
  }

  const simple = line.match(SIMPLE_CARD);
  if (simple) {
    const quantity = Number(simple[1]);
    const name = simple[2].trim();
    if (!name) return { error: "Nome da carta ausente." };
    if (!Number.isFinite(quantity) || quantity < 1 || quantity > 60) {
      return { error: "Quantidade inválida." };
    }
    return { section, quantity, name, raw: line };
  }

  return { error: "Linha não reconhecida." };
}

export function parseDeckListText(text: string): ParseDeckListResult {
  const warnings: string[] = [];
  const lines: ParsedDeckListLine[] = [];
  let section: DeckListSection = "Pokémon";

  const rows = text.replace(/\r\n/g, "\n").split("\n");
  for (const raw of rows) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith("#")) continue;

    const firstLineTitle = lines.length === 0 && !SECTION_HEADER.test(line) && !LIMITLESS_CARD.test(line) && !SIMPLE_CARD.test(line);
    if (firstLineTitle && !line.includes(":") && line.length <= 80) {
      continue;
    }

    if (TOTAL_LINE.test(line)) continue;

    const headerSection = sectionFromHeader(line);
    if (headerSection) {
      section = headerSection;
      continue;
    }

    const parsed = parseCardLine(line, section);
    if ("error" in parsed) {
      warnings.push(`${parsed.error} (${line.slice(0, 60)}${line.length > 60 ? "…" : ""})`);
      continue;
    }
    lines.push(parsed);
  }

  return { lines, warnings };
}
