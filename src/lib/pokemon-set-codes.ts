/**
 * Limitless / decklist set abbreviations → TCGdex set ids.
 * @see https://limitlesstcg.com/cards
 */
export const LIMITLESS_SET_TO_TCGDEX: Record<string, string> = {
  ASC: "me02.5",
  BLK: "sv10.5b",
  DRI: "sv10",
  JTG: "sv09",
  MEG: "me01",
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
  PFL: "sv10.5w",
  MEP: "mep",
};

export function tcgdxSetIdForAbbrev(setCode: string): string | null {
  const key = setCode.trim().toUpperCase();
  if (!key) return null;
  const mapped = LIMITLESS_SET_TO_TCGDEX[key];
  if (mapped) return mapped;
  const lower = key.toLowerCase();
  if (/^[a-z0-9]+(?:\.[0-9]+)?[a-z]?$/i.test(lower)) return lower;
  return null;
}
