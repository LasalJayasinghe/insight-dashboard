import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { StockChart } from "@/components/stocks/stock-chart";
import { StockTechnicalSummary } from "@/components/stocks/stock-technical-summary";
import { StockDividendPanel } from "@/components/stocks/stock-dividend-panel";
import { MarketNewsFeed } from "@/components/dashboard/market-news-feed";
import { cn } from "@/lib/utils";
import type { HoldingDto, HoldingSignalsDto } from "@/services/portfolio-service";
import type { StockTicker } from "@/services/stock-service";
import { fmt, fmtCompact, fmtPrice, fmtQty, signed, toneOf } from "./format";
import { SignalBadges } from "./signal-badges";

interface Props {
  holding: HoldingDto | null;
  currency: string;
  isStock: boolean;
  signals?: HoldingSignalsDto;
  onOpenChange: (open: boolean) => void;
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-lg bg-muted/30 border border-border/50 px-3 py-2">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-0.5">
        {label}
      </div>
      <div className={cn("text-sm font-semibold tabular", tone)}>{value}</div>
    </div>
  );
}

/**
 * Everything a trader needs on one held stock, without leaving the portfolio:
 * the position (BES, P/L after fees, weight) plus the stock view's chart, technicals, dividends and news.
 */
export function HoldingDetailSheet({ holding, currency, isStock, signals, onOpenChange }: Props) {
  const h = holding;

  // The stock-view components only need the symbol (and price for display).
  const ticker: StockTicker | null = h
    ? {
        symbol: h.symbol,
        name: h.name ?? h.symbol,
        price: h.currentPrice,
        previousClose: h.previousClose,
        high: 0,
        low: 0,
        percentageChange: h.dayChangePercent,
        change: h.dayChange,
      }
    : null;

  const toBes =
    h?.breakEvenPrice != null && h.breakEvenPrice > 0
      ? ((h.currentPrice - h.breakEvenPrice) / h.breakEvenPrice) * 100
      : null;

  return (
    <Sheet open={h != null} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-3xl overflow-y-auto p-0">
        {h && ticker && (
          <div className="space-y-5 p-5">
            <SheetHeader className="space-y-1 text-left">
              <SheetTitle className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="font-mono text-2xl">{h.symbol}</span>
                <span className="text-2xl tabular">
                  {currency} {fmtPrice(h.currentPrice, currency)}
                </span>
                <span className={cn("text-sm font-semibold tabular", toneOf(h.dayChange))}>
                  {signed(h.dayChange, currency === "LKR" ? 2 : 4)} ({signed(h.dayChangePercent)}%)
                </span>
              </SheetTitle>
              <SheetDescription>
                {h.name ?? (isStock ? "Colombo Stock Exchange" : "Binance")}
              </SheetDescription>
              {isStock && <SignalBadges signals={signals} className="pt-1" />}
            </SheetHeader>

            {/* Position */}
            <section className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Your position
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <Stat label="Quantity" value={fmtQty(h.quantity)} />
                <Stat label="Avg buy" value={fmtPrice(h.averageBuyPrice, currency)} />
                {isStock && (
                  <Stat
                    label="BES"
                    value={h.breakEvenPrice != null ? fmtPrice(h.breakEvenPrice, currency) : "—"}
                  />
                )}
                {isStock && (
                  <Stat
                    label="vs BES"
                    value={toBes == null ? "—" : `${signed(toBes)}%`}
                    tone={toBes == null ? undefined : toneOf(toBes)}
                  />
                )}
                <Stat label="Value" value={`${currency} ${fmt(h.currentValue)}`} />
                <Stat label="Weight" value={`${fmt(h.weightPercent, 1)}%`} />
                <Stat
                  label={isStock ? "P/L (after fees)" : "P/L"}
                  value={`${signed(h.profitLoss)} (${signed(h.profitLossPercent)}%)`}
                  tone={toneOf(h.profitLoss)}
                />
                <Stat
                  label="Today"
                  value={signed(h.dayProfitLoss)}
                  tone={toneOf(h.dayProfitLoss)}
                />
                {isStock && <Stat label="Volume today" value={fmtCompact(h.shareVolume)} />}
                {isStock && <Stat label="Turnover today" value={fmtCompact(h.turnover)} />}
                {isStock && <Stat label="Trades today" value={fmtCompact(h.tradeVolume)} />}
                {isStock && <Stat label="Prev close" value={fmtPrice(h.previousClose, currency)} />}
              </div>
              {h.notes && <p className="text-xs text-muted-foreground">Note: {h.notes}</p>}
            </section>

            {isStock ? (
              <>
                <StockChart stock={ticker} />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <StockTechnicalSummary stock={ticker} />
                  <StockDividendPanel symbol={h.symbol} />
                </div>
                <MarketNewsFeed
                  symbolFilter={h.symbol}
                  title={`${h.symbol} News`}
                  maxHeight="h-[420px]"
                />
              </>
            ) : (
              <p className="text-xs text-muted-foreground">
                Charts and technicals for crypto are on the Crypto page.
              </p>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
