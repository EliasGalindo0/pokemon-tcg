export function formatMoney(value: string | number) {
  const amount = typeof value === "string" ? Number(value) : value;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number.isFinite(amount) ? amount : 0);
}

export function formatMoneyOrDash(value: string | null) {
  if (!value) return "—";
  return formatMoney(value);
}

export function moneyToInput(value: string) {
  return value.replace(".", ",");
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(new Date(value));
}

export function lotValue(marketValue: string, quantity: number) {
  const amount = Number(marketValue);
  if (!Number.isFinite(amount)) return formatMoney(0);
  return formatMoney(amount * quantity);
}
