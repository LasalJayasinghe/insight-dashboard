import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { TradeDetails } from "@/lib/algorithm-types";
import { formatUsd } from "@/lib/format";

interface Props {
  trade: TradeDetails;
}

export function TradeDetailsPanel({ trade }: Props) {
  const rows: { label: string; value: string; tone?: "success" | "destructive" }[] = [
    { label: "Entry Price", value: formatUsd(trade.entryPrice) },
    { label: "Stop Loss", value: formatUsd(trade.stopLoss), tone: "destructive" },
    { label: "Take Profit", value: formatUsd(trade.takeProfit), tone: "success" },
  ];

  return (
    <Card className="gradient-card border-border shadow-card p-5">
      <h3 className="font-semibold tracking-tight">Trade Details</h3>
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

      <div className="mt-5">
        <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
          Strategy
        </h4>
        <p className="mt-2 text-sm leading-relaxed text-foreground/90">
          {trade.strategy}
        </p>
      </div>
    </Card>
  );
}
