import { cn } from "@/lib/utils";
import type { StockTicker } from "@/services/stock-service";
import { TrendingUp, TrendingDown, Clock } from "lucide-react";

export function fmtPrice(price: number) {
  return price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function fmtChange(change: number) {
  return (change > 0 ? "+" : "") + change.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

interface StockCardsProps {
  tickers: StockTicker[];
  selectedSymbol: string;
  onSelect: (symbol: string) => void;
  loading: boolean;
}

export function StockCards({ tickers, selectedSymbol, onSelect, loading }: StockCardsProps) {
  // Show skeletons while loading
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-[72px] rounded-xl border border-border bg-card shadow-sm animate-pulse" />
        ))}
      </div>
    );
  }

  // Display top 7 stocks
  const displayTickers = tickers.slice(0, 7);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
      {displayTickers.map(t => {
        const isSelected = selectedSymbol === t.symbol;
        const isUp = t.change >= 0;

        return (
          <button
            key={t.symbol}
            type="button"
            onClick={() => onSelect(t.symbol)}
            className={cn(
              "flex flex-col text-left rounded-xl border p-2.5 transition-all outline-none shadow-sm",
              isSelected
                ? "bg-primary/10 border-primary/60 shadow-elegant"
                : "bg-card border-border hover:border-primary/40 hover:bg-muted/50",
            )}
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-[11px] font-extrabold uppercase tracking-wide font-mono text-foreground truncate max-w-[80%]">
                {t.symbol}
              </span>
              <span className={cn("text-[9px] font-bold font-mono px-1 py-0.5 rounded flex items-center",
                isUp ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
              )}>
                {isUp ? <TrendingUp className="size-2.5 mr-0.5" /> : <TrendingDown className="size-2.5 mr-0.5" />}
                {t.percentageChange.toFixed(1)}%
              </span>
            </div>
            
            <div className="mt-1 flex items-baseline justify-between w-full">
              <span className="text-sm font-black tracking-tight font-mono text-foreground">
                {fmtPrice(t.price)}
              </span>
              <span className={cn("text-[9px] font-bold font-mono",
                isUp ? "text-emerald-400" : "text-red-400"
              )}>
                {fmtChange(t.change)}
              </span>
            </div>

            <div className="mt-1.5 flex items-center justify-between text-[8px] text-muted-foreground font-mono w-full opacity-60">
              <span title="High">H: {fmtPrice(t.high)}</span>
              <span title="Low">L: {fmtPrice(t.low)}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
