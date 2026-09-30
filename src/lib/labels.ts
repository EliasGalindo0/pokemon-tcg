export const RARITIES = [
  "COMMON",
  "UNCOMMON",
  "RARE",
  "RARE_HOLO",
  "REVERSE_HOLO",
  "DOUBLE_RARE",
  "ULTRA_RARE",
  "ILLUSTRATION_RARE",
  "SPECIAL_ILLUSTRATION_RARE",
  "HYPER_RARE",
  "SECRET_RARE",
  "SHINY_RARE",
  "AMAZING_RARE",
  "RADIANT_RARE",
  "ACE_SPEC",
  "PROMO",
] as const;

export const CONDITIONS = [
  "MINT",
  "NEAR_MINT",
  "LIGHTLY_PLAYED",
  "MODERATELY_PLAYED",
  "HEAVILY_PLAYED",
  "DAMAGED",
] as const;

export const DECK_FORMATS = ["STANDARD", "EXPANDED", "UNLIMITED", "OTHER"] as const;

export type DeckFormatValue = (typeof DECK_FORMATS)[number];

export const DECK_FORMAT_LABEL: Record<DeckFormatValue, string> = {
  STANDARD: "Padrão",
  EXPANDED: "Expandido",
  UNLIMITED: "Ilimitado",
  OTHER: "Outro",
};

export const EVENT_KINDS = ["CHAMPIONSHIP", "LEAGUE", "CUP", "LOCAL", "OTHER"] as const;

export type EventKindValue = (typeof EVENT_KINDS)[number];

export const EVENT_KIND_LABEL: Record<EventKindValue, string> = {
  CHAMPIONSHIP: "Campeonato",
  LEAGUE: "Liga",
  CUP: "Copa",
  LOCAL: "Local / loja",
  OTHER: "Outro",
};

export const DECK_SIZE = 60;

export const LANGUAGES = [
  "EN",
  "PT_BR",
  "JA",
  "ES",
  "FR",
  "DE",
  "IT",
  "KO",
  "ZH_TW",
  "ZH_CN",
] as const;

export type RarityValue = (typeof RARITIES)[number];
export type ConditionValue = (typeof CONDITIONS)[number];
export type LanguageValue = (typeof LANGUAGES)[number];

export const RARITY_RANK: Record<RarityValue, number> = {
  COMMON: 1,
  UNCOMMON: 2,
  RARE: 3,
  PROMO: 4,
  REVERSE_HOLO: 5,
  RARE_HOLO: 6,
  DOUBLE_RARE: 7,
  RADIANT_RARE: 8,
  AMAZING_RARE: 9,
  ULTRA_RARE: 10,
  SHINY_RARE: 11,
  ACE_SPEC: 12,
  ILLUSTRATION_RARE: 13,
  SECRET_RARE: 14,
  HYPER_RARE: 15,
  SPECIAL_ILLUSTRATION_RARE: 16,
};

export const RARITY_LABEL: Record<RarityValue, string> = {
  COMMON: "Comum",
  UNCOMMON: "Incomum",
  RARE: "Rara",
  RARE_HOLO: "Rara Holo",
  REVERSE_HOLO: "Reverse Holo",
  DOUBLE_RARE: "Double Rare",
  ULTRA_RARE: "Ultra Rare",
  ILLUSTRATION_RARE: "Illustration Rare",
  SPECIAL_ILLUSTRATION_RARE: "Special Illustration Rare",
  HYPER_RARE: "Hyper Rare",
  SECRET_RARE: "Secret Rare",
  SHINY_RARE: "Shiny Rare",
  AMAZING_RARE: "Amazing Rare",
  RADIANT_RARE: "Radiant Rare",
  ACE_SPEC: "ACE SPEC",
  PROMO: "Promo",
};

export const CONDITION_LABEL: Record<ConditionValue, string> = {
  MINT: "Mint",
  NEAR_MINT: "Near Mint",
  LIGHTLY_PLAYED: "Lightly Played",
  MODERATELY_PLAYED: "Moderately Played",
  HEAVILY_PLAYED: "Heavily Played",
  DAMAGED: "Damaged",
};

export const LANGUAGE_LABEL: Record<LanguageValue, string> = {
  EN: "Inglês",
  PT_BR: "Português",
  JA: "Japonês",
  ES: "Espanhol",
  FR: "Francês",
  DE: "Alemão",
  IT: "Italiano",
  KO: "Coreano",
  ZH_TW: "Chinês (Tradicional)",
  ZH_CN: "Chinês (Simplificado)",
};

export const RARITY_TONE: Record<RarityValue, string> = {
  COMMON: "bg-stone-200/90 text-stone-800",
  UNCOMMON: "bg-emerald-100 text-emerald-950",
  RARE: "bg-sky-100 text-sky-950",
  RARE_HOLO: "bg-yellow-100 text-yellow-950",
  REVERSE_HOLO: "bg-amber-100 text-amber-950",
  DOUBLE_RARE: "bg-orange-100 text-orange-950",
  ULTRA_RARE: "bg-fuchsia-100 text-fuchsia-950",
  ILLUSTRATION_RARE: "bg-rose-100 text-rose-950",
  SPECIAL_ILLUSTRATION_RARE: "bg-amber-200 text-amber-950",
  HYPER_RARE: "bg-violet-100 text-violet-950",
  SECRET_RARE: "bg-indigo-100 text-indigo-950",
  SHINY_RARE: "bg-lime-100 text-lime-950",
  AMAZING_RARE: "bg-cyan-100 text-cyan-950",
  RADIANT_RARE: "bg-teal-100 text-teal-950",
  ACE_SPEC: "bg-red-100 text-red-950",
  PROMO: "bg-slate-200 text-slate-800",
};

export function optionsFrom<T extends string>(labels: Record<T, string>, rank?: Record<T, number>) {
  const keys = Object.keys(labels) as T[];
  const ordered = rank ? keys.sort((a, b) => rank[a] - rank[b]) : keys;
  return ordered.map((value) => ({ value, label: labels[value] }));
}

export function isOneOf<T extends string>(values: readonly T[], value: string | undefined): value is T {
  if (!value) return false;
  return (values as readonly string[]).includes(value);
}
