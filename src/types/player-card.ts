import type { LanguageValue, RarityValue } from "@/lib/labels";

export type PlayerCardDTO = {
  id: string;
  tcgId: string | null;
  name: string;
  setName: string | null;
  cardNumber: string | null;
  imageUrl: string | null;
  rarity: RarityValue;
  language: LanguageValue;
  quantity: number;
  eventName: string | null;
  eventDate: string | null;
  placement: string | null;
  notes: string | null;
};

export type PlayerCardPayload = {
  tcgId?: string;
  name: string;
  setName?: string;
  cardNumber?: string;
  imageUrl?: string | null;
  rarity: RarityValue;
  language: LanguageValue;
  quantity: number;
  eventName?: string;
  eventDate?: string | null;
  placement?: string;
  notes?: string;
};

/** Abas especiais em Minha coleção (não são ids de Set). */
export const TAB_PROMOS = "__promos";
export const TAB_PLAYER = "__player";

export function isSpecialCollectionTab(tab: string | null | undefined): tab is typeof TAB_PROMOS | typeof TAB_PLAYER {
  return tab === TAB_PROMOS || tab === TAB_PLAYER;
}
