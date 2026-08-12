import { cn } from "@/lib/utils";
import type { StockTicker } from "@/services/stock-service";
import { Sparkles, Loader2, ArrowRight } from "lucide-react";
import { fmtPrice, fmtChange } from "./stock-cards";

interface AiStockSummaryProps {
  selectedStock: StockTicker | null;
  loading: boolean;
}

export function AiStockSummaryPanel({ selectedStock, loading }: AiStockSummaryProps) {
  return (
    <div className="rounded-xl border border-border bg-card shadow-card flex flex-col min-h-[300px]">
      <div className="flex items-center px-4 py-3 border-b border-border gap-2">
        <Sparkles className="size-4 text-purple-400" />
        <span className="text-sm font-bold uppercase tracking-widest text-foreground">
          AI Market Summary
        </span>
      </div>

      <div className="p-5 flex-1 flex flex-col">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-muted-foreground animate-pulse">
            <Loader2 className="size-6 animate-spin text-purple-400" />
            <span className="text-xs font-mono uppercase">Analyzing Market Data...</span>
          </div>
        ) : !selectedStock ? (
          <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
            Select a stock to view analysis
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black text-foreground font-mono">
                  {selectedStock.symbol}
                </h3>
                <p className="text-xs text-muted-foreground">{selectedStock.name}</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black font-mono block">
                  {fmtPrice(selectedStock.price)}
                </span>
                <span
                  className={cn(
                    "text-sm font-bold font-mono",
                    selectedStock.change >= 0 ? "text-emerald-400" : "text-red-400",
                  )}
                >
                  {fmtChange(selectedStock.change)} ({selectedStock.percentageChange.toFixed(2)}%)
                </span>
              </div>
            </div>

            <div className="bg-purple-500/5 border border-purple-500/20 rounded-lg p-4 text-sm leading-relaxed text-foreground">
              {generateSimpleAnalysis(selectedStock)}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted/30 border border-border rounded-lg p-3">
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest block mb-1">
                  Today's High
                </span>
                <span className="font-mono font-bold text-foreground">
                  {fmtPrice(selectedStock.high)}
                </span>
              </div>
              <div className="bg-muted/30 border border-border rounded-lg p-3">
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest block mb-1">
                  Today's Low
                </span>
                <span className="font-mono font-bold text-foreground">
                  {fmtPrice(selectedStock.low)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function generateSimpleAnalysis(stock: StockTicker): React.ReactNode {
  const range = stock.high - stock.low;
  const isUp = stock.change >= 0;
  const closeToHigh = stock.high > 0 && (stock.high - stock.price) / stock.high < 0.01;
  const closeToLow = stock.low > 0 && (stock.price - stock.low) / stock.low < 0.01;

  let text = `${stock.symbol} is currently trading at ${fmtPrice(stock.price)}, which is a ${stock.percentageChange.toFixed(2)}% ${isUp ? "increase" : "decrease"} from its previous close. `;

  if (range === 0) {
    text += `The stock has seen no volatility today, trading completely flat.`;
  } else {
    text += `The day's trading range has been ${fmtPrice(range)} (between ${fmtPrice(stock.low)} and ${fmtPrice(stock.high)}). `;

    if (closeToHigh) {
      text += `Notably, it is currently trading very close to its daily high, showing strong buying pressure.`;
    } else if (closeToLow) {
      text += `It is currently trading near its daily low, indicating selling pressure.`;
    } else {
      text += `It is currently trading within the middle of its daily range.`;
    }
  }

  return (
    <>
      <p className="mb-2">{text}</p>
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-purple-500/10">
        <span className="text-[10px] font-bold uppercase tracking-widest text-purple-400">
          Verdict
        </span>
        <ArrowRight className="size-3 text-purple-400" />
        <span className="text-xs font-bold text-foreground">
          {isUp && closeToHigh
            ? "Strong Bullish"
            : isUp
              ? "Bullish"
              : !isUp && closeToLow
                ? "Strong Bearish"
                : "Bearish"}
        </span>
      </div>
    </>
  );
}
