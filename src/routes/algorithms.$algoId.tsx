import { createFileRoute, Link, redirect, useRouter } from "@tanstack/react-router";
import { Activity, ArrowLeft, BarChart3, Pause, Percent, Play, TrendingUp } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SummaryStats } from "@/components/algorithms/summary-stats";
import { SignalsTable } from "@/components/algorithms/signals-table";
import { ChartPanel } from "@/components/algorithms/chart-panel";
import { TradeDetailsPanel } from "@/components/algorithms/trade-details-panel";
import { TradeHistory } from "@/components/algorithms/trade-history";
import { useAlgorithmDetail } from "@/hooks/use-algorithms";
import { isAuthenticated } from "@/lib/auth";
import { formatPct, formatUsd } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/algorithms/$algoId")({
  beforeLoad: () => {
    if (typeof window !== "undefined" && !isAuthenticated()) {
      throw redirect({ to: "/login" });
    }
  },
  head: () => ({
    meta: [
      { title: "Algorithm Detail — AlertMe Trading" },
      {
        name: "description",
        content: "Detailed performance, signals, and trades for an algorithm.",
      },
    ],
  }),
  component: AlgorithmDetailPage,
});

function AlgorithmDetailPage() {
  const { algoId } = Route.useParams();
  const router = useRouter();
  const { data, loading, error, toggle } = useAlgorithmDetail(algoId);
  const [toggling, setToggling] = useState(false);

  const onToggle = async () => {
    setToggling(true);
    try {
      const updated = await toggle();
      toast.success(`Algorithm ${updated.status === "RUNNING" ? "started" : "stopped"}`);
    } catch {
      toast.error("Failed to update algorithm");
    } finally {
      setToggling(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.history.back()}
              aria-label="Back"
            >
              <ArrowLeft className="size-4" />
            </Button>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight truncate">
                  {data?.name ?? (loading ? "Loading…" : "Algorithm")}
                </h1>
                {data && (
                  <Badge
                    variant="outline"
                    className={cn(
                      "gap-1.5 text-[10px] uppercase tracking-wider font-medium",
                      data.status === "RUNNING"
                        ? "border-success/30 text-success bg-success/10"
                        : "border-muted-foreground/30 text-muted-foreground bg-muted/40",
                    )}
                  >
                    <span
                      className={cn(
                        "size-1.5 rounded-full",
                        data.status === "RUNNING"
                          ? "bg-success animate-pulse"
                          : "bg-muted-foreground",
                      )}
                    />
                    {data.status === "RUNNING" ? "Running" : "Stopped"}
                  </Badge>
                )}
              </div>
              {data?.description && (
                <p className="text-sm text-muted-foreground mt-0.5">{data.description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link to="/algorithms">
              <Button variant="outline" size="sm">
                All algorithms
              </Button>
            </Link>
            <Button
              size="sm"
              onClick={onToggle}
              disabled={!data || toggling}
              className={cn(
                "gap-2",
                data?.status === "RUNNING"
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : "",
              )}
            >
              {data?.status === "RUNNING" ? (
                <>
                  <Pause className="size-4" /> Stop
                </>
              ) : (
                <>
                  <Play className="size-4" /> Start
                </>
              )}
            </Button>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Summary Stats */}
        {loading || !data ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="p-4 gradient-card border-border">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="mt-3 h-6 w-24" />
              </Card>
            ))}
          </div>
        ) : (
          <SummaryStats
            stats={[
              {
                label: "Total Trades",
                value: String(data.totalTrades),
                icon: BarChart3,
                tone: "primary",
              },
              {
                label: "Win Rate",
                value: `${data.winRate.toFixed(1)}%`,
                icon: Percent,
                tone: "success",
              },
              {
                label: "Total Profit",
                value: `${formatUsd(data.totalPnl)} (${formatPct(data.totalPnlPct)})`,
                icon: TrendingUp,
                tone: data.totalPnl >= 0 ? "success" : "destructive",
              },
              {
                label: "Active Signal",
                value: data.currentSignal,
                hint: `${data.activeSignals} active`,
                icon: Activity,
                tone:
                  data.currentSignal === "BUY"
                    ? "success"
                    : data.currentSignal === "SELL"
                      ? "destructive"
                      : "warning",
              },
            ]}
          />
        )}

        {/* Two-column main */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            {loading || !data ? (
              <Skeleton className="h-80 w-full" />
            ) : (
              <SignalsTable signals={data.signals} />
            )}
          </div>
          <div className="space-y-6">
            {loading || !data ? (
              <>
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-48 w-full" />
              </>
            ) : (
              <>
                <ChartPanel pair={data.signals[0]?.pair ?? "BTC/USDT"} bias={data.currentSignal} />
                <TradeDetailsPanel trade={data.trade} />
              </>
            )}
          </div>
        </div>

        {/* History */}
        {loading || !data ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <TradeHistory history={data.history} />
        )}
      </div>
    </AppShell>
  );
}
