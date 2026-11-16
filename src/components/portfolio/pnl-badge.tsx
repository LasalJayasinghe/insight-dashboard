import { TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { fmt, signed } from "./format";

/** "▲ +1,234.50 (+5.20%)" coloured by sign. */
export function PnlBadge({
  value,
  pct,
  className,
}: {
  value: number;
  pct: number;
  className?: string;
}) {
  const pos = value >= 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-semibold tabular",
        pos ? "text-success" : "text-destructive",
        className,
      )}
    >
      {pos ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
      {signed(value)} ({signed(pct)}%)
    </span>
  );
}

/** Two-line table cell: amount on top, percentage below. */
export function PnlCell({
  value,
  pct,
  decimals = 2,
}: {
  value: number;
  pct: number;
  decimals?: number;
}) {
  const tone =
    value > 0 ? "text-success" : value < 0 ? "text-destructive" : "text-muted-foreground";
  return (
    <div className={cn("tabular leading-tight", tone)}>
      <div className="text-sm font-semibold">{signed(value, decimals)}</div>
      <div className="text-[11px] opacity-80">{`${pct > 0 ? "+" : ""}${fmt(pct)}%`}</div>
    </div>
  );
}
