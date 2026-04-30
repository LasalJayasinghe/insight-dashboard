import { createFileRoute, redirect } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { StatCard } from "@/components/dashboard/stat-card";
import { PortfolioChart } from "@/components/dashboard/portfolio-chart";
import { WatchlistTable } from "@/components/dashboard/watchlist-table";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { Wallet, TrendingUp, Briefcase, Activity } from "lucide-react";
import { isAuthenticated } from "@/lib/auth";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: () => {
    if (!isAuthenticated()) {
      throw redirect({ to: "/login" });
    }
  },
  head: () => ({
    meta: [
      { title: "Dashboard — AlertMe Trading" },
      { name: "description", content: "Live portfolio overview, watchlist, and activity." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-2">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
              Good morning, Jamie
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Here's how your portfolio is performing today.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="size-2 rounded-full bg-success animate-pulse" />
            Markets open · NYSE
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Portfolio Value"
            value="$148,392.40"
            delta={2.18}
            hint="vs yesterday"
            icon={Wallet}
            accent="primary"
          />
          <StatCard
            label="Today's P/L"
            value="+$3,162.50"
            delta={2.18}
            hint="profit today"
            icon={TrendingUp}
            accent="success"
          />
          <StatCard
            label="Active Positions"
            value="12"
            hint="across 4 sectors"
            icon={Briefcase}
            accent="primary"
          />
          <StatCard
            label="Buying Power"
            value="$24,800.00"
            delta={-0.42}
            hint="settled cash"
            icon={Activity}
            accent="destructive"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <PortfolioChart />
          </div>
          <RecentActivity />
        </div>

        <WatchlistTable />
      </div>
    </AppShell>
  );
}
