import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PortfolioChart } from "@/components/dashboard/portfolio-chart";
import { IntradayStocks } from "@/components/dashboard/intraday-stocks";
import { stocksService, type IntradayPoint } from "@/services/stocks-service";
import { isAuthenticated } from "@/lib/auth";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: () => {
    if (typeof window !== "undefined" && !isAuthenticated()) {
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

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const intradayResult = await stocksService.getIntraday().catch(() => []);

      if (cancelled) return;

      setIntraday(intradayResult);
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


  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-2">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
              Good morning, {typeof window !== "undefined" ? localStorage.getItem("firstName") : ""}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Live portfolio overview.
            </p>
          </div>
        </div>

        <PortfolioChart data={chartData} />
      </div>
    </AppShell>
  );
}
