import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { TradeDetails } from "@/lib/algorithm-types";
import { formatUsd } from "@/lib/format";

interface Props {
  trade: TradeDetails | null;
  feeRate?: number;
}

export function TradeDetailsPanel({ trade, feeRate }: Props) {
  const feeLabel = feeRate != null ? `${(feeRate * 100).toFixed(3).replace(/\.?0+$/, "")}%` : null;

  if (!trade) {
    return (
      <Card className="gradient-card border-border shadow-card p-5">
        <h3 className="font-semibold tracking-tight">Trade Details</h3>
        <p className="mt-4 text-sm text-muted-foreground">
          No open position. The bot is waiting for its next entry signal.
        </p>
        {feeLabel && (
          <p className="mt-2 text-xs text-muted-foreground">
            Binance fee: {feeLabel} per side (deducted on entry and exit).
          </p>
        )}
      </Card>
    );
  }

  const rows: { label: string; value: string; tone?: "success" | "destructive" }[] = [
    { label: "Entry Price", value: formatUsd(trade.entryPrice) },
    ...(trade.breakEvenPrice != null
      ? [{ label: "Break-even (incl. fees)", value: formatUsd(trade.breakEvenPrice) }]
      : []),
    ...(trade.currentPrice != null
      ? [{ label: "Current Price", value: formatUsd(trade.currentPrice) }]
      : []),
    ...(trade.entryFee != null ? [{ label: "Entry Fee Paid", value: formatUsd(trade.entryFee) }] : []),
    ...(trade.unrealizedPnl != null
      ? [
          {
            label: "Unrealized P/L (net of fees)",
            value: formatUsd(trade.unrealizedPnl),
            tone: trade.unrealizedPnl >= 0 ? ("success" as const) : ("destructive" as const),
          },
        ]
      : []),
    {
      label: "Stop Loss",
      value: trade.stopLoss != null ? formatUsd(trade.stopLoss) : "—",
      tone: "destructive",
    },
    {
      label: "Take Profit",
      value: trade.takeProfit != null ? formatUsd(trade.takeProfit) : "—",
      tone: "success",
    },
  ];

  return (
    <Card className="gradient-card border-border shadow-card p-5">
      <h3 className="font-semibold tracking-tight">
        Open Position{trade.pair ? ` · ${trade.pair}` : ""}
      </h3>
      <div className="mt-4 space-y-2">
        {rows.map((r) => (
          <div
            key={r.label}
            className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2"
          >
            <span className="text-xs text-muted-foreground">{r.label}</span>
            <span
              className={cn(
                "text-sm font-semibold tabular",
                r.tone === "success" && "text-success",
                r.tone === "destructive" && "text-destructive",
              )}
            >
              {r.value}
            </span>
          </div>
        ))}
      </div>

      {trade.strategy && (
      <div className="mt-5">
        <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
          Strategy
        </h4>
        <p className="mt-2 text-sm leading-relaxed text-foreground/90">{trade.strategy}</p>
      </div>
      )}
    </Card>
  );
}
