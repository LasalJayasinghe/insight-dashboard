import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { isAuthenticated } from "@/lib/auth";
import { Bento, Cell, CellLabel, Delta, Figure, Masthead } from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatRs, formatPct } from "@/lib/format";
import {
  portfolioService,
  type NetWorthOverviewDto,
  type PortfolioSummaryDto,
} from "@/services/portfolio-service";
import {
  stockService,
  type StockIndices,
  type StockMovers,
  type MarketStatus,
} from "@/services/stock-service";
import { MarketNewsFeed } from "@/components/dashboard/market-news-feed";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: () => {
    if (typeof window !== "undefined" && !isAuthenticated()) {
      throw redirect({ to: "/login" });
    }
  },
  head: () => ({
    meta: [
      { title: "Daily Ledger — AlertMe Trading Desk" },
      {
        name: "description",
        content:
          "Net worth, portfolio performance, index levels and the day's movers in one editorial dashboard.",
      },
      { property: "og:title", content: "Daily Ledger — AlertMe Trading Desk" },
      {
        property: "og:description",
        content: "Net worth, portfolio performance and the day's movers at a glance.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DashboardPage,
});

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
};

function DashboardPage() {
  const firstName = typeof window !== "undefined" ? localStorage.getItem("firstName") : "";

  const [netWorth, setNetWorth] = useState<NetWorthOverviewDto | null>(null);
  const [indices, setIndices] = useState<StockIndices | null>(null);
  const [movers, setMovers] = useState<StockMovers | null>(null);
  const [market, setMarket] = useState<MarketStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      const [nw, idx, mv, ms] = await Promise.all([
        portfolioService.getNetWorth("LKR").catch(() => null),
        stockService.getIndices().catch(() => null),
        stockService.getMovers().catch(() => null),
        stockService.getMarketStatus().catch(() => null),
      ]);
      if (!mounted) return;
      setNetWorth(nw);
      setIndices(idx);
      setMovers(mv);
      setMarket(ms);
      setIsLoading(false);
    };

    void load();
    return () => {
      mounted = false;
    };
  }, []);

  const portfolios = netWorth?.portfolios ?? [];
  const ranked = [...portfolios].sort(
    (a, b) => b.totalProfitLossPercent - a.totalProfitLossPercent,
  );
  const best: PortfolioSummaryDto | undefined = ranked[0];
  const worst: PortfolioSummaryDto | undefined =
    ranked.length > 1 ? ranked[ranked.length - 1] : undefined;

  let totalPnlPercent = 0;
  if (netWorth && netWorth.totalNetWorthLkr > 0) {
    const totalCost = netWorth.totalNetWorthLkr - netWorth.totalProfitLossLkr;
    if (totalCost > 0) totalPnlPercent = (netWorth.totalProfitLossLkr / totalCost) * 100;
  }

  const totalNetWorthText = formatRs(netWorth?.totalNetWorthLkr ?? 0);
  const totalNetWorthFigureSize = totalNetWorthText.length > 18 ? "md" : "xl";

  const getLkrValue = (p: typeof portfolios[0]) => {
    return p.type === "Crypto"
      ? Math.abs(p.totalValue) * (netWorth?.usdtToLkrRate || 1)
      : Math.abs(p.totalValue);
  };

  const totalValue = portfolios.reduce((s, p) => s + getLkrValue(p), 0) || 1;
  const holdings = portfolios.reduce((s, p) => s + p.holdingCount, 0);
  const gainers = movers?.gainers?.slice(0, 5) ?? [];
  const losers = movers?.losers?.slice(0, 5) ?? [];

  const dateLine = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <AppShell>
      <div className="mx-auto max-w-[1500px] space-y-6">
        {/* ── Masthead Header ───────────────────────────────────────────── */}
        <Masthead
          eyebrow={`${dateLine} · Edition 01`}
          title={`${greeting()}, ${firstName || "Trader"}`}
          meta={
            <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="font-mono text-xs">
                {holdings} holdings · {portfolios.length} portfolios
              </span>
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 font-mono text-[10px] tracking-widest uppercase",
                  market?.isOpen ? "text-success" : "text-muted-foreground",
                )}
              >
                <span
                  className={cn(
                    "size-1.5 rounded-full",
                    market?.isOpen ? "bg-success" : "bg-muted-foreground",
                  )}
                />
                {market?.isOpen ? "Market open" : "Market closed"}
              </span>
            </span>
          }
          actions={
            <Link
              to="/portfolios"
              className="border border-primary bg-primary px-4 py-2.5 font-mono text-[11px] tracking-widest text-primary-foreground uppercase transition-opacity hover:opacity-85"
            >
              Manage book
            </Link>
          }
        />

        {/* ── SECTION 1: Top Hero Financial Overview ──────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1.8fr] gap-6">
          {/* Net Worth Primary Card */}
          <Cell className="flex flex-col justify-between p-6 rounded-xl border border-border/60 shadow-sm">
            <div className="flex items-baseline justify-between gap-3">
              <span className="label-caps">Total net worth</span>
              <span className="label-caps text-muted-foreground">LKR</span>
            </div>

            <div className="py-6">
              {isLoading ? (
                <Skeleton className="h-14 w-64" />
              ) : (
                <Figure
                  size={totalNetWorthFigureSize}
                  className="whitespace-nowrap"
                  value={totalNetWorthText}
                />
              )}
              <div className="mt-3 flex flex-wrap items-center gap-4">
                <span
                  className={cn(
                    "font-mono text-sm tabular-nums font-semibold",
                    totalPnlPercent >= 0 ? "text-success" : "text-destructive",
                  )}
                >
                  {formatPct(totalPnlPercent)} all time
                </span>
                <span className="font-mono text-sm text-muted-foreground tabular-nums">
                  {formatRs(netWorth?.totalProfitLossLkr ?? 0)}
                </span>
              </div>
            </div>

            <div className="flex items-end justify-between gap-4 pt-2">
              <div>
                <div className="label-caps text-muted-foreground">In USDT</div>
                <div className="mt-1 font-mono text-sm font-semibold tabular-nums">
                  {(netWorth?.totalNetWorthUsdt ?? 0).toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })}
                </div>
              </div>
              <div className="text-right">
                <div className="label-caps text-muted-foreground">USDT / LKR Rate</div>
                <div className="mt-1 font-mono text-sm font-semibold tabular-nums">
                  {(netWorth?.usdtToLkrRate ?? 0).toFixed(2)}
                </div>
              </div>
            </div>
          </Cell>

          {/* Allocation by Portfolio - Full Roomy Card */}
          <Cell className="p-6 flex flex-col justify-between rounded-xl border border-border/60 shadow-sm">
            <div>
              <CellLabel index="ALLOCATION">Allocation by Portfolio</CellLabel>

              {isLoading ? (
                <div className="mt-5 space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              ) : portfolios.length === 0 ? (
                <p className="mt-6 text-sm text-muted-foreground">
                  No portfolios yet.{" "}
                  <Link to="/portfolios" className="underline underline-offset-4">
                    Create your first one
                  </Link>
                  .
                </p>
              ) : (
                <>
                  {/* Single stacked allocation bar */}
                  <div className="mt-4 flex h-3.5 w-full overflow-hidden border border-hairline rounded-sm">
                    {portfolios.map((p, i) => (
                      <div
                        key={p.id}
                        className={cn(
                          i % 3 === 0 ? "bg-primary" : i % 3 === 1 ? "bg-accent" : "bg-success",
                        )}
                        style={{ width: `${(getLkrValue(p) / totalValue) * 100}%` }}
                        title={`${p.name}: ${((getLkrValue(p) / totalValue) * 100).toFixed(1)}%`}
                      />
                    ))}
                  </div>

                  <ul className="mt-5 divide-y divide-hairline/70 border-t border-hairline/70 max-h-[160px] overflow-y-auto pr-1">
                    {portfolios.map((p, i) => (
                      <li key={p.id} className="flex items-center gap-3 py-2.5">
                        <span
                          className={cn(
                            "size-2 shrink-0 rounded-full",
                            i % 3 === 0 ? "bg-primary" : i % 3 === 1 ? "bg-accent" : "bg-success",
                          )}
                        />
                        <Link
                          to="/portfolios"
                          className="min-w-0 flex-1 truncate text-sm font-medium hover:underline underline-offset-4"
                        >
                          {p.name}
                        </Link>
                        <span className="font-mono text-xs text-muted-foreground tabular-nums">
                          {((getLkrValue(p) / totalValue) * 100).toFixed(1)}%
                        </span>
                        <span className="w-32 text-right font-mono text-xs tabular-nums font-semibold">
                          {formatRs(p.type === "Crypto" ? p.totalValue * (netWorth?.usdtToLkrRate || 1) : p.totalValue)}
                        </span>
                        <span className="w-20 text-right">
                          <Delta value={p.totalProfitLossPercent} />
                        </span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </Cell>
        </div>

        {/* ── SECTION 2: Market Indices & Key Stats Bar (4 Equal Columns) ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Cell className="rounded-xl border border-border/60 shadow-sm">
            <CellLabel index="I">ASPI Index</CellLabel>
            <Figure
              size="md"
              className="mt-3"
              value={(indices?.aspi.value ?? 0).toLocaleString(undefined, {
                maximumFractionDigits: 2,
              })}
            />
            <div className="mt-2">
              <Delta value={indices?.aspi.percentage ?? 0} />
            </div>
          </Cell>

          <Cell className="rounded-xl border border-border/60 shadow-sm">
            <CellLabel index="II">S&amp;P SL20 Index</CellLabel>
            <Figure
              size="md"
              className="mt-3"
              value={(indices?.snp.value ?? 0).toLocaleString(undefined, {
                maximumFractionDigits: 2,
              })}
            />
            <div className="mt-2">
              <Delta value={indices?.snp.percentage ?? 0} />
            </div>
          </Cell>

          <Cell className="rounded-xl border border-border/60 shadow-sm">
            <CellLabel index="III">Top Performer</CellLabel>
            {isLoading ? (
              <Skeleton className="mt-3 h-7 w-28" />
            ) : (
              <>
                <div className="mt-3 truncate font-display text-lg font-bold">
                  {best?.name ?? "—"}
                </div>
                <div className="mt-2">
                  {best ? <Delta value={best.totalProfitLossPercent} /> : <span>—</span>}
                </div>
              </>
            )}
          </Cell>

          <Cell className="rounded-xl border border-border/60 shadow-sm">
            <CellLabel index="IV">Needs Attention</CellLabel>
            {isLoading ? (
              <Skeleton className="mt-3 h-7 w-28" />
            ) : (
              <>
                <div className="mt-3 truncate font-display text-lg font-bold">
                  {worst?.name ?? "—"}
                </div>
                <div className="mt-2">
                  {worst ? <Delta value={worst.totalProfitLossPercent} /> : <span>—</span>}
                </div>
              </>
            )}
          </Cell>
        </div>

        {/* ── SECTION 3: Main Trading Desk (2/3) + News & Intelligence (1/3) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column (2/3 width): Movers + Quick Desks */}
          <div className="lg:col-span-2 space-y-6">
            {/* Gainers & Losers Side-by-Side Bento */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <MoversCell title="Today's Top Gainers" index="GAINERS" rows={gainers} loading={isLoading} />
              <MoversCell title="Today's Top Losers" index="LOSERS" rows={losers} loading={isLoading} />
            </div>

            {/* Quick Desks Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { to: "/stocks", label: "Market board", note: "Live CSE prices & charts", n: "01" },
                { to: "/watchlist", label: "Watchlist", note: "Symbols you're tracking", n: "02" },
                { to: "/alerts", label: "Price alerts", note: "Trigger rules & history", n: "03" },
                { to: "/algorithms", label: "AI strategies", note: "Automated signals", n: "04" },
              ].map((d) => (
                <Cell
                  key={d.to}
                  as={Link}
                  to={d.to}
                  className="group block p-4 rounded-xl border border-border/60 hover:bg-primary hover:text-primary-foreground transition-all"
                >
                  <div className="flex items-baseline justify-between">
                    <span className="label-caps group-hover:text-primary-foreground/60">{d.n}</span>
                    <span className="text-sm transition-transform group-hover:translate-x-1">→</span>
                  </div>
                  <div className="mt-4 font-display text-base font-bold">{d.label}</div>
                  <div className="mt-1 text-xs text-muted-foreground group-hover:text-primary-foreground/70">
                    {d.note}
                  </div>
                </Cell>
              ))}
            </div>
          </div>

          {/* Right Column (1/3 width): News & Intelligence Feed */}
          <div className="lg:col-span-1">
            <MarketNewsFeed
              title="Market News & Intelligence"
              maxHeight="h-[620px]"
              className="h-full"
            />
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function MoversCell({
  title,
  index,
  rows,
  loading,
}: {
  title: string;
  index: string;
  rows: { symbol: string; price: number; changePercentage: number }[];
  loading: boolean;
}) {
  return (
    <Cell className="rounded-xl border border-border/60 shadow-sm">
      <CellLabel index={index}>{title}</CellLabel>
      {loading ? (
        <div className="mt-4 space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      ) : rows.length === 0 ? (
        <p className="mt-5 text-sm text-muted-foreground">No data for today.</p>
      ) : (
        <ol className="mt-3 divide-y divide-hairline/70 border-t border-hairline/70">
          {rows.map((m, i) => (
            <li key={m.symbol} className="flex items-center gap-3 py-2.5">
              <span className="w-4 shrink-0 font-mono text-[10px] text-muted-foreground">
                {i + 1}
              </span>
              <span className="min-w-0 flex-1 truncate font-mono text-xs font-semibold">
                {m.symbol}
              </span>
              <span className="font-mono text-xs text-muted-foreground tabular-nums">
                {formatRs(m.price)}
              </span>
              <span className="w-20 text-right">
                <Delta value={m.changePercentage} />
              </span>
            </li>
          ))}
        </ol>
      )}
    </Cell>
  );
}
