/**
 * Limitless / decklist set abbreviations → TCGdex set ids.
 * @see https://limitlesstcg.com/cards
 */
export const LIMITLESS_SET_TO_TCGDEX: Record<string, string> = {
  ASC: "me02.5",
  BLK: "sv10.5b",
  WHT: "sv10.5w",
  DRI: "sv10",
  JTG: "sv09",
  MEG: "me01",
  PFL: "me02",
  POR: "me03",
  CRI: "me04",
  PBL: "me05",
  MEW: "sv03.5",
  PAL: "sv02",
  PRE: "sv08.5",
  PAF: "sv04.5",
  PAR: "sv04",
  SCR: "sv07",
  SSP: "sv08",
  SFA: "sv06.5",
  SVE: "sve",
  SVI: "sv01",
  TEF: "sv05",
  TWM: "sv06",
  OBF: "sv03",
  PLB: "bw10",
  MEP: "mep",
  MEE: "mee",
  "30C": "30th",
};

const TCGDEX_TO_LIMITLESS: Record<string, string> = Object.fromEntries(
  Object.entries(LIMITLESS_SET_TO_TCGDEX).map(([abbrev, id]) => [id.toLowerCase(), abbrev]),
);

export function tcgdxSetIdForAbbrev(setCode: string): string | null {
  const key = setCode.trim().toUpperCase();
  if (!key) return null;
  const mapped = LIMITLESS_SET_TO_TCGDEX[key];
  if (mapped) return mapped;
  const lower = key.toLowerCase();
  if (/^[a-z0-9]+(?:\.[0-9]+)?[a-z]?$/i.test(lower)) return lower;
  return null;
}

/** TCGdex set id (`sv09`) or Limitless abbrev (`JTG`) → decklist code. */
export function limitlessAbbrevForSetId(setId: string): string | null {
  const key = setId.trim();
  if (!key) return null;
  const upper = key.toUpperCase();
  if (LIMITLESS_SET_TO_TCGDEX[upper]) return upper;
  const mapped = TCGDEX_TO_LIMITLESS[key.toLowerCase()];
  if (mapped) return mapped;
  if (/^[A-Za-z]{2,5}$/.test(key)) return upper;
  return null;
}
