import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { StockCards } from "@/components/stocks/stock-cards";
import { MarketOverviewPanel } from "@/components/stocks/market-overview-panel";
import { StockMoversPanel } from "@/components/stocks/stock-movers";
import { AiStockSummaryPanel } from "@/components/stocks/ai-stock-summary";
import { StockDetailView } from "@/components/stocks/stock-detail-view";
import { useStocks } from "@/hooks/useStocks";
import { isAuthenticated } from "@/lib/auth";
import { LineChart, RefreshCw, BarChart2, Clock3 } from "lucide-react";
import { IntradayStocks } from "@/components/dashboard/intraday-stocks";
import { WatchlistTable } from "@/components/dashboard/watchlist-table";
import { stocksService, type IntradayPoint } from "@/services/stocks-service";
import { watchlistService, type WatchlistStock } from "@/services/watchlist-service";

export const Route = createFileRoute("/stocks")({
  beforeLoad: () => {
    if (typeof window !== "undefined" && !isAuthenticated()) throw redirect({ to: "/login" });
  },
  head: () => ({
    meta: [
      { title: "Stocks Dashboard — AlertMe Trading" },
      { name: "description", content: "Professional stock trading dashboard with CSE market data." },
    ],
  }),
  component: StocksPage,
});

function StocksPage() {
  const {
    tickers,
    indices,
    status,
    movers,
    loadingTickers,
    loadingIndices,
    loadingMovers,
    refresh
  } = useStocks();

  const [selectedSymbol, setSelectedSymbol] = useState<string>("");
  const [viewMode, setViewMode] = useState<"overview" | "detail">("overview");

  const [intraday, setIntraday] = useState<IntradayPoint[]>([]);
  const [watchlistStocks, setWatchlistStocks] = useState<WatchlistStock[]>([]);
  const [watchlistLoading, setWatchlistLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const [intradayResult, watchlistResult] = await Promise.all([
        stocksService.getIntraday().catch(() => []),
        watchlistService.list().catch(() => []),
      ]);

      if (cancelled) return;

      setIntraday(intradayResult);
      setWatchlistStocks(watchlistResult);
      setWatchlistLoading(false);
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const marketStatusLabel = useMemo(() => {
    if (!status) return "Market status unavailable";
    if (!status.isTradingDay) return "Market closed (non-trading day)";
    return status.isOpen ? "Market open" : "Market closed";
  }, [status]);

  const marketStatusTone = status?.isOpen ? "bg-success" : "bg-destructive";

  const activeSymbol = selectedSymbol || (tickers.length > 0 ? tickers[0].symbol : "");
  const activeTicker = tickers.find(t => t.symbol === activeSymbol) || null;

  const handleSelectStock = (symbol: string) => {
    setSelectedSymbol(symbol);
    setViewMode("detail");
  };

  return (
    <AppShell>
      <div className="space-y-5">
        
        {/* Header */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <LineChart className="size-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              {viewMode === "detail" && activeTicker ? `${activeTicker.symbol} Stock View` : "Stocks Dashboard"}
            </h1>
            <div className="flex items-center gap-3">
              <p className="text-xs text-muted-foreground">CSE Market Data · Interactive Charts · AI Summary</p>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground border-l border-border pl-3">
                <Clock3 className="size-3.5" />
                <span className={`size-1.5 rounded-full ${marketStatusTone} ${status?.isOpen ? "animate-pulse" : ""}`} />
                {marketStatusLabel}
              </div>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {viewMode === "detail" ? (
              <button
                onClick={() => setViewMode("overview")}
                className="flex items-center gap-1.5 text-xs font-bold bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 transition-colors px-3 py-1.5 rounded-md"
              >
                <BarChart2 className="size-3.5" /> All Stocks Overview
              </button>
            ) : null}
            <button
              onClick={refresh}
              className="flex items-center gap-1.5 text-xs font-bold bg-card border border-border hover:bg-muted/80 text-foreground shadow-sm transition-colors px-3 py-1.5 rounded-md"
            >
              <RefreshCw className="size-3" /> Refresh
            </button>
          </div>
        </div>

        {/* View Switcher: Stock Detail View vs Overview Dashboard */}
        {viewMode === "detail" && activeTicker ? (
          <StockDetailView
            stock={activeTicker}
            allStocks={tickers}
            onBack={() => setViewMode("overview")}
            onSelectStock={setSelectedSymbol}
          />
        ) : (
          <>
            {/* Top Tickers */}
            <StockCards
              tickers={tickers}
              selectedSymbol={activeSymbol}
              onSelect={handleSelectStock}
              loading={loadingTickers}
            />

            {/* Market Overview */}
            <MarketOverviewPanel
              indices={indices}
              status={status}
              loading={loadingIndices}
            />

            {/* Split Panels: AI Summary + Top Movers */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pb-4">
              <AiStockSummaryPanel
                selectedStock={activeTicker}
                loading={loadingTickers}
              />
              <StockMoversPanel
                movers={movers}
                loading={loadingMovers}
              />
            </div>

            {/* Split Panels: Intraday + Watchlist */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pb-4">
              <IntradayStocks items={intraday} loading={watchlistLoading} />
              <WatchlistTable stocks={watchlistStocks} loading={watchlistLoading} />
            </div>
          </>
        )}

      </div>
    </AppShell>
  );
}
