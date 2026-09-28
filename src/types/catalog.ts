import type { LanguageValue, RarityValue } from "@/lib/labels";

export type CatalogHit = {
  id: string;
  name: string;
  setName: string;
  setCode: string;
  cardNumber: string;
  rarity: RarityValue;
  language: LanguageValue;
  imageUrl: string | null;
  thumbUrl: string | null;
  marketValue: string | null;
  priceCurrency: "USD" | "EUR" | "BRL" | null;
  sourceAmount: string | null;
  sourceCurrency: "USD" | "EUR" | null;
};

export type CatalogSearchResult = {
  items: CatalogHit[];
  language: LanguageValue;
};
