export type GlobalSearchHit = {
  id: string;
  kind: "card" | "deck" | "trade";
  title: string;
  subtitle: string;
  href: string;
  imageUrl: string | null;
};

export type GlobalSearchResult = {
  q: string;
  cards: GlobalSearchHit[];
  decks: GlobalSearchHit[];
  trades: GlobalSearchHit[];
};
