import { createFileRoute, redirect } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { WatchlistTable } from "@/components/dashboard/watchlist-table";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus } from "lucide-react";

export const Route = createFileRoute("/watchlist")({
  beforeLoad: () => {
    if (typeof window !== "undefined" && !localStorage.getItem("token")) {
      throw redirect({ to: "/login" });
    }
  },
  head: () => ({
    meta: [
      { title: "Watchlist — AlertMe Trading" },
      { name: "description", content: "Track and manage the symbols you care about." },
    ],
  }),
  component: WatchlistPage,
});

function WatchlistPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Watchlist</h1>
            <p className="text-sm text-muted-foreground mt-1">Symbols you're tracking in real time.</p>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <Input placeholder="Filter symbols..." className="pl-9 h-10 w-full md:w-64" />
            </div>
            <Button className="gradient-primary text-primary-foreground shadow-elegant">
              <Plus className="size-4" /> Add symbol
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { l: "Top gainer", v: "NVDA", d: "+3.18%", c: "text-success" },
            { l: "Top loser", v: "TSLA", d: "-2.41%", c: "text-destructive" },
            { l: "Most volume", v: "NVDA", d: "92.4M", c: "text-foreground" },
          ].map((it) => (
            <Card key={it.l} className="p-5 gradient-card border-border shadow-card">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">{it.l}</p>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-xl font-semibold">{it.v}</span>
                <span className={`text-sm font-semibold tabular ${it.c}`}>{it.d}</span>
              </div>
            </Card>
          ))}
        </div>

        <WatchlistTable />
      </div>
    </AppShell>
  );
}
