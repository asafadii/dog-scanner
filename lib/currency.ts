export const CURRENCY_SYMBOLS: Record<string, string> = {
  EUR: "€",
  GBP: "£",
  HUF: "Ft",
  USD: "$",
  CHF: "CHF",
  CZK: "Kč",
  PLN: "zł",
  RON: "lei",
  SEK: "kr",
  NOK: "kr",
  DKK: "kr",
};

export function getCurrencySymbol(currency: string): string {
  return CURRENCY_SYMBOLS[currency] ?? currency;
}

export function formatAmount(value: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-IE", {
      style: "currency",
      currency,
    }).format(value);
  } catch {
    return `${getCurrencySymbol(currency)}${value.toFixed(2)}`;
  }
}
