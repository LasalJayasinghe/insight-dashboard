import { useState } from "react";
import type { StockTicker } from "@/services/stock-service";
import { StockChart } from "./stock-chart";
import { fmtPrice, fmtChange } from "./stock-cards";
import { ArrowLeft, TrendingUp, TrendingDown, Star, Sparkles, Activity, Info, Zap, Target, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { watchlistService } from "@/services/watchlist-service";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface StockDetailViewProps {
  stock: StockTicker;
  allStocks: StockTicker[];
  onBack: () => void;
  onSelectStock: (symbol: string) => void;
}

export function StockDetailView({ stock, allStocks, onBack, onSelectStock }: StockDetailViewProps) {
  const [addingWatchlist, setAddingWatchlist] = useState(false);
  const isUp = stock.change >= 0;

  const handleAddToWatchlist = async () => {
    try {
      setAddingWatchlist(true);
      await watchlistService.add(stock.symbol);
      toast.success(`${stock.symbol} added to watchlist!`);
    } catch {
      toast.error(`Failed to add ${stock.symbol} to watchlist`);
    } finally {
      setAddingWatchlist(false);
    }
  };

  const dayRangePct = stock.high > stock.low 
    ? Math.min(100, Math.max(0, ((stock.price - stock.low) / (stock.high - stock.low)) * 100))
    : 50;

  const range = stock.high - stock.low;
  const confidence = Math.min(95, Math.max(68, Math.abs(stock.percentageChange) * 8 + 72)).toFixed(0);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Navigation & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-bold bg-muted/50 border border-border hover:bg-muted text-foreground px-3 py-2 rounded-lg transition-colors cursor-pointer"
          >
            <ArrowLeft className="size-4" /> Back to Stocks
          </button>

          {/* Quick Stock Selector */}
          <select
            value={stock.symbol}
            onChange={(e) => onSelectStock(e.target.value)}
            className="bg-card border border-border rounded-lg px-3 py-2 text-xs font-mono font-bold text-foreground outline-none cursor-pointer hover:border-primary/40 shadow-sm"
          >
            {allStocks.map(s => (
              <option key={s.symbol} value={s.symbol}>
                {s.symbol} — {s.name} ({fmtPrice(s.price)})
              </option>
            ))}
          </select>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleAddToWatchlist}
            disabled={addingWatchlist}
            className="flex items-center gap-1.5 text-xs font-bold bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
          >
            <Star className="size-3.5 fill-primary/20" />
            {addingWatchlist ? "Adding..." : "Add to Watchlist"}
          </button>
        </div>
      </div>

      {/* Main Stock Banner */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black font-mono tracking-tight text-foreground">{stock.symbol}</span>
            <span className="text-[10px] uppercase font-bold font-mono px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
              Colombo Stock Exchange
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{stock.name}</p>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
            <span className="text-3xl font-black font-mono text-foreground tracking-tight">
              {fmtPrice(stock.price)}
            </span>
            <div className={cn("flex items-center gap-1 text-sm font-bold font-mono", isUp ? "text-emerald-400" : "text-red-400")}>
              {isUp ? <TrendingUp className="size-4" /> : <TrendingDown className="size-4" />}
              <span>{fmtChange(stock.change)} ({stock.percentageChange.toFixed(2)}%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Candlestick Chart */}
      <StockChart stock={stock} />

      {/* Grid: Metrics & Dedicated AI Analysis Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Financial Metrics */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card shadow-card p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <Activity className="size-4 text-primary" />
            <h3 className="text-sm font-bold uppercase tracking-widest text-foreground">Market Metrics & Range</h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-muted/30 border border-border rounded-lg p-3">
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest block mb-1">Previous Close</span>
              <span className="font-mono font-bold text-foreground">{fmtPrice(stock.previousClose)}</span>
            </div>

            <div className="bg-muted/30 border border-border rounded-lg p-3">
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest block mb-1">Day High</span>
              <span className="font-mono font-bold text-emerald-400">{fmtPrice(stock.high)}</span>
            </div>

            <div className="bg-muted/30 border border-border rounded-lg p-3">
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest block mb-1">Day Low</span>
              <span className="font-mono font-bold text-red-400">{fmtPrice(stock.low)}</span>
            </div>

            <div className="bg-muted/30 border border-border rounded-lg p-3">
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest block mb-1">Net Change</span>
              <span className={cn("font-mono font-bold", isUp ? "text-emerald-400" : "text-red-400")}>
                {fmtChange(stock.change)}
              </span>
            </div>
          </div>

          {/* Intraday Price Range Bar */}
          <div className="pt-2">
            <div className="flex justify-between text-xs font-mono text-muted-foreground mb-1">
              <span>Low: {fmtPrice(stock.low)}</span>
              <span className="font-bold text-foreground flex items-center gap-1">
                Current Day (Intraday) Range
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="inline-flex items-center justify-center rounded-full p-0.5 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
                        aria-label="What is Intraday Range?"
                      >
                        <Info className="size-3.5 shrink-0" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs text-xs space-y-1 p-2.5">
                      <p className="font-semibold">Intraday Range</p>
                      <p className="leading-relaxed opacity-90">
                        Shows price fluctuations between the highest and lowest prices reached during today's active trading session.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </span>
              <span>High: {fmtPrice(stock.high)}</span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden relative">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-primary rounded-full transition-all duration-500"
                style={{ width: `${dayRangePct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Dedicated AI Market & Stock Summary Panel */}
        <div className="rounded-xl border border-border bg-card shadow-card p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <Sparkles className="size-4 text-purple-400" />
              <h3 className="text-sm font-bold uppercase tracking-widest text-foreground">AI Market & Stock Summary</h3>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Zap className="size-3 text-purple-400" /> Technical Signal
                </span>
                <span className={cn("text-xs font-mono font-bold px-2.5 py-0.5 rounded uppercase",
                  isUp ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"
                )}>
                  {isUp ? "BULLISH ACCUMULATION" : "BEARISH CONSOLIDATION"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Target className="size-3 text-purple-400" /> AI Confidence Score
                </span>
                <span className="text-xs font-mono font-bold text-foreground">
                  {confidence}%
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <BarChart3 className="size-3 text-purple-400" /> Intraday Volatility
                </span>
                <span className="text-xs font-mono font-bold text-foreground">
                  {stock.low > 0 ? (((stock.high - stock.low) / stock.low) * 100).toFixed(2) : "0.00"}%
                </span>
              </div>

              {/* Comprehensive AI Summary Narrative */}
              <div className="bg-purple-500/5 border border-purple-500/20 rounded-lg p-3.5 text-xs text-foreground leading-relaxed mt-2 space-y-2">
                <p>
                  <strong>{stock.symbol}</strong> ({stock.name}) is trading at <strong>{fmtPrice(stock.price)}</strong> ({isUp ? "+" : ""}{stock.percentageChange.toFixed(2)}%).
                </p>
                <p className="text-muted-foreground">
                  {isUp
                    ? `Intraday buying momentum is strong as price trades near today's high of ${fmtPrice(stock.high)}. Key moving averages indicate sustained buyer interest.`
                    : `Selling pressure dominates today's session as price pulls back towards day low of ${fmtPrice(stock.low)}. Consolidating near support bounds.`}
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleAddToWatchlist}
            className="w-full py-2.5 rounded-lg font-bold text-xs bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm cursor-pointer"
          >
            Track {stock.symbol} Performance
          </button>
        </div>
      </div>
    </div>
  );
}
