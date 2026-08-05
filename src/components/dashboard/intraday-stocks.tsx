import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDownRight, ArrowUpRight, Info, ChevronRight } from "lucide-react";
import { formatRs, formatChange } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { IntradayPoint } from "@/services/stocks-service";
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
                <strong>Intraday</strong> refers to stock trades and price movements that take place within regular market hours on the same trading day. Intraday data shows real-time price fluctuations before the market closes.
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
    <Card className="gradient-card border-border shadow-card h-105">
      <IntradayCardHeader />
      <CardContent className="p-0">
        <ScrollArea className="h-85 px-6 pb-6">
          <div className="space-y-3">
            {sortedItems.map((s) => {
              const up = s.percentage >= 0;
              const low = s.low ?? s.price * 0.98;
              const high = s.high ?? s.price * 1.02;
              const rangePct = high > low ? Math.min(100, Math.max(0, ((s.price - low) / (high - low)) * 100)) : 50;

              return (
                <div
                  key={s.symbol}
                  onClick={() => onSelectStock?.(s.symbol)}
                  className={cn(
                    "p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-all duration-200 space-y-2 group border border-border/20",
                    onSelectStock && "cursor-pointer hover:border-primary/40",
                  )}
                >
                  {/* Top Row: Symbol, Price, Net Change */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={cn(
                          "size-8 rounded-md flex items-center justify-center shrink-0 font-bold",
                          up ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400",
                        )}
                      >
                        {up ? <ArrowUpRight className="size-4" /> : <ArrowDownRight className="size-4" />}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold truncate">{s.symbol}</div>
                        <div className="text-xs text-muted-foreground truncate">{s.name || formatRs(s.price)}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className="text-sm font-semibold font-mono">{formatRs(s.price)}</div>
                        <div
                          className={cn(
                            "text-xs font-semibold font-mono flex items-center justify-end gap-1",
                            up ? "text-emerald-400" : "text-red-400",
                          )}
                        >
                          <span>{s.percentage >= 0 ? "+" : ""}{s.percentage.toFixed(2)}%</span>
                          {s.change !== undefined && (
                            <span className="opacity-80">({formatChange(s.change)})</span>
                          )}
                        </div>
                      </div>

                      {onSelectStock && (
                        <ChevronRight className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                  </div>

                  {/* Day Range Slider Bar */}
                  <div className="space-y-1 pt-1.5 border-t border-border/20">
                    <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
                      <span>Low: {formatRs(low)}</span>
                      <span className="text-foreground/80 font-medium">Day Range</span>
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
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
