import type { DeckEntryDTO } from "@/types/deck";

export type DeckListSection = "Pokémon" | "Treinador" | "Estádio" | "Energia";

export type DeckListLine = {
  section: DeckListSection;
  quantity: number;
  name: string;
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
