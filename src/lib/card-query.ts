import { CONDITIONS, isOneOf, RARITIES } from "@/lib/labels";
import type { CardQuery } from "@/types/card";

const SORTS = ["name", "number", "recent"] as const;

export function parseCardQuery(params: {
  q?: string;
  setId?: string;
  rarity?: string;
  condition?: string;
  sort?: string;
  page?: string;
}): CardQuery {
  const q = params.q?.trim();
  const setId = params.setId?.trim();
  const page = Number.parseInt(params.page ?? "1", 10);
  const sort = isOneOf(SORTS, params.sort) ? params.sort : "recent";

  return {
    q: q || undefined,
    setId: setId || undefined,
    rarity: isOneOf(RARITIES, params.rarity) ? params.rarity : undefined,
    condition: isOneOf(CONDITIONS, params.condition) ? params.condition : undefined,
    sort,
    page: Number.isFinite(page) && page > 0 ? page : 1,
  };
}
