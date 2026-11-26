import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { fmt, fmtCompact, fmtPrice, fmtQty, signed, toneOf } from "@/components/portfolio/format";
import type {
  DeskAlert,
  DeskBoardRow,
  DeskMarket,
  DeskOverview,
  DeskPosition,
} from "@/services/desk-service";
import { DeskTable, type DeskColumn } from "./desk-table";
import { QuickAlert } from "./quick-alert";

export type BoardTab = "market" | "portfolio" | "watchlist" | "alerts";
type MarketFilter = "all" | "gainers" | "losers" | "traded" | "held";

const shortCode = (s: string) => s.replace(/\.N0000$/, "");

/** Where today's price sits between the day's low and high. */
function RangeBar({ low, high, price }: { low: number; high: number; price: number }) {
  if (!(high > low) || !(price > 0)) return <span className="text-muted-foreground">—</span>;
  const pct = Math.min(100, Math.max(0, ((price - low) / (high - low)) * 100));
  return (
    <span className="relative inline-block h-1 w-14 rounded-full bg-muted align-middle" aria-hidden>
      <span
        className="absolute top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary"
        style={{ left: `${pct}%` }}
      />
    </span>
  );
}

function Pct({ v }: { v: number }) {
  return <span className={cn("font-semibold", toneOf(v))}>{signed(v)}%</span>;
}

interface BoardsProps {
  data: DeskOverview;
  tab: BoardTab;
  onTabChange: (t: BoardTab) => void;
  selected: string | null;
  onSelect: (symbol: string) => void;
  onAlertsChanged: () => void;
  onOrderChange: (symbols: string[]) => void;
}

/** Market (every stock) · Portfolio (every holding + related data) · Watchlist · Near alerts. */
export function DeskBoards({
  data,
  tab,
  onTabChange,
  selected,
  onSelect,
  onAlertsChanged,
  onOrderChange,
}: BoardsProps) {
  const market = data.market;
  const ccy = data.currency;
  const isCse = market === "cse";
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<MarketFilter>("all");
  const held = useMemo(() => new Set(data.portfolio.map((p) => p.symbol)), [data.portfolio]);
  const bySymbol = useMemo(() => new Map(data.board.map((r) => [r.symbol, r])), [data.board]);

  const alertCell = (
    symbol: string,
    price: number,
    high?: number,
    low?: number,
    breakEven?: number | null,
  ) => (
    <QuickAlert
      compact
      symbol={symbol}
      market={market}
      price={price}
      dayHigh={high}
      dayLow={low}
      breakEven={breakEven}
      count={data.alertCounts[symbol] ?? 0}
      onChanged={onAlertsChanged}
    />
  );

  // ── Market / Watchlist columns ──
  const boardColumns: DeskColumn<DeskBoardRow>[] = [
    {
      key: "symbol",
      label: "Symbol",
      sort: (r) => r.symbol,
      render: (r) => (
        <span className="flex flex-col">
          <span className="font-mono font-bold">
            {shortCode(r.symbol)}
            {held.has(r.symbol) && <span className="ml-1 text-[9px] text-primary">●</span>}
          </span>
          <span className="max-w-[160px] truncate text-[10px] text-muted-foreground">{r.name}</span>
        </span>
      ),
    },
    {
      key: "price",
      label: "Last",
      align: "right",
      sort: (r) => r.price,
      render: (r) => <span className="font-semibold">{fmtPrice(r.price, ccy)}</span>,
    },
    {
      key: "pct",
      label: "Chg %",
      align: "right",
      sort: (r) => r.changePercent,
      render: (r) => <Pct v={r.changePercent} />,
    },
    {
      key: "chg",
      label: "Chg",
      align: "right",
      sort: (r) => r.change,
      render: (r) => <span className={toneOf(r.change)}>{signed(r.change, isCse ? 2 : 4)}</span>,
    },
    ...(isCse
      ? [
          {
            key: "open",
            label: "Open",
            align: "right" as const,
            sort: (r: DeskBoardRow) => r.open,
            render: (r: DeskBoardRow) => (r.open > 0 ? fmtPrice(r.open, ccy) : "—"),
          },
        ]
      : []),
    {
      key: "high",
      label: isCse ? "High" : "24h high",
      align: "right",
      sort: (r) => r.high,
      render: (r) => fmtPrice(r.high, ccy),
    },
    {
      key: "low",
      label: isCse ? "Low" : "24h low",
      align: "right",
      sort: (r) => r.low,
      render: (r) => fmtPrice(r.low, ccy),
    },
    {
      key: "range",
      label: "Range",
      render: (r) => <RangeBar low={r.low} high={r.high} price={r.price} />,
    },
    {
      key: "volume",
      label: "Volume",
      align: "right",
      sort: (r) => r.volume,
      render: (r) => fmtCompact(r.volume),
    },
    ...(isCse
      ? [
          {
            key: "trades",
            label: "Trades",
            align: "right" as const,
            sort: (r: DeskBoardRow) => r.trades ?? 0,
            render: (r: DeskBoardRow) => fmt(r.trades ?? 0, 0),
          },
        ]
      : []),
    {
      key: "turnover",
      label: isCse ? "Turnover" : "24h vol $",
      align: "right",
      sort: (r) => r.turnover,
      render: (r) => fmtCompact(r.turnover),
    },
    ...(isCse
      ? [
          {
            key: "mcap",
            label: "Mkt cap",
            align: "right" as const,
            sort: (r: DeskBoardRow) => r.marketCap ?? 0,
            render: (r: DeskBoardRow) => fmtCompact(r.marketCap),
          },
        ]
      : []),
    {
      key: "alert",
      label: "",
      align: "right",
      render: (r) => alertCell(r.symbol, r.price, r.high, r.low),
    },
  ];

  // ── Portfolio columns ──
  const positionColumns: DeskColumn<DeskPosition>[] = [
    {
      key: "symbol",
      label: "Symbol",
      sort: (p) => p.symbol,
      render: (p) => (
        <span className="flex flex-col" title={p.portfolios.join(", ")}>
          <span className="font-mono font-bold">{shortCode(p.symbol)}</span>
          <span className="max-w-[140px] truncate text-[10px] text-muted-foreground">{p.name}</span>
        </span>
      ),
    },
    {
      key: "qty",
      label: "Qty",
      align: "right",
      sort: (p) => p.quantity,
      render: (p) => fmtQty(p.quantity),
    },
    {
      key: "avg",
      label: "Avg",
      align: "right",
      sort: (p) => p.averageBuyPrice,
      render: (p) => fmtPrice(p.averageBuyPrice, ccy),
    },
    {
      key: "price",
      label: "Last",
      align: "right",
      sort: (p) => p.price,
      render: (p) => <span className="font-semibold">{fmtPrice(p.price, ccy)}</span>,
    },
    {
      key: "day",
      label: "Day %",
      align: "right",
      sort: (p) => p.dayChangePercent,
      render: (p) => <Pct v={p.dayChangePercent} />,
    },
    {
      key: "dayPnl",
      label: "Day P/L",
      align: "right",
      sort: (p) => p.dayProfitLoss,
      render: (p) => <span className={toneOf(p.dayProfitLoss)}>{signed(p.dayProfitLoss)}</span>,
    },
    {
      key: "value",
      label: "Value",
      align: "right",
      sort: (p) => p.value,
      render: (p) => fmt(p.value),
    },
    {
      key: "pnl",
      label: "P/L",
      align: "right",
      hint: isCse ? "After buy and sell charges (1.12% each)" : "After fees",
      sort: (p) => p.profitLoss,
      render: (p) => (
        <span className={cn("flex flex-col items-end", toneOf(p.profitLoss))}>
          <span className="font-semibold">{signed(p.profitLoss)}</span>
          <span className="text-[10px]">{signed(p.profitLossPercent)}%</span>
        </span>
      ),
    },
    {
      key: "be",
      label: "Break-even",
      align: "right",
      hint: "Sell price that returns your cost after all charges",
      sort: (p) => p.breakEvenPrice,
      render: (p) => (
        <span className={p.price >= p.breakEvenPrice ? "text-success" : "text-muted-foreground"}>
          {fmtPrice(p.breakEvenPrice, ccy)}
        </span>
      ),
    },
    {
      key: "weight",
      label: "Weight",
      align: "right",
      sort: (p) => p.weightPercent,
      render: (p) => `${fmt(p.weightPercent, 1)}%`,
    },
    {
      key: "turnover",
      label: isCse ? "Turnover" : "24h vol $",
      align: "right",
      sort: (p) => p.turnover,
      render: (p) => fmtCompact(p.turnover),
    },
    ...(isCse
      ? [
          {
            key: "signal",
            label: "Trend · RSI",
            sort: (p: DeskPosition) => p.rsi14,
            render: (p: DeskPosition) =>
              p.trend || p.rsi14 != null ? (
                <span className="text-[10px]">
                  <span
                    className={cn(
                      p.trend === "UPTREND" && "text-success",
                      p.trend === "DOWNTREND" && "text-destructive",
                    )}
                  >
                    {p.trend === "UPTREND"
                      ? "▲ up"
                      : p.trend === "DOWNTREND"
                        ? "▼ down"
                        : p.trend === "MIXED"
                          ? "mixed"
                          : "—"}
                  </span>
                  {p.rsi14 != null && (
                    <span
                      className={cn(
                        "ml-1",
                        p.rsi14 >= 70
                          ? "text-destructive"
                          : p.rsi14 <= 30
                            ? "text-success"
                            : "text-muted-foreground",
                      )}
                    >
                      RSI {fmt(p.rsi14, 0)}
                    </span>
                  )}
                </span>
              ) : (
                "—"
              ),
          },
          {
            key: "pe",
            label: "P/E",
            align: "right" as const,
            sort: (p: DeskPosition) => p.priceToEarnings,
            render: (p: DeskPosition) =>
              p.priceToEarnings != null ? fmt(p.priceToEarnings, 1) : "—",
          },
          {
            key: "pbv",
            label: "P/BV",
            align: "right" as const,
            sort: (p: DeskPosition) => p.priceToBook,
            render: (p: DeskPosition) => (p.priceToBook != null ? fmt(p.priceToBook, 2) : "—"),
          },
          {
            key: "div",
            label: "Next div",
            align: "right" as const,
            hint: "Upcoming dividend per share and record date",
            sort: (p: DeskPosition) => p.nextDividendRecordDate,
            render: (p: DeskPosition) =>
              p.nextDividendPerShare != null && p.nextDividendRecordDate ? (
                <span className="flex flex-col items-end">
                  <span>Rs {fmt(p.nextDividendPerShare)}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(p.nextDividendRecordDate).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                    })}
                  </span>
                </span>
              ) : (
                "—"
              ),
          },
        ]
      : []),
    {
      key: "alert",
      label: "",
      align: "right",
      render: (p) => {
        const q = bySymbol.get(p.symbol);
        return alertCell(p.symbol, p.price, q?.high, q?.low, p.breakEvenPrice);
      },
    },
  ];

  // ── Near alerts columns ──
  const alertColumns: DeskColumn<DeskAlert>[] = [
    {
      key: "symbol",
      label: "Symbol",
      sort: (a) => a.symbol,
      render: (a) => <span className="font-mono font-bold">{shortCode(a.symbol)}</span>,
    },
    {
      key: "dir",
      label: "When",
      render: (a) =>
        a.isAbove ? (
          <span className="text-success">▲ above</span>
        ) : (
          <span className="text-destructive">▼ below</span>
        ),
    },
    {
      key: "target",
      label: "Target",
      align: "right",
      sort: (a) => a.targetPrice,
      render: (a) => fmtPrice(a.targetPrice, ccy),
    },
    {
      key: "now",
      label: "Now",
      align: "right",
      sort: (a) => a.currentPrice,
      render: (a) => (a.currentPrice != null ? fmtPrice(a.currentPrice, ccy) : "—"),
    },
    {
      key: "dist",
      label: "Away",
      align: "right",
      sort: (a) => a.distancePercent,
      render: (a) => (a.distancePercent != null ? `${fmt(a.distancePercent)}%` : "—"),
    },
    {
      key: "once",
      label: "",
      render: (a) => (
        <span className="text-[10px] text-muted-foreground">{a.fireOnce ? "once" : "repeats"}</span>
      ),
    },
  ];

  const marketRows = useMemo(() => {
    const q = query.trim().toUpperCase();
    return data.board.filter((r) => {
      if (q && !r.symbol.includes(q) && !r.name.toUpperCase().includes(q)) return false;
      switch (filter) {
        case "gainers":
          return r.changePercent > 0;
        case "losers":
          return r.changePercent < 0;
        case "traded":
          return isCse ? (r.trades ?? 0) > 0 : r.volume > 0;
        case "held":
          return held.has(r.symbol);
        default:
          return true;
      }
    });
  }, [data.board, query, filter, held, isCse]);

  const tabs: { id: BoardTab; label: string; count: number }[] = [
    { id: "market", label: isCse ? "Market" : "Pairs", count: data.board.length },
    { id: "portfolio", label: "Portfolio", count: data.portfolio.length },
    { id: "watchlist", label: "Watchlist", count: data.watchlist.length },
    { id: "alerts", label: "Near alerts", count: data.nearAlerts.length },
  ];

  const t = data.portfolioTotals;
  return (
    <section
      aria-label="Boards"
      className="flex min-w-0 flex-col rounded-xl border border-border/60 bg-card"
    >
      <div
        role="tablist"
        className="flex flex-wrap items-center gap-1 border-b border-border px-2 pt-2"
      >
        {tabs.map((x) => (
          <button
            key={x.id}
            type="button"
            role="tab"
            aria-selected={tab === x.id}
            onClick={() => onTabChange(x.id)}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 text-xs font-semibold transition-colors cursor-pointer",
              tab === x.id
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {x.label} <span className="font-mono text-[10px] opacity-60">{x.count}</span>
          </button>
        ))}
      </div>

      {tab === "market" && (
        <>
          <div className="flex flex-wrap items-center gap-2 border-b border-border/60 px-3 py-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="desk-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search symbol or name ( / )"
                className="h-8 w-56 pl-7 text-xs"
                aria-label="Search the market"
              />
            </div>
            <div className="flex flex-wrap gap-1">
              {(["all", "gainers", "losers", "traded", "held"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  aria-pressed={filter === f}
                  className={cn(
                    "rounded-md px-2 py-1 text-[11px] font-semibold capitalize transition-colors cursor-pointer",
                    filter === f
                      ? "bg-foreground text-background"
                      : "bg-muted/50 text-muted-foreground hover:text-foreground",
                  )}
                >
                  {f === "held" ? "My holdings" : f}
                </button>
              ))}
            </div>
            <span className="ml-auto text-[10px] text-muted-foreground">
              {marketRows.length} shown
            </span>
          </div>
          <DeskTable
            rows={marketRows}
            columns={boardColumns}
            selected={selected}
            onSelect={onSelect}
            storageKey={`desk-market-${market}`}
            initialKey="turnover"
            onOrderChange={onOrderChange}
            empty={
              query
                ? `No match for "${query}".`
                : "No market data yet — prices load after the first poll."
            }
          />
        </>
      )}

      {tab === "portfolio" && (
        <DeskTable
          rows={data.portfolio}
          columns={positionColumns}
          selected={selected}
          onSelect={onSelect}
          storageKey={`desk-portfolio-${market}`}
          initialKey="value"
          onOrderChange={onOrderChange}
          empty={`No ${isCse ? "CSE" : "crypto"} holdings yet.`}
          footer={
            <tr className="border-t border-border text-xs font-semibold">
              <td className="px-2 py-2" colSpan={5}>
                Totals · cash {ccy} {fmt(t.cash)}
              </td>
              <td className={cn("px-2 py-2 text-right tabular", toneOf(t.dayProfitLoss))}>
                {signed(t.dayProfitLoss)}
              </td>
              <td className="px-2 py-2 text-right tabular">{fmt(t.holdingsValue)}</td>
              <td className={cn("px-2 py-2 text-right tabular", toneOf(t.profitLoss))}>
                {signed(t.profitLoss)}
              </td>
              <td colSpan={positionColumns.length - 8} />
            </tr>
          }
        />
      )}

      {tab === "watchlist" && (
        <DeskTable
          rows={data.watchlist}
          columns={boardColumns}
          selected={selected}
          onSelect={onSelect}
          storageKey={`desk-watch-${market}`}
          initialKey="pct"
          onOrderChange={onOrderChange}
          empty="Your watchlist is empty — use + Watch on a stock."
        />
      )}

      {tab === "alerts" && (
        <DeskTable
          rows={data.nearAlerts}
          columns={alertColumns}
          selected={selected}
          onSelect={onSelect}
          storageKey={`desk-alerts-${market}`}
          initialKey="dist"
          initialDir="asc"
          rowKey={(a) => a.id}
          onOrderChange={onOrderChange}
          empty="No active alert is within 2% of its target."
        />
      )}
    </section>
  );
}
