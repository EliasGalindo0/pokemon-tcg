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
};

export type AlbumView = {
  setId: string;
  name: string;
  logo: string | null;
  official: number;
  total: number;
  ownedSlots: number;
  ownedUnits: number;
  slots: AlbumSlot[];
};
