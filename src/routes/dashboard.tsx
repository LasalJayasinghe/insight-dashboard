import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { isAuthenticated } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PieChart, List, TrendingUp, Eye, ArrowUpRight, DollarSign, Activity } from "lucide-react";
import {
  portfolioService,
  type NetWorthOverviewDto,
  type PortfolioSummaryDto,
} from "@/services/portfolio-service";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: () => {
    if (typeof window !== "undefined" && !isAuthenticated()) {
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
  const firstName = typeof window !== "undefined" ? localStorage.getItem("firstName") : "";

  const [netWorth, setNetWorth] = useState<NetWorthOverviewDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchNetWorth = async () => {
      try {
        const data = await portfolioService.getNetWorth("LKR");
        if (isMounted) {
          setNetWorth(data);
        }
      } catch (error) {
        console.error("Failed to fetch net worth", error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchNetWorth();
    return () => {
      isMounted = false;
    };
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "LKR",
      minimumFractionDigits: 2,
    }).format(value);
  };

  // Find best performer
  let bestPerformer: PortfolioSummaryDto | null = null;
  if (netWorth && netWorth.portfolios.length > 0) {
    bestPerformer = [...netWorth.portfolios].sort(
      (a, b) => b.totalProfitLossPercent - a.totalProfitLossPercent,
    )[0];
  }

  // Calculate overall percentage
  let totalPnlPercent = 0;
  if (netWorth && netWorth.totalNetWorthLkr > 0) {
    const totalCost = netWorth.totalNetWorthLkr - netWorth.totalProfitLossLkr;
    if (totalCost > 0) {
      totalPnlPercent = (netWorth.totalProfitLossLkr / totalCost) * 100;
    }
  }

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-2">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
              Good morning, {firstName}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Here is your portfolio overview for today.
            </p>
          </div>
        </div>

        {/* Hero Section: Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-32 mt-1" />
              ) : (
                <div className="text-2xl font-bold">
                  {formatCurrency(netWorth?.totalNetWorthLkr || 0)}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">Across all portfolios</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Profit/Loss</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-32 mt-1" />
              ) : (
                <div
                  className={`text-2xl font-bold ${
                    (netWorth?.totalProfitLossLkr || 0) >= 0 ? "text-green-500" : "text-red-500"
                  }`}
                >
                  {(netWorth?.totalProfitLossLkr || 0) >= 0 ? "+" : ""}
                  {formatCurrency(netWorth?.totalProfitLossLkr || 0)} (
                  {(netWorth?.totalProfitLossLkr || 0) >= 0 ? "+" : ""}
                  {totalPnlPercent.toFixed(2)}%)
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Best Portfolio</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-32 mt-1" />
              ) : (
                <>
                  <div className="text-2xl font-bold truncate">
                    {bestPerformer ? bestPerformer.name : "---"}
                  </div>
                  {bestPerformer ? (
                    <p className="text-xs text-green-500 mt-1 font-medium">
                      +{bestPerformer.totalProfitLossPercent.toFixed(2)}%
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-1">No data</p>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Navigation Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Link to="/portfolios" className="block group">
            <Card className="h-full transition-colors hover:bg-muted/50 border-transparent shadow-sm hover:border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <PieChart className="h-8 w-8 mb-2 text-primary group-hover:scale-110 transition-transform" />
                  <ArrowUpRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <CardTitle className="text-lg">Asset Allocation</CardTitle>
                <CardDescription>View your portfolio breakdown</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link to="/portfolios" className="block group">
            <Card className="h-full transition-colors hover:bg-muted/50 border-transparent shadow-sm hover:border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <List className="h-8 w-8 mb-2 text-primary group-hover:scale-110 transition-transform" />
                  <ArrowUpRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <CardTitle className="text-lg">Your Holdings</CardTitle>
                <CardDescription>Manage your current assets</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link to="/stocks" className="block group">
            <Card className="h-full transition-colors hover:bg-muted/50 border-transparent shadow-sm hover:border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <TrendingUp className="h-8 w-8 mb-2 text-primary group-hover:scale-110 transition-transform" />
                  <ArrowUpRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <CardTitle className="text-lg">Market Movers</CardTitle>
                <CardDescription>See today's top gainers and losers</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link to="/watchlist" className="block group">
            <Card className="h-full transition-colors hover:bg-muted/50 border-transparent shadow-sm hover:border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Eye className="h-8 w-8 mb-2 text-primary group-hover:scale-110 transition-transform" />
                  <ArrowUpRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <CardTitle className="text-lg">Watchlist</CardTitle>
                <CardDescription>Track assets you don't own yet</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
