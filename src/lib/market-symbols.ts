// Non-stock symbols that price alerts support (mirrors MarketPriceResolver on the API).
// They contain no dot, so they never clash with CSE codes like "COMB.N0000".

export type MarketSymbolKind = "Index" | "Crypto" | "Fx";

export interface MarketSymbol {
  symbol: string;
  label: string;
  kind: MarketSymbolKind;
  /** Unit shown after the value; "LKR" values are shown as "Rs …". */
  unit: "pts" | "USDT" | "LKR";
  decimals: number;
}

export const MARKET_SYMBOLS: MarketSymbol[] = [
  { symbol: "ASPI", label: "ASPI Index", kind: "Index", unit: "pts", decimals: 2 },
  { symbol: "SNPSL20", label: "S&P SL20 Index", kind: "Index", unit: "pts", decimals: 2 },
  { symbol: "BTCUSDT", label: "BTC/USDT", kind: "Crypto", unit: "USDT", decimals: 2 },
  { symbol: "SOLUSDT", label: "SOL/USDT", kind: "Crypto", unit: "USDT", decimals: 4 },
  { symbol: "USDTLKR", label: "USDT/LKR", kind: "Fx", unit: "LKR", decimals: 2 },
];

const BY_SYMBOL = new Map(MARKET_SYMBOLS.map((m) => [m.symbol, m]));

export function marketSymbolOf(symbol: string): MarketSymbol | undefined {
  return BY_SYMBOL.get(symbol.trim().toUpperCase());
}

/** "ASPI Index" / "BTC/USDT", or the symbol itself for CSE stocks. */
export function alertSymbolLabel(symbol: string): string {
  return marketSymbolOf(symbol)?.label ?? symbol;
}

/** "21,743.33 pts" / "95,000.00 USDT" / "Rs. 151.75". */
export function formatAlertPrice(symbol: string, value: number): string {
  const m = marketSymbolOf(symbol);
  const decimals = m?.decimals ?? 2;
  const n = value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  if (!m || m.unit === "LKR") return `Rs. ${n}`;
  return `${n} ${m.unit}`;
}
