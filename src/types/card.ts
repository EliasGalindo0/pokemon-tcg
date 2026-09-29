import type { ConditionValue, LanguageValue, RarityValue } from "@/lib/labels";

export type SetDTO = {
  id: string;
  name: string;
  code: string | null;
  logoUrl?: string | null;
};

export type CardDTO = {
  id: string;
  name: string;
  cardNumber: string | null;
  rarity: RarityValue;
  condition: ConditionValue;
  language: LanguageValue;
  marketValue: string;
  purchasePrice: string | null;
  quantity: number;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
  set: SetDTO;
};

export type CardListResult = {
  items: CardDTO[];
  page: number;
  pageSize: number;
  total: number;
  pageCount: number;
};

export type CardQuery = {
  q?: string;
  setId?: string;
  rarity?: RarityValue;
  condition?: ConditionValue;
  sort?: "name" | "number" | "recent";
  page: number;
};

export type DashboardData = {
  totalCards: number;
  estimatedValue: string;
  setCount: number;
  deckCount: number;
  recent: CardDTO[];
  rarest: CardDTO[];
};

export type CardPayload = {
  name: string;
  setId?: string;
  newSetName?: string;
  newSetCode?: string;
  cardNumber?: string;
  rarity: RarityValue;
  condition: ConditionValue;
  language: LanguageValue;
  marketValue: number;
  purchasePrice: number | null;
  quantity: number;
  imageUrl: string | null;
};
