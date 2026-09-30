import type { EventKindValue, LanguageValue, RarityValue } from "@/lib/labels";

export type PlayerEventPrizeDTO = {
  id: string;
  tcgId: string | null;
  name: string;
  setName: string | null;
  cardNumber: string | null;
  imageUrl: string | null;
  rarity: RarityValue;
  language: LanguageValue;
  quantity: number;
  placement: string | null;
  notes: string | null;
};

export type PlayerEventSummary = {
  id: string;
  name: string;
  kind: EventKindValue;
  location: string | null;
  heldAt: string | null;
  notes: string | null;
  prizeCount: number;
  unitCount: number;
};

export type PlayerEventDetail = PlayerEventSummary & {
  prizes: PlayerEventPrizeDTO[];
};

export type PlayerEventPayload = {
  name: string;
  kind: EventKindValue;
  location?: string;
  heldAt?: string | null;
  notes?: string;
};

export type PlayerEventPrizePayload = {
  tcgId?: string;
  name: string;
  setName?: string;
  cardNumber?: string;
  imageUrl?: string | null;
  rarity: RarityValue;
  language: LanguageValue;
  quantity: number;
  placement?: string;
  notes?: string;
};
