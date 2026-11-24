import { useState } from "react";
import type { StockTicker } from "@/services/stock-service";
import { StockChart } from "./stock-chart";
import { fmtPrice, fmtChange } from "./format";
import { ArrowLeft, TrendingUp, TrendingDown, Star, Activity, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { watchlistService } from "@/services/watchlist-service";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { StockDividendPanel } from "./stock-dividend-panel";
import { StockTechnicalSummary } from "./stock-technical-summary";
import { StockFundamentalsPanel } from "./stock-fundamentals";
import { MarketNewsFeed } from "@/components/dashboard/market-news-feed";

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

  const dayRangePct =
    stock.high > stock.low
      ? Math.min(100, Math.max(0, ((stock.price - stock.low) / (stock.high - stock.low)) * 100))
      : 50;

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
            <span className="text-2xl font-black font-mono tracking-tight text-foreground">
              {stock.symbol}
            </span>
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
            <div
              className={cn(
                "flex items-center gap-1 text-sm font-bold font-mono",
                isUp ? "text-emerald-400" : "text-red-400",
              )}
            >
              {isUp ? <TrendingUp className="size-4" /> : <TrendingDown className="size-4" />}
              <span>
                {fmtChange(stock.change)} ({stock.percentageChange.toFixed(2)}%)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Candlestick Chart */}
      <StockChart stock={stock} />

      {/* NAV, P/BV, EPS, P/E, ROE, yield, float, beta — from the latest interim report */}
      <StockFundamentalsPanel symbol={stock.symbol} />

      {/* Dividend Panel */}
      <StockDividendPanel symbol={stock.symbol} />

      {/* Grid: Metrics & Technical Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Financial Metrics */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card shadow-card p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <Activity className="size-4 text-primary" />
            <h3 className="text-sm font-bold uppercase tracking-widest text-foreground">
              Market Metrics & Range
            </h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-muted/30 border border-border rounded-lg p-3">
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest block mb-1">
                Previous Close
              </span>
              <span className="font-mono font-bold text-foreground">
                {fmtPrice(stock.previousClose)}
              </span>
            </div>

            <div className="bg-muted/30 border border-border rounded-lg p-3">
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest block mb-1">
                Day High
              </span>
              <span className="font-mono font-bold text-emerald-400">{fmtPrice(stock.high)}</span>
            </div>

            <div className="bg-muted/30 border border-border rounded-lg p-3">
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest block mb-1">
                Day Low
              </span>
              <span className="font-mono font-bold text-red-400">{fmtPrice(stock.low)}</span>
            </div>

            <div className="bg-muted/30 border border-border rounded-lg p-3">
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest block mb-1">
                Net Change
              </span>
              <span
                className={cn("font-mono font-bold", isUp ? "text-emerald-400" : "text-red-400")}
              >
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
                        Shows price fluctuations between the highest and lowest prices reached
                        during today's active trading session.
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

        {/* Technical summary from real CSE price history (replaces the old hard-coded "AI" panel) */}
        <div className="flex flex-col gap-3">
          <StockTechnicalSummary stock={stock} />
          <button
            type="button"
            onClick={handleAddToWatchlist}
            className="w-full py-2.5 rounded-lg font-bold text-xs bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm cursor-pointer"
          >
            Track {stock.symbol} Performance
          </button>
        </div>
      </div>

      {/* Stock-specific news with payment-date emphasis for dividend stories */}
      <MarketNewsFeed
        symbolFilter={stock.symbol}
        title={`${stock.symbol} News & Dividend Payment Timeline`}
        maxHeight="h-[480px]"
      />
    </div>
  );
}
