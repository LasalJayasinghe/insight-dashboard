// Number formatting for the portfolio trading desk.

export function fmt(val: number, decimals = 2) {
  return val.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/** "+1,234.50" / "-12.00" */
export function signed(val: number, decimals = 2) {
  return `${val > 0 ? "+" : ""}${fmt(val, decimals)}`;
}

/** Quantities: up to 8 decimals for crypto, trailing zeros trimmed. */
export function fmtQty(q: number) {
  return fmt(q, 8).replace(/\.?0+$/, "");
}

/** Compact volumes/turnover: 1.2K, 3.45M, 6.7B. */
export function fmtCompact(n: number | null | undefined) {
  if (n === null || n === undefined) return "—";
  const abs = Math.abs(n);
  if (abs >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return fmt(n, 0);
}

/** Prices: 2 decimals for CSE (LKR), up to 6 for small crypto prices. */
export function fmtPrice(n: number, currency: string) {
  if (currency === "LKR") return fmt(n, 2);
  return Math.abs(n) >= 1 ? fmt(n, 4) : fmt(n, 6);
}

export function toneOf(n: number) {
  return n > 0 ? "text-success" : n < 0 ? "text-destructive" : "text-muted-foreground";
}
