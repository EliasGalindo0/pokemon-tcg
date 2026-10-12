import { localNumber } from "@/lib/card-number";
import { limitlessAbbrevForSetId } from "@/lib/pokemon-set-codes";
import type { DeckEntryDTO } from "@/types/deck";

export type DeckListSection = "Pokémon" | "Treinador" | "Estádio" | "Energia";

export type DeckListLine = {
  section: DeckListSection;
  quantity: number;
  name: string;
  setCode?: string;
  cardNumber?: string;
  trainerType?: string | null;
};

type OutputSection = "Pokémon" | "Treinador" | "Energia";

const OUTPUT_SECTIONS: OutputSection[] = ["Pokémon", "Treinador", "Energia"];

const BASIC_ENERGY: Array<[RegExp, string]> = [
  [/^(?:energia(?:\s+de)?\s+grama|basic\s+grass\s+energy|grass\s+energy)(?:\s+b[aá]sica)?$/i, "G"],
  [/^(?:energia(?:\s+de)?\s+fogo|basic\s+fire\s+energy|fire\s+energy)(?:\s+b[aá]sica)?$/i, "R"],
  [/^(?:energia(?:\s+de)?\s+[aá]gua|basic\s+water\s+energy|water\s+energy)(?:\s+b[aá]sica)?$/i, "W"],
  [/^(?:energia(?:\s+de)?\s+raios?|basic\s+lightning\s+energy|lightning\s+energy)(?:\s+b[aá]sica)?$/i, "L"],
  [
    /^(?:energia\s+ps[ií]quica|energia(?:\s+de)?\s+ps[ií]quic[oa]|basic\s+psychic\s+energy|psychic\s+energy)(?:\s+b[aá]sica)?$/i,
    "P",
  ],
  [/^(?:energia(?:\s+de)?\s+luta|basic\s+fighting\s+energy|fighting\s+energy)(?:\s+b[aá]sica)?$/i, "F"],
  [
    /^(?:energia(?:\s+de)?\s+escurid[aã]o|basic\s+darkness\s+energy|darkness\s+energy)(?:\s+b[aá]sica)?$/i,
    "D",
  ],
  [/^(?:energia(?:\s+de)?\s+metal|basic\s+metal\s+energy|metal\s+energy)(?:\s+b[aá]sica)?$/i, "M"],
  [/^(?:energia(?:\s+de)?\s+fada|basic\s+fairy\s+energy|fairy\s+energy)(?:\s+b[aá]sica)?$/i, "Y"],
  [
    /^(?:energia(?:\s+de)?\s+incolor|basic\s+colorless\s+energy|colorless\s+energy)(?:\s+b[aá]sica)?$/i,
    "C",
  ],
];

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

function outputSection(section: DeckListSection): OutputSection {
  if (section === "Pokémon") return "Pokémon";
  if (section === "Energia") return "Energia";
  return "Treinador";
}

function trainerGroup(line: DeckListLine): number {
  const type = (line.trainerType ?? "").trim().toLowerCase();
  if (
    line.section === "Estádio" ||
    type.includes("stadium") ||
    type.includes("estádio") ||
    type.includes("estadio")
  ) {
    return 3;
  }
  if (type.includes("tool") || type.includes("ferramenta")) return 2;
  if (type.includes("supporter") || type.includes("apoiador")) return 0;
  if (type.includes("item")) return 1;
  return 4;
}

function compareDeckListLines(section: OutputSection, a: DeckListLine, b: DeckListLine): number {
  if (section === "Treinador") {
    const group = trainerGroup(a) - trainerGroup(b);
    if (group !== 0) return group;
  }
  if (a.quantity !== b.quantity) return b.quantity - a.quantity;
  return a.name.localeCompare(b.name, "pt");
}

/** `Energia de Escuridão` → `Energia {D} Básica`. Other names stay as stored. */
export function formatBasicEnergyName(name: string): string {
  const trimmed = name.trim().replace(/\s+/g, " ");
  const already = trimmed.match(/^energia\s+\{([a-z])\}\s+b[aá]sica$/i);
  if (already) return `Energia {${already[1].toUpperCase()}} Básica`;
  for (const [pattern, symbol] of BASIC_ENERGY) {
    if (pattern.test(trimmed)) return `Energia {${symbol}} Básica`;
  }
  return trimmed;
}

export function deckListPrinting(
  tcgId: string | null | undefined,
  setId: string | null | undefined,
  cardNumber: string | null | undefined,
): { setCode?: string; cardNumber?: string } {
  let parsedSet = "";
  let parsedLocal = "";
  const id = tcgId?.trim() ?? "";
  const dash = id.lastIndexOf("-");
  if (dash > 0) {
    parsedSet = id.slice(0, dash);
    parsedLocal = id.slice(dash + 1);
  }

  const setCode = limitlessAbbrevForSetId(parsedSet) ?? limitlessAbbrevForSetId(setId ?? "") ?? undefined;
  const number = localNumber(parsedLocal || cardNumber || "");
  return {
    setCode,
    cardNumber: number || undefined,
  };
}

function formatDeckListCardLine(item: DeckListLine): string {
  const name = item.section === "Energia" ? formatBasicEnergyName(item.name) : item.name.trim();
  const parts = [String(item.quantity), name];
  if (item.setCode) parts.push(item.setCode);
  if (item.cardNumber) parts.push(item.cardNumber);
  return parts.join(" ");
}

export function formatDeckList(lines: DeckListLine[]): string {
  const grouped = new Map<OutputSection, DeckListLine[]>();
  for (const section of OUTPUT_SECTIONS) grouped.set(section, []);

  for (const line of lines) {
    grouped.get(outputSection(line.section))?.push(line);
  }

  const blocks: string[] = [];
  let total = 0;
  for (const section of OUTPUT_SECTIONS) {
    const items = grouped.get(section) ?? [];
    if (items.length === 0) continue;
    const sorted = [...items].sort((a, b) => compareDeckListLines(section, a, b));
    blocks.push(`${section}: ${sorted.length}`);
    for (const item of sorted) {
      total += item.quantity;
      blocks.push(formatDeckListCardLine(item));
    }
    blocks.push("");
  }

  blocks.push(`Total de Cartas: ${total}`);
  return blocks.join("\n").trimEnd();
}

export function deckEntriesToListLines(
  entries: Array<
    Pick<DeckEntryDTO, "name" | "quantity"> & {
      category?: string | null;
      trainerType?: string | null;
      setCode?: string | null;
      cardNumber?: string | null;
    }
  >,
): DeckListLine[] {
  return entries
    .filter((entry) => entry.quantity > 0 && entry.name.trim())
    .map((entry) => ({
      section: classifyDeckCard(entry.name, entry.category, entry.trainerType),
      quantity: entry.quantity,
      name: entry.name.trim(),
      setCode: entry.setCode?.trim() || undefined,
      cardNumber: entry.cardNumber?.trim() || undefined,
      trainerType: entry.trainerType,
    }));
}
