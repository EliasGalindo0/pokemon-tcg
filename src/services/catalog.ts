import {
  isPromoCardId,
  isPromoSetBrief,
  localIdSearchVariants,
  localNumber,
  parseSearchQuery,
  printedCardNumber,
} from "@/lib/card-number";
import { AppError } from "@/lib/errors";
import { isOneOf, LANGUAGES, type LanguageValue, type RarityValue } from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import { bumpCacheVersion, cacheGet, cacheSet } from "@/lib/redis";
import { rateToBrl } from "@/services/exchange";
import type { CatalogHit, CatalogSearchResult } from "@/types/catalog";

const BASE_URL = process.env.TCGDEX_API_URL ?? "https://api.tcgdex.net/v2";

const LANGUAGE_PATH: Record<LanguageValue, string> = {
  EN: "en",
  PT_BR: "pt",
  JA: "ja",
  ES: "es",
  FR: "fr",
  DE: "de",
  IT: "it",
  KO: "ko",
  ZH_TW: "zh-tw",
  ZH_CN: "zh-cn",
};

type TcgBrief = {
  id?: string;
  image?: string;
};

type TcgPrice = {
  marketPrice?: number;
};

type TcgCard = {
  id?: string;
  name?: string;
  localId?: string | number;
  image?: string;
  rarity?: string;
  set?: {
    id?: string;
    name?: string;
    cardCount?: { official?: number };
  };
  category?: string;
  variants?: { holo?: boolean };
  pricing?: {
    tcgplayer?: Record<string, TcgPrice | string | number | undefined>;
    cardmarket?: { trend?: number };
  };
};

type TcgSetBrief = {
  id?: string;
  name?: string;
  cardCount?: { official?: number; total?: number };
};

type TcgSetDetail = TcgSetBrief & {
  cards?: { id?: string; localId?: string | number; name?: string; image?: string }[];
};

export function catalogImageUrl(base: string | undefined, quality: "low" | "high") {
  if (!base) return null;
  const clean = base.replace(/\/$/, "");
  if (/\.(png|jpe?g|webp)$/i.test(clean)) return clean;
  if (/\/(logo|symbol)$/i.test(clean)) return `${clean}.webp`;
  return `${clean}/${quality}.webp`;
}

/** Logos often 404 in pt/ja; English assets are the reliable source. */
export function catalogLogoUrl(base: string | undefined) {
  const url = catalogImageUrl(base, "low");
  if (!url) return null;
  return url.replace(/^(https?:\/\/assets\.tcgdex\.net)\/[a-z]{2}\//i, "$1/en/");
}

function imageUrl(base: string | undefined, quality: "low" | "high") {
  return catalogImageUrl(base, quality);
}

function mapRarity(rarity: string | undefined, holo: boolean): RarityValue {
  const key = (rarity ?? "").trim().toLowerCase();
  const known: Record<string, RarityValue> = {
    common: "COMMON",
    uncommon: "UNCOMMON",
    rare: "RARE",
    "rare holo": "RARE_HOLO",
    "rare holo ex": "ULTRA_RARE",
    "rare holo v": "ULTRA_RARE",
    "rare ultra": "ULTRA_RARE",
    "double rare": "DOUBLE_RARE",
    "ultra rare": "ULTRA_RARE",
    "illustration rare": "ILLUSTRATION_RARE",
    "special illustration rare": "SPECIAL_ILLUSTRATION_RARE",
    "hyper rare": "HYPER_RARE",
    "secret rare": "SECRET_RARE",
    "shiny rare": "SHINY_RARE",
    "amazing rare": "AMAZING_RARE",
    "radiant rare": "RADIANT_RARE",
    "ace spec rare": "ACE_SPEC",
    promo: "PROMO",
  };

  const mapped = known[key];
  if (mapped === "RARE" && holo) return "RARE_HOLO";
  if (mapped) return mapped;
  if (key.includes("special illustration")) return "SPECIAL_ILLUSTRATION_RARE";
  if (key.includes("illustration")) return "ILLUSTRATION_RARE";
  if (key.includes("hyper")) return "HYPER_RARE";
  if (key.includes("secret")) return "SECRET_RARE";
  if (key.includes("shiny")) return "SHINY_RARE";
  if (key.includes("amazing")) return "AMAZING_RARE";
  if (key.includes("radiant")) return "RADIANT_RARE";
  if (key.includes("ace")) return "ACE_SPEC";
  if (key.includes("promo")) return "PROMO";
  if (key.includes("ultra")) return "ULTRA_RARE";
  if (key.includes("double")) return "DOUBLE_RARE";
  if (key.includes("uncommon")) return "UNCOMMON";
  if (key.includes("common")) return "COMMON";
  if (holo) return "RARE_HOLO";
  return "RARE";
}

function marketQuote(card: TcgCard): { amount: string; currency: "USD" | "EUR" } | null {
  const player = card.pricing?.tcgplayer;
  if (player) {
    const preferred = ["holofoil", "reverse-holofoil", "normal", "unlimited-holofoil", "1st-edition-holofoil"];
    const entries = [
      ...preferred.map((key) => player[key]),
      ...Object.values(player),
    ];
    for (const entry of entries) {
      if (entry && typeof entry === "object" && typeof entry.marketPrice === "number") {
        return { amount: entry.marketPrice.toFixed(2), currency: "USD" };
      }
    }
  }

  const trend = card.pricing?.cardmarket?.trend;
  if (typeof trend === "number") return { amount: trend.toFixed(2), currency: "EUR" };
  return null;
}

function toHit(card: TcgCard, language: LanguageValue): CatalogHit | null {
  if (!card.id || !card.name || !card.set?.name) return null;
  const official = card.set.cardCount?.official ?? 0;
  const localId = card.localId === undefined ? "" : String(card.localId);
  const quote = marketQuote(card);
  const code = (card.set.id ?? "").slice(0, 16);
  const promo =
    mapRarity(card.rarity, Boolean(card.variants?.holo)) === "PROMO" ||
    isPromoSetBrief({ id: card.set.id, name: card.set.name, cardCount: card.set.cardCount });

  return {
    id: card.id,
    name: card.name,
    setName: card.set.name,
    setCode: code,
    cardNumber: printedCardNumber(localId, promo && official > 0 ? 0 : official),
    rarity: mapRarity(card.rarity, Boolean(card.variants?.holo)),
    language,
    imageUrl: imageUrl(card.image, "high"),
    thumbUrl: imageUrl(card.image, "low"),
    marketValue: quote?.amount ?? null,
    priceCurrency: quote?.currency ?? null,
    sourceAmount: null,
    sourceCurrency: null,
  };
}

async function priceInBrl(hit: CatalogHit): Promise<CatalogHit> {
  if (!hit.marketValue || (hit.priceCurrency !== "USD" && hit.priceCurrency !== "EUR")) return hit;
  const rate = await rateToBrl(hit.priceCurrency);
  if (!rate) return hit;
  const foreign = Number(hit.marketValue);
  if (!Number.isFinite(foreign)) return hit;
  return {
    ...hit,
    sourceAmount: hit.marketValue,
    sourceCurrency: hit.priceCurrency,
    marketValue: (foreign * rate).toFixed(2),
    priceCurrency: "BRL",
  };
}

async function readJson<T>(response: Response): Promise<T | null> {
  if (response.status === 404) return null;
  if (!response.ok) throw new AppError("O catálogo de cartas não respondeu.", 502);
  return (await response.json()) as T;
}

async function preferKnownSets(ids: string[], preferPromo: boolean, userId?: string) {
  const sets = await prisma.set.findMany({
    ...(userId ? { where: { userId } } : {}),
    select: { code: true },
  });
  const codes = sets.map((set) => set.code?.toLowerCase()).filter((code): code is string => Boolean(code));
  const known = ids.filter((id) => codes.some((code) => id.toLowerCase().startsWith(`${code}-`)));
  const promo = ids.filter((id) => isPromoCardId(id));
  const rest = ids.filter((id) => !known.includes(id) && !promo.includes(id));
  const ordered = preferPromo
    ? [...promo, ...known, ...rest.reverse()]
    : [...known, ...promo, ...rest.reverse()];
  return [...new Set(ordered)].slice(0, 12);
}

async function fetchLocalIdIds(path: string, localId: string) {
  const url = `${BASE_URL}/${path}/cards?localId=${encodeURIComponent(localId)}&pagination:page=1&pagination:itemsPerPage=100`;
  const response = await fetch(url, { headers: { accept: "application/json" }, cache: "no-store" });
  const data = await readJson<TcgBrief[]>(response);
  if (!Array.isArray(data)) return [];
  return data.map((item) => item.id).filter((id): id is string => Boolean(id));
}

/** Scan promo sets for a matching local number — reliable path for N/∞. */
async function searchPromoIdsByLocalKey(path: string, localKey: string) {
  const response = await fetch(`${BASE_URL}/${path}/sets`, {
    headers: { accept: "application/json" },
    cache: "no-store",
  });
  const sets = await readJson<TcgSetBrief[]>(response);
  if (!Array.isArray(sets)) return [];

  const promos = sets.filter((set) => Boolean(set.id && set.name) && isPromoSetBrief(set));
  const priority = ["mep", "svp", "swshp", "smp", "bwp", "xyop", "xyp", "dpp", "np", "hsp", "p-a", "basep"];
  promos.sort((a, b) => {
    const ai = priority.indexOf((a.id ?? "").toLowerCase());
    const bi = priority.indexOf((b.id ?? "").toLowerCase());
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  const ids: string[] = [];
  for (const brief of promos.slice(0, 40)) {
    const detailResponse = await fetch(`${BASE_URL}/${path}/sets/${encodeURIComponent(brief.id!)}`, {
      headers: { accept: "application/json" },
      cache: "no-store",
    });
    const detail = await readJson<TcgSetDetail>(detailResponse);
    if (!detail?.cards?.length) continue;
    const match = detail.cards.find((card) => localNumber(card.localId) === localKey && card.id);
    if (match?.id && !ids.includes(match.id)) ids.push(match.id);
    if (ids.length >= 12) break;
  }

  return ids;
}

async function searchIds(path: string, query: string) {
  const { name, number: parsed } = parseSearchQuery(query);

  if (!parsed) {
    if (!name || name.length < 2) return [];
    const url = `${BASE_URL}/${path}/cards?name=${encodeURIComponent(name)}&pagination:page=1&pagination:itemsPerPage=40`;
    const response = await fetch(url, { headers: { accept: "application/json" }, cache: "no-store" });
    const data = await readJson<TcgBrief[]>(response);
    if (!Array.isArray(data)) return [];
    return data.map((item) => item.id).filter((id): id is string => Boolean(id)).slice(0, 24);
  }

  if (parsed.infinite) {
    const variants = localIdSearchVariants(parsed.localId);
    const gathered: string[] = [];
    for (const variant of variants) {
      const ids = await fetchLocalIdIds(path, variant);
      for (const id of ids) {
        if (isPromoCardId(id) && !gathered.includes(id)) gathered.push(id);
      }
      if (gathered.length >= 24) break;
    }
    if (gathered.length === 0) {
      const scanned = await searchPromoIdsByLocalKey(path, parsed.localKey);
      gathered.push(...scanned);
    }
    // Prefer MEP / recent promo series first
    gathered.sort((a, b) => Number(isPromoCardId(b)) - Number(isPromoCardId(a)));
    const mepFirst = [
      ...gathered.filter((id) => id.toLowerCase().startsWith("mep-")),
      ...gathered.filter((id) => !id.toLowerCase().startsWith("mep-")),
    ];
    return [...new Set(mepFirst)].slice(0, 24);
  }

  const variants = localIdSearchVariants(parsed.localId);
  const gathered: string[] = [];
  for (const variant of variants) {
    const ids = await fetchLocalIdIds(path, variant);
    for (const id of ids) {
      if (!gathered.includes(id)) gathered.push(id);
    }
    if (gathered.length >= 40) break;
  }

  return preferKnownSets(gathered, false, undefined);
}

function isEnergyCategory(category: string | undefined) {
  const key = (category ?? "").trim().toLowerCase();
  return key === "energia" || key === "energy";
}

export async function findEnergyArtwork(name: string, language: LanguageValue = "PT_BR") {
  const cacheKey = `energy-art:v1:${language}:${name.trim().toLowerCase()}`;
  const cached = await cacheGet<{ url: string | null }>(cacheKey);
  if (cached) return cached.url;

  const paths = [...new Set([LANGUAGE_PATH[language], "en", "pt"])];
  let url: string | null = null;
  for (const path of paths) {
    const endpoint = `${BASE_URL}/${path}/cards?name=${encodeURIComponent(name)}&pagination:page=1&pagination:itemsPerPage=40`;
    const response = await fetch(endpoint, { headers: { accept: "application/json" }, cache: "no-store" });
    const rows = await readJson<TcgBrief[]>(response);
    const donor = Array.isArray(rows) ? rows.find((row) => row.image) : undefined;
    const artwork = imageUrl(donor?.image, "high");
    if (artwork) {
      url = artwork;
      break;
    }
  }

  await cacheSet(cacheKey, { url }, 60 * 60 * 24);
  return url;
}

async function loadCard(path: string, id: string) {
  const response = await fetch(`${BASE_URL}/${path}/cards/${encodeURIComponent(id)}`, {
    headers: { accept: "application/json" },
    cache: "no-store",
  });
  return readJson<TcgCard>(response);
}

export async function searchCatalog(query: string, languageInput?: string): Promise<CatalogSearchResult> {
  const raw = query.trim();
  const { name: nameFilter, number: parsed } = parseSearchQuery(raw);
  if (!parsed && (!nameFilter || nameFilter.length < 2)) return { items: [], language: "EN" };

  const language = isOneOf(LANGUAGES, languageInput) ? languageInput : "EN";
  const cacheKey = `catalog:v8:${language}:${raw.toLowerCase()}`;
  const cached = await cacheGet<CatalogSearchResult>(cacheKey);
  if (cached) return cached;

  let path = LANGUAGE_PATH[language];
  let ids = await searchIds(path, raw);
  let resultLanguage = language;

  // Promos / MEP often incomplete in PT — prefer English when ∞ search is empty or thin.
  if ((ids.length === 0 || (parsed?.infinite && ids.length < 3)) && path !== "en") {
    const enIds = await searchIds("en", raw);
    if (enIds.length > ids.length) {
      path = "en";
      ids = enIds;
      resultLanguage = "EN";
    }
  }

  const details = await Promise.all(ids.map((id) => loadCard(path, id)));
  let hits = (
    await Promise.all(
      details.map(async (card) => {
        if (!card) return null;
        const hit = toHit(card, resultLanguage);
        if (!hit || hit.imageUrl || !isEnergyCategory(card.category)) return hit;
        const artwork = await findEnergyArtwork(hit.name, resultLanguage);
        if (!artwork) return hit;
        return { ...hit, imageUrl: artwork, thumbUrl: artwork };
      }),
    )
  ).filter((card): card is CatalogHit => card !== null);

  if (parsed?.infinite) {
    hits = hits.filter(
      (hit) =>
        hit.cardNumber.includes("∞") ||
        hit.rarity === "PROMO" ||
        isPromoCardId(hit.id) ||
        isPromoSetBrief({ id: hit.setCode, name: hit.setName }),
    );
  } else if (parsed?.official != null) {
    const wanted = printedCardNumber(parsed.localId, parsed.official).split("/")[1];
    const filtered = hits.filter((hit) => {
      const denom = hit.cardNumber.split("/")[1];
      return denom === String(parsed.official) || denom === wanted;
    });
    if (filtered.length > 0) hits = filtered;
  }

  if (nameFilter) {
    const needle = nameFilter.toLowerCase();
    const named = hits.filter(
      (hit) => hit.name.toLowerCase().includes(needle) || hit.setName.toLowerCase().includes(needle),
    );
    if (named.length > 0) hits = named;
  }

  hits.sort((a, b) => {
    const aMep = a.id.toLowerCase().startsWith("mep-") ? 1 : 0;
    const bMep = b.id.toLowerCase().startsWith("mep-") ? 1 : 0;
    return bMep - aMep || Number(Boolean(b.imageUrl)) - Number(Boolean(a.imageUrl));
  });

  const items = await Promise.all(hits.slice(0, 12).map((hit) => priceInBrl(hit)));

  const result = { items, language: resultLanguage };
  await cacheSet(cacheKey, result, 600);
  return result;
}

type TcgSetCard = { localId?: string | number; name?: string; image?: string };

async function imageIndexForSet(setName: string, language: LanguageValue) {
  const paths = [...new Set([LANGUAGE_PATH[language], "en"])];
  for (const path of paths) {
    const response = await fetch(`${BASE_URL}/${path}/sets?name=${encodeURIComponent(setName)}`, {
      headers: { accept: "application/json" },
      cache: "no-store",
    });
    if (!response.ok) continue;
    const sets = (await response.json()) as TcgSetBrief[];
    const match = Array.isArray(sets)
      ? sets.find((set) => set.name?.localeCompare(setName, undefined, { sensitivity: "accent" }) === 0)
      : undefined;
    if (!match?.id) continue;

    const detailResponse = await fetch(`${BASE_URL}/${path}/sets/${encodeURIComponent(match.id)}`, {
      headers: { accept: "application/json" },
      cache: "no-store",
    });
    if (!detailResponse.ok) continue;
    const detail = (await detailResponse.json()) as { cards?: TcgSetCard[] };
    const byNumber = new Map<string, string>();
    for (const card of detail.cards ?? []) {
      const url = imageUrl(card.image, "high");
      const number = localNumber(card.localId);
      if (url && number) byNumber.set(number, url);
    }
    if (byNumber.size > 0) return byNumber;
  }
  return new Map<string, string>();
}

export async function fillMissingImages(userId?: string) {
  try {
    await writeMissingImages(userId);
  } catch (error) {
    console.error("Não foi possível buscar as imagens do catálogo.", error);
  }
}

async function writeMissingImages(userId?: string) {
  const missing = await prisma.card.findMany({
    where: { imageUrl: null, ...(userId ? { userId } : {}) },
    include: { set: true },
  });
  if (missing.length === 0) return;

  const indexes = new Map<string, Map<string, string>>();
  let updated = 0;

  for (const card of missing) {
    const key = `${card.language}:${card.set.name.toLowerCase()}`;
    let index = indexes.get(key);
    if (!index) {
      index = await imageIndexForSet(card.set.name, card.language);
      indexes.set(key, index);
    }
    const url = index.get(localNumber(card.cardNumber));
    if (!url) continue;
    await prisma.card.update({ where: { id: card.id }, data: { imageUrl: url } });
    updated += 1;
  }

  if (updated > 0) await bumpCacheVersion();
}

export function catalogLanguage(language: LanguageValue) {
  return LANGUAGE_PATH[language] ?? "pt";
}

export async function fetchCatalogCard(language: LanguageValue, id: string): Promise<CatalogHit | null> {
  const card = await loadCard(catalogLanguage(language), id);
  const hit = card ? toHit(card, language) : null;
  return hit ? priceInBrl(hit) : null;
}

export async function fetchTcg<T>(language: LanguageValue, resource: string): Promise<T | null> {
  const response = await fetch(`${BASE_URL}/${catalogLanguage(language)}/${resource}`, {
    headers: { accept: "application/json" },
    next: { revalidate: 3600 },
  });
  return readJson<T>(response);
}
