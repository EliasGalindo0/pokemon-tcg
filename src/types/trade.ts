export type TradeOwner = {
  id: string;
  username: string;
  displayName: string;
};

export type PublicTrader = {
  username: string;
  displayName: string;
  setCount: number;
  unitCount: number;
  sampleImages: string[];
};

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
  owner: TradeOwner;
};

export type TradeStockSet = {
  id: string;
  tcgSetId: string;
  name: string;
  logoUrl: string | null;
  language: string;
  official: number;
  unitCount: number;
  entries: TradeSlot[];
  owner: TradeOwner;
};
