import type { ConditionValue, LanguageValue, RarityValue } from "@/lib/labels";
import type { DeckSummary } from "@/types/deck";

export type SetDTO = {
  id: string;
  name: string;
  code: string | null;
  logoUrl?: string | null;
  isPublic?: boolean;
  cardCount?: number;
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

export type DashboardSetSummary = {
  id: string;
  name: string;
  code: string | null;
  cardCount: number;
  uniqueCards: number;
  officialEstimate: number | null;
  completionPercent: number | null;
  estimatedValue: string;
};

export type DashboardOfferPreview = {
  id: string;
  wantedName: string;
  wantedNumber: string | null;
  offeredName: string;
  visitorName: string | null;
  createdAt: string;
};

export type DashboardData = {
  totalCards: number;
  estimatedValue: string;
  setCount: number;
  deckCount: number;
  pendingOffers: number;
  tradeSetCount: number;
  decks: DeckSummary[];
  sets: DashboardSetSummary[];
  recentOffers: DashboardOfferPreview[];
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
