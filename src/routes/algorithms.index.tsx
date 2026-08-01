import { createFileRoute, redirect } from "@tanstack/react-router";
import { RefreshCw } from "lucide-react";
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

  return (
    <AppShell>
      <div className="space-y-6 max-w-6xl">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
              Trading Algorithms
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Live performance across your active Binance strategies.
            </p>
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

        <AlgorithmGrid algorithms={data} loading={loading} />
      </div>
    </AppShell>
  );
}
