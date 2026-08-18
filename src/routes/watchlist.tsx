import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { WatchlistTable } from "@/components/dashboard/watchlist-table";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus } from "lucide-react";
import {
  watchlistService,
  type StockOption,
  type WatchlistStock,
} from "@/services/watchlist-service";
import { isAuthenticated } from "@/lib/auth";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

export const Route = createFileRoute("/watchlist")({
  beforeLoad: () => {
    if (typeof window !== "undefined" && !isAuthenticated()) {
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
  const [query, setQuery] = useState("");
  const [stocks, setStocks] = useState<WatchlistStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [options, setOptions] = useState<StockOption[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [pickerQuery, setPickerQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const data = await watchlistService.list();
        if (!cancelled) setStocks(data);
      } catch {
        if (!cancelled) toast.error("Failed to load watchlist");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toUpperCase();
    if (!q) return stocks;
    return stocks.filter((s) => s.symbol.includes(q) || s.name.includes(q));
  }, [stocks, query]);

  const filteredOptions = useMemo(() => {
    const q = pickerQuery.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) => o.name.toLowerCase().includes(q) || o.symbol.toLowerCase().includes(q),
    );
  }, [options, pickerQuery]);

  const selectedCount = useMemo(() => selected.length, [selected]);

  const loadStockOptions = async () => {
    if (options.length > 0) return;
    setOptionsLoading(true);
    try {
      const data = await watchlistService.listStockOptions();
      setOptions(data);
    } catch {
      toast.error("Failed to load stock list");
    } finally {
      setOptionsLoading(false);
    }
  };

  const openPicker = async () => {
    setPickerOpen(true);
    await loadStockOptions();
  };

  const toggleSelection = (symbol: string, checked: boolean) => {
    setSelected((prev) => {
      if (checked) {
        if (prev.includes(symbol)) return prev;
        return [...prev, symbol];
      }
      return prev.filter((s) => s !== symbol);
    });
  };

  const confirmAddSelected = async () => {
    if (selected.length === 0) {
      setConfirmOpen(false);
      return;
    }

    setAdding(true);
    try {
      const existing = new Set(stocks.map((s) => s.symbol.toUpperCase()));
      const candidates = selected.filter((s) => !existing.has(s.toUpperCase()));

      const settled = await Promise.allSettled(
        candidates.map((symbol) => watchlistService.add(symbol)),
      );

      const added = settled
        .filter((r): r is PromiseFulfilledResult<WatchlistStock> => r.status === "fulfilled")
        .map((r) => r.value);

      const failed = settled.length - added.length;

      if (added.length > 0) {
        setStocks((prev) => [...added, ...prev]);
        toast.success(`${added.length} stock(s) added to watchlist`);
      }

      if (failed > 0) {
        toast.error(`${failed} stock(s) could not be added`);
      }

      setSelected([]);
      setPickerQuery("");
      setConfirmOpen(false);
      setPickerOpen(false);
    } finally {
      setAdding(false);
    }
  };

  const removeStock = async (symbol: string) => {
    try {
      await watchlistService.remove(symbol);
      setStocks((prev) => prev.filter((s) => s.symbol !== symbol));
      toast.success(`${symbol} removed from watchlist`);
    } catch {
      toast.error(`Failed to remove ${symbol}`);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Watchlist</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Symbols you're tracking in real time.
            </p>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Filter symbols..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9 h-10 w-full md:w-64"
              />
            </div>
            <Button
              onClick={() => void openPicker()}
              disabled={adding}
              className="gradient-primary text-primary-foreground shadow-elegant"
            >
              <Plus className="size-4" /> Add symbol
            </Button>
          </div>
        </div>

        {loading ? (
          <Card className="p-5 gradient-card border-border shadow-card">
            <p className="text-sm text-muted-foreground">Loading watchlist...</p>
          </Card>
        ) : stocks.length === 0 ? (
          <Card className="p-6 gradient-card border-border shadow-card">
            <p className="text-sm text-muted-foreground">
              No stocks in your watchlist. Add a stock symbol to get started.
            </p>
          </Card>
        ) : filtered.length === 0 ? (
          <Card className="p-6 gradient-card border-border shadow-card">
            <p className="text-sm text-muted-foreground">No symbols match your filter.</p>
          </Card>
        ) : (
          <WatchlistTable stocks={filtered} onRemoveStock={removeStock} />
        )}

        <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>Select stocks</DialogTitle>
              <DialogDescription>
                Search by stock name and choose one or more symbols to add.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <div className="relative">
                <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  placeholder="Search stock name..."
                  value={pickerQuery}
                  onChange={(e) => setPickerQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              <ScrollArea className="h-72 rounded-md border border-border p-2">
                <div className="space-y-1">
                  {optionsLoading ? (
                    <p className="text-sm text-muted-foreground p-2">Loading stock list...</p>
                  ) : filteredOptions.length === 0 ? (
                    <p className="text-sm text-muted-foreground p-2">No stocks found.</p>
                  ) : (
                    filteredOptions.map((item) => {
                      const checked = selected.includes(item.symbol);
                      return (
                        <label
                          key={item.symbol}
                          className="flex items-start gap-3 rounded-md p-2 hover:bg-muted/40 cursor-pointer"
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(v) => toggleSelection(item.symbol, !!v)}
                          />
                          <div className="leading-tight">
                            <div className="text-sm font-medium">{item.name}</div>
                            <div className="text-xs text-muted-foreground">{item.symbol}</div>
                          </div>
                        </label>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setPickerOpen(false)}>
                Cancel
              </Button>
              <Button disabled={selectedCount === 0 || adding} onClick={() => setConfirmOpen(true)}>
                Add selected ({selectedCount})
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm add to watchlist</AlertDialogTitle>
              <AlertDialogDescription>
                Add {selectedCount} selected stock(s) to your watchlist?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => void confirmAddSelected()}>
                Confirm
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppShell>
  );
}
