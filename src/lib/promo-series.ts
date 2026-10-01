const DEFAULT_PROMO_SERIES: { id: string; name: string }[] = [
  { id: "mep", name: "MEP Black Star Promos" },
  { id: "svp", name: "SVP Black Star Promos" },
  { id: "swshp", name: "SWSH Black Star Promos" },
  { id: "smp", name: "SM Black Star Promos" },
];

export function defaultPromoSeries() {
  return DEFAULT_PROMO_SERIES;
}
