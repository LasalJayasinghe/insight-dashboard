import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { z } from "zod";
import { AppShell } from "@/components/layout/app-shell";
import { StockCards } from "@/components/stocks/stock-cards";
import { MarketOverviewPanel } from "@/components/stocks/market-overview-panel";
import { StockMoversPanel } from "@/components/stocks/stock-movers";
import { StockDetailView } from "@/components/stocks/stock-detail-view";
import { useStocks } from "@/hooks/useStocks";
import { isAuthenticated } from "@/lib/auth";
import { LineChart, RefreshCw, BarChart2 } from "lucide-react";
import { IntradayStocks } from "@/components/dashboard/intraday-stocks";
import { WatchlistTable } from "@/components/dashboard/watchlist-table";
import { stockService, type IntradayPoint } from "@/services/stock-service";
import { watchlistService, type WatchlistStock } from "@/services/watchlist-service";

const stocksSearchSchema = z.object({
  symbol: z.string().optional(),
});

export const Route = createFileRoute("/stocks")({
  validateSearch: (search) => stocksSearchSchema.parse(search),
  beforeLoad: () => {
    if (typeof window !== "undefined" && !isAuthenticated()) throw redirect({ to: "/login" });
  },
  head: () => ({
    meta: [
      { title: "Stocks Dashboard — AlertMe Trading" },
      {
        name: "description",
        content: "Professional stock trading dashboard with CSE market data.",
      },
    ],
  }),
  component: StocksPage,
});

function StocksPage() {
  const routeSearch = Route.useSearch();
  const {
    tickers,
    indices,
    status,
    movers,
    loadingTickers,
    loadingIndices,
    loadingMovers,
    refresh,
  } = useStocks();

  const [selectedSymbol, setSelectedSymbol] = useState<string>("");
  const [viewMode, setViewMode] = useState<"overview" | "detail">("overview");

  const [intraday, setIntraday] = useState<IntradayPoint[]>([]);
  const [watchlistStocks, setWatchlistStocks] = useState<WatchlistStock[]>([]);
  const [watchlistLoading, setWatchlistLoading] = useState(true);

  const [missingTicker, setMissingTicker] = useState<any>(null);

  useEffect(() => {
    if (routeSearch.symbol) {
      setSelectedSymbol(routeSearch.symbol);
      setViewMode("detail");
    }
  }, [routeSearch.symbol]);

  useEffect(() => {
    if (selectedSymbol && tickers.length > 0) {
      const found = tickers.find((t) => t.symbol === selectedSymbol);
      if (!found) {
        stockService
          .getBySymbol(selectedSymbol)
          .then((live) => {
            setMissingTicker({
              symbol: live.symbol,
              name: live.name,
              price: live.price,
              previousClose: live.previousClose,
              high: live.price,
              low: live.price,
              percentageChange: live.changePct,
              change: live.price - live.previousClose,
            });
          })
          .catch(console.error);
      } else {
        setMissingTicker(null);
      }
    }
  }, [selectedSymbol, tickers]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const [intradayResult, watchlistResult] = await Promise.all([
        stockService.getIntraday().catch(() => []),
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

  const activeSymbol = selectedSymbol || (tickers.length > 0 ? tickers[0].symbol : "");
  const activeTicker = tickers.find((t) => t.symbol === activeSymbol) || (missingTicker?.symbol === activeSymbol ? missingTicker : null);

  const handleSelectStock = (symbol: string) => {
    setSelectedSymbol(symbol);
    setViewMode("detail");
  };

  return (
    <AppShell>
      <div className="space-y-5">
        {/* Main Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-border/40 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0">
              <LineChart className="size-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-foreground">
                {viewMode === "detail" && activeTicker
                  ? `${activeTicker.symbol} Stock View`
                  : "Stocks Dashboard"}
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Colombo Stock Exchange (CSE) Live Market Data · Intraday Range · Watchlist · Charts
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {viewMode === "detail" && (
              <button
                onClick={() => setViewMode("overview")}
                className="flex items-center gap-1.5 text-xs font-bold bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 transition-colors px-3 py-2 rounded-lg cursor-pointer"
              >
                <BarChart2 className="size-3.5" /> All Stocks Overview
              </button>
            )}
            <button
              onClick={refresh}
              className="flex items-center gap-1.5 text-xs font-bold bg-card border border-border hover:bg-muted/80 text-foreground shadow-xs transition-colors px-3.5 py-2 rounded-lg cursor-pointer"
            >
              <RefreshCw className="size-3.5" /> Refresh Data
            </button>
          </div>
        </div>

        {/* View Switcher: Detail View vs Main Dashboard */}
        {viewMode === "detail" && activeTicker ? (
          <StockDetailView
            stock={activeTicker}
            allStocks={tickers}
            onBack={() => setViewMode("overview")}
            onSelectStock={setSelectedSymbol}
          />
        ) : (
          <div className="space-y-6">
            {/* Sleek Horizontal Market Status & Indices Ticker Bar */}
            <MarketOverviewPanel indices={indices} status={status} loading={loadingIndices} />

            {/* Top Clickable Tickers Carousel Strip */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-muted-foreground uppercase tracking-wider font-semibold">
                <span>Top Tickers</span>
                <span className="text-[10px] lowercase text-muted-foreground/70">
                  Click symbol to view interactive chart
                </span>
              </div>
              <StockCards
                tickers={tickers}
                selectedSymbol={activeSymbol}
                onSelect={handleSelectStock}
                loading={loadingTickers}
              />
            </div>

            {/* PRIORITY 1: Intraday Stocks & Watchlist Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <IntradayStocks
                items={intraday}
                loading={watchlistLoading}
                onSelectStock={handleSelectStock}
              />
              <WatchlistTable
                stocks={watchlistStocks}
                loading={watchlistLoading}
                onSelectStock={handleSelectStock}
              />
            </div>

            {/* SECONDARY: Top Movers Panel */}
            <div className="pb-6">
              <StockMoversPanel
                movers={movers}
                loading={loadingMovers}
                onSelectStock={handleSelectStock}
              />
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
