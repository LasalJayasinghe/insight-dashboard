import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { StockCards } from "@/components/stocks/stock-cards";
import { MarketOverviewPanel } from "@/components/stocks/market-overview-panel";
import { StockMoversPanel } from "@/components/stocks/stock-movers";
import { AiStockSummaryPanel } from "@/components/stocks/ai-stock-summary";
import { useStocks } from "@/hooks/useStocks";
import { isAuthenticated } from "@/lib/auth";
import { LineChart, RefreshCw } from "lucide-react";

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

  // Select the first ticker by default if none is selected
  const activeSymbol = selectedSymbol || (tickers.length > 0 ? tickers[0].symbol : "");
  const activeTicker = tickers.find(t => t.symbol === activeSymbol) || null;

  return (
    <AppShell>
      <div className="space-y-5">
        
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <LineChart className="size-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Stocks Dashboard</h1>
            <p className="text-xs text-muted-foreground">CSE Market Data · Top Movers · AI Summary</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={refresh}
              className="flex items-center gap-1.5 text-xs font-bold bg-[#161b27] border border-white/10 hover:bg-white/5 transition-colors px-3 py-1.5 rounded-md"
            >
              <RefreshCw className="size-3" /> Refresh
            </button>
          </div>
        </div>

        {/* Top Tickers */}
        <StockCards
          tickers={tickers}
          selectedSymbol={activeSymbol}
          onSelect={setSelectedSymbol}
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

      </div>
    </AppShell>
  );
}
