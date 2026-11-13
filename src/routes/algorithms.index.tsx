import { createFileRoute, redirect } from "@tanstack/react-router";
import { RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { AlgorithmGrid } from "@/components/algorithms/algorithm-grid";
import { Button } from "@/components/ui/button";
import { useAlgorithms } from "@/hooks/use-algorithms";
import { isAuthenticated } from "@/lib/auth";

export const Route = createFileRoute("/algorithms/")({
  beforeLoad: () => {
    if (typeof window !== "undefined" && !isAuthenticated()) {
      throw redirect({ to: "/login" });
    }
  },
  head: () => ({
    meta: [
      { title: "Algorithms — AlertMe Trading" },
      {
        name: "description",
        content: "Compare Binance trading algorithms at a glance.",
      },
    ],
  }),
  component: AlgorithmsPage,
});

function AlgorithmsPage() {
  const { data, loading, error, refresh } = useAlgorithms();
  const [category, setCategory] = useState<string>("All");

  const categories = useMemo(
    () => [
      "All",
      ...Array.from(new Set((data ?? []).map((a) => a.category).filter(Boolean) as string[])),
    ],
    [data],
  );
  const visible = useMemo(
    () => (category === "All" ? data : (data?.filter((a) => a.category === category) ?? null)),
    [data, category],
  );
  const summary = useMemo(() => {
    if (!data?.length) return null;
    const running = data.filter((a) => a.status === "RUNNING").length;
    const fees = data.reduce((sum, a) => sum + (a.totalFees ?? 0), 0);
    const best = data.reduce((b, a) => (a.totalPnlPct > b.totalPnlPct ? a : b));
    return { running, fees, best };
  }, [data]);

  return (
    <AppShell>
      <div className="space-y-6 max-w-6xl">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
              Trading Algorithms
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Paper-trading performance across your Binance strategies. P/L is net of Binance fees.
            </p>
            {summary && (
              <p className="text-xs text-muted-foreground mt-1">
                {summary.running}/{data?.length} running · ${summary.fees.toFixed(2)} total fees ·
                best: {summary.best.name} ({summary.best.totalPnlPct >= 0 ? "+" : ""}
                {summary.best.totalPnlPct.toFixed(2)}%)
              </p>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={loading ? "size-4 animate-spin" : "size-4"} />
            Refresh
          </Button>
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {categories.length > 2 && (
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <Button
                key={c}
                size="sm"
                variant={c === category ? "default" : "outline"}
                onClick={() => setCategory(c)}
                className="h-7 rounded-full px-3 text-xs"
              >
                {c}
              </Button>
            ))}
          </div>
        )}

        <AlgorithmGrid algorithms={visible} loading={loading} />
      </div>
    </AppShell>
  );
}
