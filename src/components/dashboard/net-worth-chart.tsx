import { useEffect, useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Cell, CellLabel, Delta } from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatRs } from "@/lib/format";
import {
  portfolioService,
  type HistoryRange,
  type PortfolioHistoryDto,
} from "@/services/portfolio-service";

const RANGES: HistoryRange[] = ["1D", "1W", "1M", "3M", "1Y", "ALL"];

/** Compact axis labels — Rs. 1.2M / Rs. 340K — so the y-axis stays narrow. */
function compactRs(value: number) {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return value.toFixed(0);
}

export function NetWorthChart({ portfolioId }: { portfolioId?: number }) {
  const [range, setRange] = useState<HistoryRange>("1M");
  const [history, setHistory] = useState<PortfolioHistoryDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await portfolioService.getHistory(range, portfolioId);
        if (!cancelled) setHistory(data);
      } catch {
        if (!cancelled) setError("Couldn't load value history.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [range, portfolioId]);

  const daily = history?.interval === "day";

  const data = useMemo(
    () =>
      (history?.points ?? []).map((p) => {
        const at = new Date(p.capturedAt);
        return {
          at: at.getTime(),
          label: daily
            ? at.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })
            : at.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
          full: at.toLocaleString("en-GB", {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          }),
          value: p.valueLkr,
        };
      }),
    [history, daily],
  );

  const changePercent = history?.changePercent ?? 0;
  const changeLkr = history?.changeLkr ?? 0;
  const up = changeLkr >= 0;

  return (
    <Cell className="flex flex-col rounded-xl border border-border/60 p-6 shadow-sm overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <CellLabel>{portfolioId ? "Portfolio value over time" : "Net worth over time"}</CellLabel>
          <div className="mt-2 flex flex-wrap items-baseline gap-3">
            {loading ? (
              <Skeleton className="h-7 w-40" />
            ) : (
              <>
                <span className="font-mono text-xl font-semibold tabular-nums">
                  {formatRs(history?.endValueLkr ?? 0)}
                </span>
                <Delta value={changePercent} />
                <span
                  className={cn(
                    "font-mono text-xs tabular-nums",
                    up ? "text-success" : "text-destructive",
                  )}
                >
                  {up ? "+" : ""}
                  {formatRs(changeLkr)} over {range === "ALL" ? "all time" : range}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex gap-1 rounded-lg bg-muted/50 p-1">
          {RANGES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              aria-pressed={r === range}
              className={cn(
                "h-7 rounded-md px-2.5 font-mono text-[11px] font-medium tracking-wide transition-colors",
                r === range
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 h-64 w-full">
        {loading ? (
          <Skeleton className="h-full w-full" />
        ) : error ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            {error}
          </div>
        ) : data.length < 2 ? (
          <div className="flex h-full flex-col items-center justify-center gap-1 text-center">
            <p className="text-sm font-medium">Not enough history yet</p>
            <p className="text-xs text-muted-foreground">
              Value is snapshotted every hour — the curve fills in as those pile up.
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="netWorthGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--color-border)"
                vertical={false}
              />
              <XAxis
                dataKey="label"
                stroke="var(--color-muted-foreground)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                minTickGap={28}
              />
              <YAxis
                stroke="var(--color-muted-foreground)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                width={52}
                domain={["auto", "auto"]}
                tickFormatter={compactRs}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--color-popover)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                labelStyle={{ color: "var(--color-muted-foreground)" }}
                labelFormatter={(_label, payload) => payload?.[0]?.payload?.full ?? ""}
                formatter={(value: number) => [formatRs(value), "Value"]}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="var(--color-primary)"
                strokeWidth={2}
                fill="url(#netWorthGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <p className="mt-3 font-mono text-[10px] tracking-wide text-muted-foreground uppercase">
        {daily ? "One point per day (last snapshot)" : "Hourly snapshots"} · LKR
      </p>
    </Cell>
  );
}
