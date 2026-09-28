import { cacheGet, cacheSet } from "@/lib/redis";

const TTL_SECONDS = 60 * 60 * 12;

export async function rateToBrl(currency: "USD" | "EUR"): Promise<number | null> {
  const key = `fx:v1:${currency}:BRL`;
  const cached = await cacheGet<number>(key);
  if (typeof cached === "number" && cached > 0) return cached;

  try {
    const response = await fetch(`https://api.frankfurter.dev/v1/latest?base=${currency}&symbols=BRL`, {
      headers: { accept: "application/json" },
      next: { revalidate: TTL_SECONDS },
    });
    if (!response.ok) return null;
    const data = (await response.json()) as { rates?: { BRL?: number } };
    const rate = data.rates?.BRL;
    if (typeof rate !== "number" || rate <= 0) return null;
    await cacheSet(key, rate, TTL_SECONDS);
    return rate;
  } catch {
    return null;
  }
}
