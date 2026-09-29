export type TradeSetSummary = {
  id: string;
  tcgSetId: string;
  name: string;
  logoUrl: string | null;
  language: string;
  official: number;
  entryCount: number;
  unitCount: number;
};

export type TradeSetCandidate = {
  tcgSetId: string;
  name: string;
  logoUrl: string | null;
  official: number;
  total: number;
  sampleNumber: string;
};

export type TradeSlot = {
  tcgId: string;
  name: string;
  localId: string;
  number: string;
  imageUrl: string | null;
  quantity: number;
};

export type TradeBoard = {
  id: string;
  tcgSetId: string;
  name: string;
  logoUrl: string | null;
  language: string;
  official: number;
  total: number;
  ownedSlots: number;
  unitCount: number;
  slots: TradeSlot[];
};
