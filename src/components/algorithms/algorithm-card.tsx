import { Link } from "@tanstack/react-router";
import { Activity, ArrowUpRight, Pause, Play } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Algorithm } from "@/lib/algorithm-types";
import { formatPct, formatRelative, formatUsd } from "@/lib/format";

interface Props {
  algorithm: Algorithm;
}

export function AlgorithmCard({ algorithm }: Props) {
  const positive = algorithm.totalPnl >= 0;
  const running = algorithm.status === "RUNNING";
  const signalTone =
    algorithm.currentSignal === "BUY"
      ? "bg-success/10 text-success border-success/20"
      : algorithm.currentSignal === "SELL"
        ? "bg-destructive/10 text-destructive border-destructive/20"
        : "bg-warning/10 text-warning border-warning/20";

  return (
    <Link
      to="/algorithms/$algoId"
      params={{ algoId: algorithm.id }}
      className="group block focus:outline-none"
    >
      <Card
        className={cn(
          "p-6 gradient-card border-border shadow-card",
          "transition-all duration-200 ease-out",
          "group-hover:shadow-elegant group-hover:-translate-y-0.5 group-hover:border-primary/40",
          "group-focus-visible:ring-2 group-focus-visible:ring-ring",
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold tracking-tight truncate">{algorithm.name}</h3>
              <Badge
                variant="outline"
                className={cn(
                  "gap-1.5 text-[10px] uppercase tracking-wider font-medium",
                  running
                    ? "border-success/30 text-success bg-success/10"
                    : "border-muted-foreground/30 text-muted-foreground bg-muted/40",
                )}
              >
                <span
                  className={cn(
                    "size-1.5 rounded-full",
                    running ? "bg-success animate-pulse" : "bg-muted-foreground",
                  )}
                />
                {running ? "Running" : "Stopped"}
              </Badge>
            </div>
            {algorithm.description && (
              <p className="mt-1 text-xs text-muted-foreground line-clamp-1">
                {algorithm.description}
              </p>
            )}
          </div>

          <div
            className={cn(
              "size-10 rounded-xl flex items-center justify-center shrink-0",
              running ? "bg-success/10 text-success" : "bg-muted text-muted-foreground",
            )}
          >
            {running ? <Play className="size-4" /> : <Pause className="size-4" />}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-4">
          <Stat
            label="Total PnL"
            value={formatUsd(algorithm.totalPnl)}
            sub={formatPct(algorithm.totalPnlPct)}
            tone={positive ? "success" : "destructive"}
          />
          <Stat
            label="Win Rate"
            value={`${algorithm.winRate.toFixed(1)}%`}
            sub={`${algorithm.totalTrades} trades`}
          />
          <Stat
            label="Active Signals"
            value={String(algorithm.activeSignals)}
            sub={
              <span
                className={cn(
                  "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[10px] font-medium",
                  signalTone,
                )}
              >
                <Activity className="size-2.5" />
                {algorithm.currentSignal}
              </span>
            }
          />
        </div>

        <div className="mt-5 pt-4 border-t border-border flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            Updated {formatRelative(algorithm.lastUpdated)}
          </span>
          <span className="inline-flex items-center gap-1 text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
            View details <ArrowUpRight className="size-3.5" />
          </span>
        </div>
      </Card>
    </Link>
  );
}

function Stat({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: React.ReactNode;
  tone?: "success" | "destructive";
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 text-lg font-semibold tabular tracking-tight",
          tone === "success" && "text-success",
          tone === "destructive" && "text-destructive",
        )}
      >
        {value}
      </p>
      {sub && <div className="mt-0.5 text-[11px] text-muted-foreground tabular">{sub}</div>}
    </div>
  );
}
