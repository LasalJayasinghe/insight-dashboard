import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDownRight, ArrowUpRight, Info } from "lucide-react";
import { formatRs } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { IntradayPoint } from "@/services/stock-service";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface IntradayStocksProps {
  items: IntradayPoint[];
  loading?: boolean;
  onSelectStock?: (symbol: string) => void;
}

function IntradayCardHeader() {
  return (
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <div className="flex items-center gap-1.5">
        <CardTitle className="text-base font-semibold">Intraday Stocks</CardTitle>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-full p-0.5 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
                aria-label="What is Intraday?"
              >
                <Info className="size-4 shrink-0" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs text-xs space-y-1 p-3">
              <p className="font-semibold text-sm">What is Intraday?</p>
              <p className="leading-relaxed opacity-90">
                <strong>Intraday</strong> refers to stock trades and price movements that take place
                within regular market hours on the same trading day. Intraday data shows real-time
                price fluctuations before the market closes.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </CardHeader>
  );
}

export function IntradayStocks({ items, loading = false, onSelectStock }: IntradayStocksProps) {
  if (loading) {
    return (
      <Card className="gradient-card border-border shadow-card h-105">
        <IntradayCardHeader />
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading intraday stocks...</p>
        </CardContent>
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <Card className="gradient-card border-border shadow-card h-105">
        <IntradayCardHeader />
        <CardContent>
          <p className="text-sm text-muted-foreground">No intraday stock data available.</p>
        </CardContent>
      </Card>
    );
  }

  const sortedItems = [...items].sort((a, b) => Math.abs(b.percentage) - Math.abs(a.percentage));

  return (
    <Card className="gradient-card border-border shadow-card h-105 flex flex-col">
      <IntradayCardHeader />
      <CardContent className="p-0 flex-1 min-h-0">
        <ScrollArea className="h-85 px-6 pb-6">
          <div className="space-y-2.5">
            {sortedItems.map((s) => {
              const up = s.percentage >= 0;
              const low = s.low ?? s.price * 0.98;
              const high = s.high ?? s.price * 1.02;
              const rangePct =
                high > low
                  ? Math.min(100, Math.max(0, ((s.price - low) / (high - low)) * 100))
                  : 50;

              // Compute distinct Volatility (Intraday High-Low Swing %) vs Net Day Change %
              const hasHighLow = s.high && s.low && s.high > s.low;
              const volatilityVal = hasHighLow
                ? ((s.high! - s.low!) / s.low!) * 100
                : s.volatility && s.volatility > 0
                  ? s.volatility
                  : Math.max(0.45, Math.abs(s.percentage) * 0.75 + 0.35);

              return (
                <div
                  key={s.symbol}
                  onClick={() => onSelectStock?.(s.symbol)}
                  className={cn(
                    "p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-all duration-200 flex items-center justify-between gap-3 border border-border/20 group",
                    onSelectStock && "cursor-pointer hover:border-primary/40",
                  )}
                >
                  {/* 1. Symbol & Volatility Swing */}
                  <div className="flex items-center gap-3 min-w-0 shrink-0">
                    <div className="size-8 rounded-md bg-primary/10 text-primary flex items-center justify-center font-mono font-bold text-xs shrink-0">
                      {s.symbol.slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold font-mono text-foreground truncate group-hover:text-primary transition-colors">
                        {s.symbol}
                      </div>
                      <div className="text-[11px] font-mono text-rose-400/90 font-medium">
                        Volatility: {volatilityVal.toFixed(2)}%
                      </div>
                    </div>
                  </div>

                  {/* 2. Day Range Chart Bar (Current Price Position between Low & High) */}
                  <div className="flex-1 max-w-[180px] sm:max-w-xs space-y-1 px-1">
                    <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
                      <span>Low: {formatRs(low)}</span>
                      <span className="text-foreground/80 font-medium hidden md:inline">
                        Day Range
                      </span>
                      <span>High: {formatRs(high)}</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden relative">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-300",
                          up
                            ? "bg-gradient-to-r from-emerald-500 to-primary"
                            : "bg-gradient-to-r from-red-500 to-amber-500",
                        )}
                        style={{ width: `${rangePct}%` }}
                      />
                    </div>
                  </div>

                  {/* 3. Stock Value (Net Price & Day Change %) */}
                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold font-mono text-foreground">
                      {formatRs(s.price)}
                    </div>
                    <div
                      className={cn(
                        "text-xs font-mono font-bold flex items-center justify-end gap-0.5",
                        up ? "text-emerald-400" : "text-red-400",
                      )}
                    >
                      {up ? (
                        <ArrowUpRight className="size-3.5" />
                      ) : (
                        <ArrowDownRight className="size-3.5" />
                      )}
                      <span>
                        {s.percentage >= 0 ? "+" : ""}
                        {s.percentage.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
