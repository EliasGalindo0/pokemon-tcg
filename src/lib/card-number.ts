/** Shared Pokémon TCG printed-number helpers (001/094, 095/∞). */

export type ParsedCardNumber = {
  /** Digits/id as typed, zeros preserved when present. */
  localId: string;
  /** Unpadded key for fuzzy matching. */
  localKey: string;
  official: number | null;
  infinite: boolean;
};

export type ParsedSearchQuery = {
  /** Optional Pokémon / card name fragment. */
  name: string | null;
  number: ParsedCardNumber | null;
};

const INFINITE = /^(?:#)?(\d{1,4})\s*\/\s*(?:∞|inf(?:inity)?|\*|oo)$/i;
const FRACTION = /^(?:#)?(\d{1,4})\s*\/\s*(\d{1,4})$/;
const LOCAL_ONLY = /^(?:#)?(\d{1,4})$/;
/** Alphanumeric promo ids e.g. SWSH001, SM152 */
const PROMO_CODE = /^(?:#)?([A-Za-z]{1,6}\d{1,4}[A-Za-z]?)$/;
const NUMBER_TOKEN =
  "(?:#)?\\d{1,4}\\s*\\/\\s*(?:∞|inf(?:inity)?|\\*|oo|\\d{1,4})|(?:#)?[A-Za-z]{1,6}\\d{1,4}[A-Za-z]?|(?:#)?\\d{1,4}";

function stripZeros(value: string) {
  return value.replace(/^0+(?=\d)/, "") || value;
}

export function localNumber(value: string | number | null | undefined) {
  const head = String(value ?? "").split("/")[0]?.trim() ?? "";
  if (!head) return "";
  if (/^\d+$/.test(head)) return stripZeros(head);
  return head.toUpperCase();
}

export function padPrintedPart(value: string | number, width: number) {
  const raw = String(value);
  if (!/^\d+$/.test(raw)) return raw;
  return raw.padStart(Math.max(width, raw.length), "0");
}

/** Official set size → printed denominator (094, not 94). */
export function printedOfficial(official: number, localId?: string | number) {
  if (official <= 0) return "∞";
  const local = localId === undefined ? "" : String(localId).split("/")[0] ?? "";
  const localDigits = /^\d+$/.test(local) ? local.length : 0;
  const width = Math.max(3, String(official).length, localDigits);
  return String(official).padStart(width, "0");
}

export function printedCardNumber(localId: string | number, official: number) {
  const local = String(localId);
  const right = printedOfficial(official, local);
  if (official <= 0) {
    const left = /^\d+$/.test(local) ? padPrintedPart(local, 3) : local;
    return `${left}/∞`;
  }
  const width = Math.max(3, String(official).length, /^\d+$/.test(local) ? local.length : 0);
  const left = /^\d+$/.test(local) ? local.padStart(width, "0") : local;
  return `${left}/${right}`;
}

export function parseCardNumber(input: string): ParsedCardNumber | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const infinite = trimmed.match(INFINITE);
  if (infinite) {
    return {
      localId: infinite[1],
      localKey: stripZeros(infinite[1]),
      official: null,
      infinite: true,
    };
  }

  const fraction = trimmed.match(FRACTION);
  if (fraction) {
    return {
      localId: fraction[1],
      localKey: stripZeros(fraction[1]),
      official: Number(fraction[2]),
      infinite: false,
    };
  }

  const localOnly = trimmed.match(LOCAL_ONLY);
  if (localOnly) {
    return {
      localId: localOnly[1],
      localKey: stripZeros(localOnly[1]),
      official: null,
      infinite: false,
    };
  }

  const promo = trimmed.match(PROMO_CODE);
  if (promo) {
    const code = promo[1].toUpperCase();
    return {
      localId: code,
      localKey: code,
      official: null,
      infinite: true,
    };
  }

  return null;
}

/** Split "Slowpoke 086/∞" or "086/∞ Slowpoke" into name + number. */
export function parseSearchQuery(input: string): ParsedSearchQuery {
  const trimmed = input.trim();
  if (!trimmed) return { name: null, number: null };

  const trailing = trimmed.match(new RegExp(`^(.+?)\\s+(${NUMBER_TOKEN})$`, "i"));
  if (trailing?.[1]?.trim()) {
    const number = parseCardNumber(trailing[2]);
    if (number) return { name: trailing[1].trim(), number };
  }

  const leading = trimmed.match(new RegExp(`^(${NUMBER_TOKEN})\\s+(.+)$`, "i"));
  if (leading?.[2]?.trim()) {
    const number = parseCardNumber(leading[1]);
    if (number) return { name: leading[2].trim(), number };
  }

  const number = parseCardNumber(trimmed);
  if (number) return { name: null, number };
  return { name: trimmed, number: null };
}

/** Variants to try against TCGdex `localId=` (padding matters). */
export function localIdSearchVariants(localId: string): string[] {
  const raw = localId.trim();
  if (!raw) return [];
  if (!/^\d+$/.test(raw)) return [raw, raw.toUpperCase(), raw.toLowerCase()];

  const stripped = stripZeros(raw);
  const variants = new Set<string>([raw, stripped]);
  for (const width of [2, 3, 4]) {
    variants.add(stripped.padStart(width, "0"));
  }
  return [...variants];
}

const KNOWN_PROMO_SET_IDS =
  /^(svp|swshp|smp|bwp|xyop|xyp|dpp|np|mcd\d*|hsp|fut\d*|pr-[a-z0-9]+|p-a|tg|rc|det1|si[0-9]|cel25c?|mep|basep|hgssp|wp|miscp|mee)$/i;

export function isPromoSetBrief(set: {
  id?: string;
  name?: string;
  cardCount?: { official?: number; total?: number };
}) {
  const name = (set.name ?? "").toLowerCase();
  const id = (set.id ?? "").toLowerCase();
  if (name.includes("promo") || name.includes("black star")) return true;
  if (id.includes("promo")) return true;
  if (KNOWN_PROMO_SET_IDS.test(id)) return true;
  // Short ids ending in "p" (svp, mep, smp…) — not regular sets like me01
  if (/^[a-z]{1,5}p$/i.test(id)) return true;
  // official === 0 only when cardCount was provided (avoid treating missing data as promo)
  if (set.cardCount != null && (set.cardCount.official ?? 0) === 0) return true;
  return false;
}

/** True when a catalog card id belongs to a promo set (e.g. mep-086, svp-095). */
export function isPromoCardId(cardId: string) {
  const index = cardId.lastIndexOf("-");
  const setId = index > 0 ? cardId.slice(0, index) : cardId;
  return isPromoSetBrief({ id: setId });
}

/** Client-side: treat as card-number query (triggers search with 1+ chars). */
export function looksLikeCardNumberQuery(value: string) {
  const { name, number } = parseSearchQuery(value);
  if (number) return true;
  return (name?.length ?? 0) >= 2;
}
