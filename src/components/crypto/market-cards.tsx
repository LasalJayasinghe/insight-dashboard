import { cn } from "@/lib/utils";
import type { TickerData } from "@/services/crypto-service";
import { useEffect, useRef } from "react";

export const COIN_META: Record<string, { name: string; base: string; color: string }> = {
  BTCUSDT: { name: "Bitcoin", base: "BTC", color: "#f7931a" },
  ETHUSDT: { name: "Ethereum", base: "ETH", color: "#627eea" },
  BNBUSDT: { name: "BNB", base: "BNB", color: "#f3ba2f" },
  SOLUSDT: { name: "Solana", base: "SOL", color: "#9945ff" },
  XRPUSDT: { name: "XRP", base: "XRP", color: "#00aae4" },
  ADAUSDT: { name: "Cardano", base: "ADA", color: "#0033ad" },
  DOGEUSDT: { name: "Dogecoin", base: "DOGE", color: "#c2a633" },
};

export const TRACKED_SYMBOLS = Object.keys(COIN_META);

export function fmtPrice(n: number) {
  if (n >= 1000)
    return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (n >= 1) return "$" + n.toFixed(4);
  return "$" + n.toFixed(6);
}

export function fmtVolume(n: number) {
  if (n >= 1e9) return (n / 1e9).toFixed(2) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(2) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(2) + "K";
  return n.toFixed(2);
}

// ── Single Market Card ────────────────────────────────────────────────────────

interface MarketCardProps {
  symbol: string;
  ticker?: TickerData;
  selected?: boolean;
  onClick: () => void;
}

export function MarketCard({ symbol, ticker, selected, onClick }: MarketCardProps) {
  const meta = COIN_META[symbol] ?? {
    base: symbol.replace("USDT", ""),
    color: "#888",
    name: symbol,
  };
  const prevPrice = useRef<number | null>(null);
  const priceRef = useRef<HTMLSpanElement>(null);

  // Flash animation on price change
  useEffect(() => {
    if (!ticker || !priceRef.current) return;
    if (prevPrice.current !== null && prevPrice.current !== ticker.lastPrice) {
      const up = ticker.lastPrice > prevPrice.current;
      const cls = up ? "price-flash-up" : "price-flash-down";
      priceRef.current.classList.remove("price-flash-up", "price-flash-down");
      void priceRef.current.offsetWidth;
      priceRef.current.classList.add(cls);
      setTimeout(() => priceRef.current?.classList.remove(cls), 500);
    }
    prevPrice.current = ticker.lastPrice;
  }, [ticker?.lastPrice]);

  const pct = ticker?.priceChangePercent ?? 0;
  const isUp = pct >= 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex flex-col gap-1 rounded-xl border p-3.5 text-left transition-all duration-200 shadow-card",
        "hover:-translate-y-0.5 hover:shadow-lg cursor-pointer",
        selected
          ? "border-primary/60 bg-primary/10 shadow-elegant"
          : "border-border bg-card hover:border-primary/40 hover:bg-muted/40",
      )}
    >
      {/* Top stripe on hover */}
      <span className="absolute top-0 left-4 right-4 h-px rounded-full bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
        <span
          className="inline-flex items-center justify-center rounded-full text-white text-[9px] font-bold shrink-0 shadow-sm"
          style={{ background: meta.color, width: 18, height: 18 }}
        >
          {meta.base[0]}
        </span>
        {meta.base}/USDT
      </div>

      {!ticker ? (
        <>
          <div className="h-5 w-24 rounded animate-pulse bg-muted" />
          <div className="h-3.5 w-14 rounded animate-pulse bg-muted" />
        </>
      ) : (
        <>
          <span
            ref={priceRef}
            className="text-[15px] font-bold font-mono text-foreground transition-colors"
          >
            {fmtPrice(ticker.lastPrice)}
          </span>
          <span
            className={cn(
              "text-xs font-semibold font-mono",
              isUp ? "text-emerald-400" : "text-red-400",
            )}
          >
            {isUp ? "+" : ""}
            {pct.toFixed(2)}%
          </span>
          <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 mt-1">
            {[
              ["H", fmtPrice(ticker.high24h)],
              ["L", fmtPrice(ticker.low24h)],
              ["Vol", fmtVolume(ticker.quoteVolume)],
            ].map(([label, val]) => (
              <div key={label} className="flex flex-col">
                <span className="text-[9px] text-muted-foreground uppercase">{label}</span>
                <span className="text-[10px] font-mono text-foreground/70">{val}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </button>
  );
}

// ── Market Cards Grid ─────────────────────────────────────────────────────────

interface MarketCardsProps {
  tickers: Record<string, TickerData>;
  selectedSymbol: string;
  onSelect: (symbol: string) => void;
}

export function MarketCards({ tickers, selectedSymbol, onSelect }: MarketCardsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 mb-5">
      {TRACKED_SYMBOLS.map((sym) => (
        <MarketCard
          key={sym}
          symbol={sym}
          ticker={tickers[sym]}
          selected={selectedSymbol === sym}
          onClick={() => onSelect(sym)}
        />
      ))}
    </div>
  );
}
