import { useMemo } from "react";
import { BarChart3, LineChart } from "lucide-react";
import type { StockTicker } from "@/services/stock-service";
import { useStockHistory } from "@/hooks/use-stock-history";
import { summarize, type Trend } from "@/lib/technicals";
import { fmtPrice } from "./format";
import { cn } from "@/lib/utils";

const TREND_LABEL: Record<Trend, string> = {
  UPTREND: "Uptrend",
  DOWNTREND: "Downtrend",
  MIXED: "Mixed / sideways",
  INSUFFICIENT_DATA: "Not enough history",
};

const TREND_STYLE: Record<Trend, string> = {
  UPTREND: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  DOWNTREND: "bg-red-500/10 text-red-400 border-red-500/20",
  MIXED: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  INSUFFICIENT_DATA: "bg-muted/40 text-muted-foreground border-border",
};

const pct = (v: number | null, digits = 1) =>
  v === null ? "—" : `${v >= 0 ? "+" : ""}${v.toFixed(digits)}%`;

function Row({ label, value, tone }: { label: string; value: string; tone?: "up" | "down" }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span
        className={cn(
          "text-xs font-mono font-bold text-foreground",
          tone === "up" && "text-emerald-400",
          tone === "down" && "text-red-400",
        )}
      >
        {value}
      </span>
    </div>
  );
}

/**
 * Rule-based technical snapshot computed from the stock's real one-year CSE price history.
 * Replaces the old hard-coded "AI summary" and made-up confidence score.
 */
export function StockTechnicalSummary({ stock }: { stock: StockTicker }) {
  const { data, loading, error } = useStockHistory(stock.symbol, "1Y");
  const s = useMemo(() => (data ? summarize(data) : null), [data]);

  const notes: string[] = [];
  if (s) {
    if (s.sma50 !== null) {
      notes.push(
        `Price is ${s.lastClose >= s.sma50 ? "above" : "below"} its 50-day average (${fmtPrice(s.sma50)})` +
          (s.sma200 !== null
            ? ` and the 50-day is ${s.sma50 >= s.sma200 ? "above" : "below"} the 200-day (${fmtPrice(s.sma200)}).`
            : "."),
      );
    }
    notes.push(
      `Trading at ${s.rangePosition.toFixed(0)}% of its 52-week range (${fmtPrice(s.low52w)} – ${fmtPrice(s.high52w)}).`,
    );
    if (s.rsi14 !== null) {
      notes.push(
        s.rsi14 >= 70
          ? `RSI ${s.rsi14.toFixed(0)}: overbought territory.`
          : s.rsi14 <= 30
            ? `RSI ${s.rsi14.toFixed(0)}: oversold territory.`
            : `RSI ${s.rsi14.toFixed(0)}: neutral momentum.`,
      );
    }
    if (s.volumeRatio !== null && s.volumeRatio >= 2) {
      notes.push(`Volume in the last session was ${s.volumeRatio.toFixed(1)}× its 20-day average.`);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card shadow-card p-5 flex flex-col space-y-4">
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <LineChart className="size-4 text-primary" />
        <h3 className="text-sm font-bold uppercase tracking-widest text-foreground">
          Technical Summary
        </h3>
      </div>

      {loading ? (
        <p className="text-xs text-muted-foreground">Loading price history…</p>
      ) : !s ? (
        <p className="text-xs text-muted-foreground">
          {error
            ? "Couldn't load price history from CSE."
            : "No price history available for this stock."}
        </p>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <BarChart3 className="size-3 text-primary" /> Trend
            </span>
            <span
              className={cn(
                "text-xs font-mono font-bold px-2.5 py-0.5 rounded uppercase border",
                TREND_STYLE[s.trend],
              )}
            >
              {TREND_LABEL[s.trend]}
            </span>
          </div>

          <div className="space-y-2">
            <Row
              label="1-month return"
              value={pct(s.return1m)}
              tone={s.return1m === null ? undefined : s.return1m >= 0 ? "up" : "down"}
            />
            <Row
              label="3-month return"
              value={pct(s.return3m)}
              tone={s.return3m === null ? undefined : s.return3m >= 0 ? "up" : "down"}
            />
            <Row label="RSI (14)" value={s.rsi14 === null ? "—" : s.rsi14.toFixed(1)} />
            <Row
              label="Avg daily move (20d)"
              value={s.avgDailyMove === null ? "—" : `${s.avgDailyMove.toFixed(2)}%`}
            />
            <Row
              label="Volume vs 20-day avg"
              value={s.volumeRatio === null ? "—" : `${s.volumeRatio.toFixed(1)}×`}
            />
          </div>

          <ul className="bg-muted/30 border border-border rounded-lg p-3.5 text-xs text-foreground leading-relaxed space-y-1.5 list-disc pl-7">
            {notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>

          <p className="text-[10px] text-muted-foreground leading-snug">
            Calculated from {s.sessions} sessions of CSE daily prices. Rule-based, for information
            only — not investment advice.
          </p>
        </>
      )}
    </div>
  );
}
