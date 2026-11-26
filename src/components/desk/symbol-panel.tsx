import { useEffect, useState } from "react";
import { Eye, EyeOff, ShoppingCart, TrendingDown } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { apiErrorMessage } from "@/lib/api-error";
import { StockChart } from "@/components/stocks/stock-chart";
import { CryptoChart } from "@/components/crypto/crypto-chart";
import { cryptoService, type CandleBar } from "@/services/crypto-service";
import { fmt, fmtCompact, fmtPrice, fmtQty, signed, toneOf } from "@/components/portfolio/format";
import {
  deskService,
  type DeskBoardRow,
  type DeskMarket,
  type DeskSymbol,
} from "@/services/desk-service";
import type { TradeSide } from "@/services/portfolio-service";
import { QuickAlert } from "./quick-alert";

const label = "text-[10px] font-mono font-semibold uppercase tracking-widest text-muted-foreground";

function Stat({
  name,
  value,
  tone,
  hint,
}: {
  name: string;
  value: string;
  tone?: string;
  hint?: string;
}) {
  return (
    <div className="rounded-md bg-muted/30 px-2.5 py-2" title={hint}>
      <div className={label}>{name}</div>
      <div className={cn("mt-0.5 font-mono text-xs font-semibold tabular", tone)}>{value}</div>
    </div>
  );
}

/** 15-minute candles for the last day (crypto). */
function CryptoMiniChart({ symbol }: { symbol: string }) {
  const [candles, setCandles] = useState<CandleBar[] | null>(null);
  useEffect(() => {
    let cancelled = false;
    setCandles(null);
    cryptoService
      .getCandles(symbol, "15m", 96)
      .then((c) => !cancelled && setCandles(c))
      .catch(() => !cancelled && setCandles([]));
    return () => {
      cancelled = true;
    };
  }, [symbol]);
  if (candles == null) return <Skeleton className="h-64 w-full" />;
  if (candles.length === 0) return <p className="text-xs text-muted-foreground">No chart data.</p>;
  return <CryptoChart candles={candles} />;
}

/**
 * The selected stock: chart, today's figures, fundamentals (CSE), your position with break-even, and
 * the actions — Buy / Sell (through the Trade dialog), quick alert, watch.
 */
export function SymbolPanel({
  market,
  symbol,
  detail,
  liveQuote,
  watched,
  alertOpen,
  onAlertOpenChange,
  onTrade,
  onChanged,
}: {
  market: DeskMarket;
  symbol: string | null;
  detail: DeskSymbol | null;
  /** Latest board row (fresher than `detail`, live for crypto). */
  liveQuote: DeskBoardRow | null;
  watched: boolean;
  alertOpen: boolean;
  onAlertOpenChange: (open: boolean) => void;
  onTrade: (side: TradeSide, portfolioId: number) => void;
  onChanged: () => void;
}) {
  const ccy = market === "cse" ? "LKR" : "USDT";
  const [watchBusy, setWatchBusy] = useState(false);

  if (!symbol) {
    return (
      <section className="rounded-xl border border-border/60 bg-card p-6 text-sm text-muted-foreground">
        Select a stock from the boards or the scanner.
      </section>
    );
  }

  const q = liveQuote ?? detail?.quote ?? null;
  const pos = detail?.position ?? null;
  const f = detail?.fundamentals ?? null;
  const portfolios = detail?.portfolios ?? [];
  const holders = portfolios.filter((p) => p.quantity > 0);

  const toggleWatch = async () => {
    setWatchBusy(true);
    try {
      if (watched) await deskService.unwatch(symbol);
      else await deskService.watch(symbol, market);
      toast.success(watched ? `${symbol} removed from watchlist` : `${symbol} added to watchlist`);
      onChanged();
    } catch (error) {
      toast.error(apiErrorMessage(error, "Watchlist update failed"));
    } finally {
      setWatchBusy(false);
    }
  };

  /** One portfolio → act straight away; several → choose. */
  const tradeButton = (side: TradeSide) => {
    const choices = side === "Sell" ? holders : portfolios;
    const icon =
      side === "Buy" ? (
        <ShoppingCart className="size-3.5" />
      ) : (
        <TrendingDown className="size-3.5" />
      );
    const cls =
      side === "Buy"
        ? "bg-success text-success-foreground hover:bg-success/90"
        : "bg-destructive text-destructive-foreground hover:bg-destructive/90";
    if (choices.length === 0) {
      return (
        <Button
          size="sm"
          disabled
          className="gap-1.5"
          title={
            side === "Buy"
              ? `Create a ${market === "cse" ? "stock" : "crypto"} portfolio first`
              : "You don't hold this"
          }
        >
          {icon} {side}
        </Button>
      );
    }
    if (choices.length === 1) {
      return (
        <Button
          size="sm"
          className={cn("gap-1.5", cls)}
          onClick={() => onTrade(side, choices[0].id)}
        >
          {icon} {side}
        </Button>
      );
    }
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" className={cn("gap-1.5", cls)}>
            {icon} {side} ▾
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuLabel className="text-xs">{side} in portfolio</DropdownMenuLabel>
          {choices.map((p) => (
            <DropdownMenuItem
              key={p.id}
              onClick={() => onTrade(side, p.id)}
              className="flex justify-between gap-6 text-xs"
            >
              <span>{p.name}</span>
              <span className="font-mono text-muted-foreground">
                {side === "Sell" ? `holds ${fmtQty(p.quantity)}` : `cash ${fmt(p.cash)}`}
              </span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  return (
    <section
      aria-label={`Selected: ${symbol}`}
      className="space-y-3 rounded-xl border border-border/60 bg-card p-4"
    >
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-sm font-bold">{symbol.replace(/\.N0000$/, "")}</span>
            <span className="truncate text-xs text-muted-foreground">{q?.name}</span>
          </div>
          {q ? (
            <div className="mt-1 flex items-baseline gap-3">
              <span className="font-display text-3xl font-bold tabular">
                {fmtPrice(q.price, ccy)}
              </span>
              <span className={cn("font-mono text-sm font-semibold tabular", toneOf(q.change))}>
                {signed(q.change, market === "cse" ? 2 : 4)} ({signed(q.changePercent)}%)
              </span>
            </div>
          ) : (
            <Skeleton className="mt-2 h-8 w-40" />
          )}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {tradeButton("Buy")}
          {tradeButton("Sell")}
          <QuickAlert
            symbol={symbol}
            market={market}
            price={q?.price ?? 0}
            dayHigh={q?.high}
            dayLow={q?.low}
            breakEven={pos?.breakEvenPrice}
            count={detail?.alerts.filter((a) => a.isActive).length ?? 0}
            onChanged={onChanged}
            open={alertOpen}
            onOpenChange={onAlertOpenChange}
          />
          <Button
            size="sm"
            variant="ghost"
            className="gap-1.5"
            disabled={watchBusy}
            onClick={() => void toggleWatch()}
          >
            {watched ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
            {watched ? "Unwatch" : "Watch"}
          </Button>
        </div>
      </div>

      {/* Chart */}
      {market === "cse" && q ? (
        <StockChart
          key={symbol}
          stock={{
            symbol,
            name: q.name,
            price: q.price,
            previousClose: q.previousClose,
            high: q.high,
            low: q.low,
            percentageChange: q.changePercent,
            change: q.change,
          }}
        />
      ) : market === "crypto" ? (
        <CryptoMiniChart key={symbol} symbol={symbol} />
      ) : null}

      {/* Today */}
      {q && (
        <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 xl:grid-cols-6">
          {market === "cse" && (
            <Stat name="Open" value={q.open > 0 ? fmtPrice(q.open, ccy) : "—"} />
          )}
          <Stat name={market === "cse" ? "High" : "24h high"} value={fmtPrice(q.high, ccy)} />
          <Stat name={market === "cse" ? "Low" : "24h low"} value={fmtPrice(q.low, ccy)} />
          <Stat
            name={market === "cse" ? "Prev close" : "24h open"}
            value={fmtPrice(q.previousClose, ccy)}
          />
          <Stat name="Volume" value={fmtCompact(q.volume)} />
          {market === "cse" && <Stat name="Trades" value={fmt(q.trades ?? 0, 0)} />}
          <Stat name={market === "cse" ? "Turnover" : "24h vol $"} value={fmtCompact(q.turnover)} />
          {market === "cse" && <Stat name="Mkt cap" value={fmtCompact(q.marketCap)} />}
          {f && (
            <>
              <Stat
                name="P/E"
                value={f.priceToEarnings.value != null ? fmt(f.priceToEarnings.value, 1) : "—"}
                hint={f.priceToEarnings.note ?? undefined}
              />
              <Stat
                name="P/BV"
                value={f.priceToBook.value != null ? fmt(f.priceToBook.value) : "—"}
                hint={f.priceToBook.note ?? undefined}
              />
              <Stat
                name="Div yield"
                value={f.dividendYield.value != null ? `${fmt(f.dividendYield.value)}%` : "—"}
                hint={f.dividendYield.note ?? undefined}
              />
              <Stat name="Beta (ASPI)" value={f.betaAspi != null ? fmt(f.betaAspi) : "—"} />
              <Stat
                name="52w range"
                value={
                  f.low52Week != null && f.high52Week != null
                    ? `${fmt(f.low52Week)}–${fmt(f.high52Week)}`
                    : "—"
                }
              />
            </>
          )}
        </div>
      )}

      {/* Position */}
      {pos ? (
        <div className="rounded-lg border border-border px-3 py-2.5">
          <div className="mb-2 flex items-center justify-between">
            <span className={label}>Your position · {pos.portfolios.join(", ")}</span>
            <span className="text-[10px] text-muted-foreground">
              {market === "cse" ? "P/L after 1.12% buy + sell charges" : "P/L after fees"}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs sm:grid-cols-3 xl:grid-cols-6">
            <div>
              <div className="text-muted-foreground">Qty @ avg</div>
              <div className="font-mono font-semibold tabular">
                {fmtQty(pos.quantity)} @ {fmtPrice(pos.averageBuyPrice, ccy)}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Value</div>
              <div className="font-mono font-semibold tabular">{fmt(pos.value)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">P/L</div>
              <div className={cn("font-mono font-semibold tabular", toneOf(pos.profitLoss))}>
                {signed(pos.profitLoss)} ({signed(pos.profitLossPercent)}%)
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Today</div>
              <div className={cn("font-mono font-semibold tabular", toneOf(pos.dayProfitLoss))}>
                {signed(pos.dayProfitLoss)}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Break-even</div>
              <div
                className={cn(
                  "font-mono font-semibold tabular",
                  (q?.price ?? 0) >= pos.breakEvenPrice ? "text-success" : "text-warning",
                )}
              >
                {fmtPrice(pos.breakEvenPrice, ccy)}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Weight</div>
              <div className="font-mono font-semibold tabular">{fmt(pos.weightPercent, 1)}%</div>
            </div>
          </div>
        </div>
      ) : detail ? (
        <p className="rounded-lg border border-dashed border-border px-3 py-2 text-xs text-muted-foreground">
          Not held.{" "}
          {portfolios.length > 0
            ? `Cash available: ${portfolios.map((p) => `${p.name} ${ccy} ${fmt(p.cash)}`).join(" · ")}`
            : `Create a ${market === "cse" ? "stock" : "crypto"} portfolio to trade it here.`}
        </p>
      ) : (
        <Skeleton className="h-14 w-full" />
      )}
    </section>
  );
}
