import type { DeckFormatValue } from "@/lib/labels";

export type DeckSummary = {
  id: string;
  name: string;
  format: DeckFormatValue;
  cardCount: number;
  updatedAt: string;
};

export type DeckEntryDTO = {
  id: string;
  quantity: number;
  owned: number | null;
  cardId: string | null;
  tcgId: string | null;
  name: string;
  setName: string;
  cardNumber: string | null;
  imageUrl: string | null;
};

export type DeckDetail = DeckSummary & {
  entries: DeckEntryDTO[];
};

export type DeckPayload = {
  name: string;
  format: DeckFormatValue;
};
