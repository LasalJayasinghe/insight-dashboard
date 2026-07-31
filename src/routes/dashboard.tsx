import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PortfolioChart } from "@/components/dashboard/portfolio-chart";
import { WatchlistTable } from "@/components/dashboard/watchlist-table";
import { IntradayStocks } from "@/components/dashboard/intraday-stocks";
import { Clock3 } from "lucide-react";
import { isAuthenticated } from "@/lib/auth";
import { stocksService, type IntradayPoint, type MarketStatus } from "@/services/stocks-service";
import { watchlistService, type WatchlistStock } from "@/services/watchlist-service";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: () => {
    if (!isAuthenticated()) {
      throw redirect({ to: "/login" });
    }
  },
  head: () => ({
    meta: [
      { title: "Dashboard — AlertMe Trading" },
      { name: "description", content: "Live portfolio overview, watchlist, and activity." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const [intraday, setIntraday] = useState<IntradayPoint[]>([]);
  const [watchlistStocks, setWatchlistStocks] = useState<WatchlistStock[]>([]);
  const [watchlistLoading, setWatchlistLoading] = useState(true);
  const [marketStatus, setMarketStatus] = useState<MarketStatus | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const [intradayResult, watchlistResult, marketStatusResult] = await Promise.all([
        stocksService.getIntraday().catch(() => []),
        watchlistService.list().catch(() => []),
        stocksService.getMarketStatus(),
      ]);

      if (cancelled) return;

      setIntraday(intradayResult);
      setWatchlistStocks(watchlistResult);
      setMarketStatus(marketStatusResult);
      setWatchlistLoading(false);
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const chartData = useMemo(() => {
    if (intraday.length === 0) return undefined;
    return intraday.slice(0, 30).map((p, idx) => ({ day: idx + 1, value: Number(p.price) }));
  }, [intraday]);

  const marketStatusLabel = useMemo(() => {
    if (!marketStatus) return "Market status unavailable";
    if (!marketStatus.isTradingDay) return "Market closed (non-trading day)";
    return marketStatus.isOpen ? "Market open" : "Market closed";
  }, [marketStatus]);

  const marketStatusTone = marketStatus?.isOpen ? "bg-success" : "bg-destructive";

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-2">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
              Good morning, {localStorage.getItem("firstName")} 
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Live stock market snapshot and your tracked symbols.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock3 className="size-4" />
            <span className={`size-2 rounded-full ${marketStatusTone} ${marketStatus?.isOpen ? "animate-pulse" : ""}`} />
            {marketStatusLabel}
          </div>
        </div>

        <PortfolioChart data={chartData} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <IntradayStocks items={intraday} loading={watchlistLoading} />
          <WatchlistTable stocks={watchlistStocks} loading={watchlistLoading} />
        </div>
      </div>
    </AppShell>
  );
}
