import { cn } from "@/lib/utils";
import type { PortfolioDetailDto } from "@/services/portfolio-service";
import { fmt, signed, toneOf } from "./format";

function StatTile({
  label,
  value,
  sub,
  tone,
  hint,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: string;
  hint?: string;
}) {
  return (
    <div className="rounded-lg bg-muted/30 border border-border/40 px-3 py-2.5" title={hint}>
      <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/80 mb-0.5">
        {label}
      </div>
      <div className={cn("text-base font-semibold tabular", tone)}>{value}</div>
      {sub && (
        <div className={cn("text-[11px] tabular", tone ?? "text-muted-foreground")}>{sub}</div>
      )}
    </div>
  );
}

/** Portfolio header numbers: value, cost, total and today's P/L, holdings, expected dividends. */
export function PortfolioStats({
  detail,
  expectedDividends,
}: {
  detail: PortfolioDetailDto;
  expectedDividends?: number;
}) {
  const c = detail.baseCurrency;
  const isStock = detail.type === "Stocks";
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2.5">
      <StatTile label="Value" value={`${c} ${fmt(detail.totalValue)}`} />
      <StatTile
        label="Cost"
        value={`${c} ${fmt(detail.totalCost)}`}
        hint={isStock ? "Includes 1.12% buy charges" : undefined}
      />
      <StatTile
        label={isStock ? "Total P/L (after fees)" : "Total P/L"}
        value={signed(detail.totalProfitLoss)}
        sub={`${signed(detail.totalProfitLossPercent)}%`}
        tone={toneOf(detail.totalProfitLoss)}
      />
      <StatTile
        label={isStock ? "Today's P/L" : "24h P/L"}
        value={signed(detail.todayProfitLoss)}
        sub={`${signed(detail.todayProfitLossPercent)}%`}
        tone={toneOf(detail.todayProfitLoss)}
        hint={isStock ? "Change vs previous session close" : "Change vs 24h ago"}
      />
      <StatTile label="Holdings" value={String(detail.holdings.length)} />
      {isStock && (
        <StatTile
          label="Upcoming dividends"
          value={expectedDividends == null ? "—" : `${c} ${fmt(expectedDividends)}`}
          hint="Expected payout (before tax) from announced dividends on stocks you hold"
        />
      )}
    </div>
  );
}
