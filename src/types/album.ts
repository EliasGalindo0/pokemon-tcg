export type AlbumSetOption = {
  id: string;
  name: string;
  logo: string | null;
  official: number;
  total: number;
};

export type AlbumSlot = {
  tcgId: string;
  name: string;
  localId: string;
  number: string;
  imageUrl: string | null;
  owned: boolean;
  ownedIds: string[];
  quantity: number;
  marketValue?: string | null;
  purchasePrice?: string | null;
};

export type AlbumView = {
  setId: string;
  name: string;
  logo: string | null;
  official: number;
  total: number;
  ownedSlots: number;
  ownedUnits: number;
  estimatedValue?: string;
  slots: AlbumSlot[];
};
