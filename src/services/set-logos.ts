import type { LanguageValue } from "@/lib/labels";
import { cacheGet, cacheSet } from "@/lib/redis";
import { fetchTcg } from "@/services/catalog";
import type { CardDTO } from "@/types/card";

type LogoSet = { id?: string; name?: string; logo?: string };

const TTL_SECONDS = 60 * 60 * 24;

async function existingAsset(base: string | undefined) {
  if (!base) return null;
  const clean = base.replace(/\/$/, "");
  const candidates = /\.(png|jpe?g|webp)$/i.test(clean) ? [clean] : [`${clean}.webp`, `${clean}.png`];
  for (const url of candidates) {
    try {
      const response = await fetch(url, { method: "HEAD" });
      if (response.ok && response.headers.get("content-type")?.startsWith("image/")) return url;
    } catch {
      continue;
    }
  }
  return null;
}

async function resolveLogo(name: string, code: string | null, language: LanguageValue) {
  const cacheKey = `set-logo:v2:${language}:${(code || name).toLowerCase()}`;
  const cached = await cacheGet<{ url: string | null }>(cacheKey);
  if (cached) return cached.url;

  let logo: string | undefined;
  if (code) {
    const set = await fetchTcg<LogoSet>(language, `sets/${encodeURIComponent(code)}`);
    logo = set?.logo;
  }
  if (!logo) {
    const rows = await fetchTcg<LogoSet[]>(language, `sets?name=${encodeURIComponent(name)}`);
    const match = Array.isArray(rows)
      ? rows.find((set) => set.name?.localeCompare(name, undefined, { sensitivity: "accent" }) === 0)
      : undefined;
    logo = match?.logo;
  }

  const url = await existingAsset(logo);
  await cacheSet(cacheKey, { url }, TTL_SECONDS);
  return url;
}

export async function withSetLogos<T extends CardDTO>(cards: T[]): Promise<T[]> {
  const pending = new Map<string, Promise<string | null>>();
  for (const card of cards) {
    const key = `${card.language}:${card.set.id}`;
    if (pending.has(key)) continue;
    pending.set(key, resolveLogo(card.set.name, card.set.code, card.language));
  }

  const logos = new Map<string, string | null>();
  await Promise.all(
    [...pending.entries()].map(async ([key, logo]) => {
      logos.set(key, await logo);
    }),
  );

  return cards.map((card) => ({
    ...card,
    set: { ...card.set, logoUrl: logos.get(`${card.language}:${card.set.id}`) ?? null },
  }));
}
