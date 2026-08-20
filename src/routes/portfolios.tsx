import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState, useMemo, useRef } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { isAuthenticated } from "@/lib/auth";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Wallet,
  Bitcoin,
  BarChart3,
  RefreshCw,
  CircleDollarSign,
  Upload,
} from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  portfolioService,
  type PortfolioSummaryDto,
  type PortfolioDetailDto,
  type NetWorthOverviewDto,
} from "@/services/portfolio-service";
import { watchlistService, type StockOption } from "@/services/watchlist-service";

export const Route = createFileRoute("/portfolios")({
  beforeLoad: () => {
    if (typeof window !== "undefined" && !isAuthenticated()) {
      throw redirect({ to: "/login" });
    }
  },
  head: () => ({
    meta: [
      { title: "Portfolios — AlertMe Trading" },
      { name: "description", content: "Manage your stock and crypto portfolios." },
    ],
  }),
  component: PortfoliosPage,
});

// ─── helpers ────────────────────────────────────────────────────────────────

function fmt(val: number, decimals = 2) {
  return val.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function PnlBadge({ value, pct }: { value: number; pct: number }) {
  const pos = value >= 0;
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-semibold tabular ${pos ? "text-success" : "text-destructive"}`}
    >
      {pos ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
      {pos ? "+" : ""}
      {fmt(value)} ({pos ? "+" : ""}
      {fmt(pct)}%)
    </span>
  );
}

// ─── Holding Row ────────────────────────────────────────────────────────────

function HoldingRow({
  h,
  currency,
  onDelete,
}: {
  h: PortfolioDetailDto["holdings"][number];
  currency: string;
  onDelete: (id: number) => void;
}) {
  const pos = h.profitLoss >= 0;
  return (
    <tr className="border-b border-border/30 hover:bg-muted/20 transition-colors group">
      <td className="px-4 py-3">
        <span className="font-mono text-sm font-semibold text-foreground">{h.symbol}</span>
        <span className="ml-2 text-xs text-muted-foreground">{h.assetType}</span>
      </td>
      <td className="px-4 py-3 text-right tabular text-sm">
        {fmt(h.quantity, 8).replace(/\.?0+$/, "")}
      </td>
      <td className="px-4 py-3 text-right tabular text-sm">
        {currency} {fmt(h.averageBuyPrice, 4)}
      </td>
      <td className="px-4 py-3 text-right tabular text-sm">
        {currency} {fmt(h.currentPrice, 4)}
      </td>
      <td className="px-4 py-3 text-right tabular text-sm font-semibold">
        {currency} {fmt(h.currentValue)}
      </td>
      <td className="px-4 py-3 text-right">
        <span
          className={`tabular text-xs font-semibold ${pos ? "text-success" : "text-destructive"}`}
        >
          {pos ? "+" : ""}
          {fmt(h.profitLoss)} ({pos ? "+" : ""}
          {fmt(h.profitLossPercent)}%)
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        <button
          onClick={() => onDelete(h.id)}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive cursor-pointer"
        >
          <Trash2 className="size-3.5" />
        </button>
      </td>
    </tr>
  );
}

// ─── Portfolio Detail Panel ──────────────────────────────────────────────────

function PortfolioPanel({
  portfolioId,
  currency,
  onHoldingDeleted,
}: {
  portfolioId: number;
  currency: string;
  onHoldingDeleted: () => void;
}) {
  const [detail, setDetail] = useState<PortfolioDetailDto | null>(null);
  const [loading, setLoading] = useState(true);

  // Add holding dialog
  const [addOpen, setAddOpen] = useState(false);
  const [deleteHoldingId, setDeleteHoldingId] = useState<number | null>(null);
  const [form, setForm] = useState({ symbol: "", quantity: "", averageBuyPrice: "", notes: "" });
  const [saving, setSaving] = useState(false);

  const [stockOptions, setStockOptions] = useState<StockOption[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(false);

  useEffect(() => {
    if (addOpen && detail?.type === "Stocks" && stockOptions.length === 0) {
      const loadOptions = async () => {
        setOptionsLoading(true);
        try {
          const data = await watchlistService.listStockOptions();
          setStockOptions(data);
        } catch {
          toast.error("Failed to load stock list");
        } finally {
          setOptionsLoading(false);
        }
      };
      void loadOptions();
    }
  }, [addOpen, detail?.type, stockOptions.length]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [syncingPdf, setSyncingPdf] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const d = await portfolioService.getById(portfolioId);
      setDetail(d);
    } catch {
      toast.error("Failed to load portfolio details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [portfolioId]);

  const handleAddHolding = async () => {
    if (!form.symbol || !form.quantity || !form.averageBuyPrice) {
      toast.error("Symbol, quantity, and average buy price are required.");
      return;
    }
    setSaving(true);
    try {
      await portfolioService.addHolding(portfolioId, {
        symbol: form.symbol.toUpperCase(),
        quantity: parseFloat(form.quantity),
        averageBuyPrice: parseFloat(form.averageBuyPrice),
        notes: form.notes || undefined,
      });
      toast.success(`${form.symbol.toUpperCase()} added to portfolio`);
      setForm({ symbol: "", quantity: "", averageBuyPrice: "", notes: "" });
      setAddOpen(false);
      void load();
      onHoldingDeleted();
    } catch {
      toast.error("Failed to add holding");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteHolding = async () => {
    if (deleteHoldingId == null) return;
    try {
      await portfolioService.deleteHolding(portfolioId, deleteHoldingId);
      toast.success("Holding removed");
      setDeleteHoldingId(null);
      void load();
      onHoldingDeleted();
    } catch {
      toast.error("Failed to delete holding");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSyncingPdf(true);
    const toastId = toast.loading("Syncing portfolio from file...");
    try {
      const res = await portfolioService.syncFromFile(portfolioId, file);
      toast.success(`Successfully synced ${res.count} holdings from file`, { id: toastId });
      void load();
      onHoldingDeleted(); // trigger parent update for net worth
    } catch (error: any) {
      toast.error(error.response?.data || "Failed to sync file", { id: toastId });
    } finally {
      setSyncingPdf(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = ""; // reset input
      }
    }
  };

  if (loading) {
    return <div className="p-6 text-sm text-muted-foreground">Loading holdings...</div>;
  }

  if (!detail) return null;

  return (
    <div className="px-2 pb-4">
      {/* Portfolio stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-4 pt-4 pb-3">
        {[
          { label: "Total Value", value: `${currency} ${fmt(detail.totalValue)}` },
          { label: "Total Cost", value: `${currency} ${fmt(detail.totalCost)}` },
          {
            label: "P/L",
            value: <PnlBadge value={detail.totalProfitLoss} pct={detail.totalProfitLossPercent} />,
          },
          { label: "Holdings", value: detail.holdings.length },
        ].map((s) => (
          <div key={s.label} className="rounded-lg bg-muted/30 px-3 py-2">
            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/70 mb-0.5">
              {s.label}
            </div>
            <div className="text-sm font-semibold">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Holdings table */}
      {detail.holdings.length === 0 ? (
        <div className="px-4 py-6 text-center">
          <p className="text-sm text-muted-foreground mb-3">
            No holdings yet. Add your first position.
          </p>
          <div className="flex items-center justify-center gap-3">
            {detail.type === "Stocks" && (
              <>
                <input
                  type="file"
                  accept=".pdf,.xlsx,.xls"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={syncingPdf}
                >
                  <Upload className="size-4 mr-1" /> {syncingPdf ? "Syncing..." : "Sync ATrad File"}
                </Button>
              </>
            )}
            <Button
              size="sm"
              onClick={() => setAddOpen(true)}
              className="gradient-primary text-primary-foreground shadow-elegant"
            >
              <Plus className="size-4 mr-1" /> Add Holding
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex justify-end gap-3 px-4 pb-2">
            {detail.type === "Stocks" && (
              <>
                <input
                  type="file"
                  accept=".pdf,.xlsx,.xls"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={syncingPdf}
                >
                  <Upload className="size-4 mr-1" /> {syncingPdf ? "Syncing..." : "Sync ATrad File"}
                </Button>
              </>
            )}
            <Button
              size="sm"
              onClick={() => setAddOpen(true)}
              className="gradient-primary text-primary-foreground shadow-elegant"
            >
              <Plus className="size-4 mr-1" /> Add Holding
            </Button>
          </div>
          <div className="overflow-x-auto rounded-lg border border-border/40 mx-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/40 bg-muted/20">
                  {["Symbol", "Quantity", "Avg Buy", "Current Price", "Value", "P/L", ""].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-4 py-2.5 text-[10px] font-mono uppercase tracking-widest text-muted-foreground/70 text-right first:text-left"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {detail.holdings.map((h) => (
                  <HoldingRow key={h.id} h={h} currency={currency} onDelete={setDeleteHoldingId} />
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Add Holding Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Holding</DialogTitle>
            <DialogDescription>
              Enter the asset symbol (e.g. ABAN.N0000 or BTCUSDT) and your purchase details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">
                Symbol
              </label>
              {detail.type === "Stocks" ? (
                <Select
                  value={form.symbol}
                  onValueChange={(val) => setForm((f) => ({ ...f, symbol: val }))}
                >
                  <SelectTrigger className="font-mono uppercase">
                    <SelectValue placeholder="Select Stock Symbol" />
                  </SelectTrigger>
                  <SelectContent>
                    {optionsLoading ? (
                      <div className="p-2 text-sm text-muted-foreground text-center">
                        Loading...
                      </div>
                    ) : (
                      stockOptions.map((s) => (
                        <SelectItem key={s.symbol} value={s.symbol}>
                          <div className="flex justify-between items-center w-full gap-8 min-w-[200px]">
                            <span className="font-semibold">{s.symbol}</span>
                            <span className="text-muted-foreground text-xs truncate max-w-[150px]">
                              {s.name}
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              ) : (
                <Select
                  value={form.symbol}
                  onValueChange={(val) => setForm((f) => ({ ...f, symbol: val }))}
                >
                  <SelectTrigger className="font-mono uppercase h-auto py-2.5">
                    <SelectValue placeholder="Select Crypto Symbol" />
                  </SelectTrigger>
                  <SelectContent className="max-w-[400px]">
                    {[
                      {
                        symbol: "BTCUSDT",
                        base: "BTC",
                        quote: "USDT",
                        price: "$64,017.53",
                        change: "-1.58%",
                        h: "$65,391.14",
                        l: "$63,806.27",
                        vol: "888.24M",
                        icon: "B",
                      },
                      {
                        symbol: "ETHUSDT",
                        base: "ETH",
                        quote: "USDT",
                        price: "$1,875.54",
                        change: "-2.17%",
                        h: "$1,931.57",
                        l: "$1,867.96",
                        vol: "387.50M",
                        icon: "E",
                      },
                      {
                        symbol: "BNBUSDT",
                        base: "BNB",
                        quote: "USDT",
                        price: "$600.4000",
                        change: "-0.78%",
                        h: "$606.8400",
                        l: "$597.3200",
                        vol: "50.99M",
                        icon: "B",
                      },
                      {
                        symbol: "SOLUSDT",
                        base: "SOL",
                        quote: "USDT",
                        price: "$75.8800",
                        change: "-1.20%",
                        h: "$77.1700",
                        l: "$75.5800",
                        vol: "95.41M",
                        icon: "S",
                      },
                      {
                        symbol: "XRPUSDT",
                        base: "XRP",
                        quote: "USDT",
                        price: "$1.0139",
                        change: "-1.97%",
                        h: "$1.0410",
                        l: "$1.0051",
                        vol: "64.59M",
                        icon: "X",
                      },
                      {
                        symbol: "ADAUSDT",
                        base: "ADA",
                        quote: "USDT",
                        price: "$0.190700",
                        change: "-2.65%",
                        h: "$0.199300",
                        l: "$0.189000",
                        vol: "13.90M",
                        icon: "A",
                      },
                      {
                        symbol: "DOGEUSDT",
                        base: "DOGE",
                        quote: "USDT",
                        price: "$0.069960",
                        change: "+0.19%",
                        h: "$0.070240",
                        l: "$0.069400",
                        vol: "14.70M",
                        icon: "D",
                      },
                    ].map((c) => (
                      <SelectItem key={c.symbol} value={c.symbol} className="py-2 cursor-pointer">
                        <div className="flex items-center gap-4 w-full min-w-[280px]">
                          <div className="flex items-center gap-3 w-[100px] shrink-0">
                            <div className="size-8 rounded-full bg-warning/10 text-warning flex items-center justify-center font-bold text-sm shrink-0">
                              {c.icon}
                            </div>
                            <div className="flex flex-col text-left">
                              <span className="font-bold text-sm leading-none">
                                {c.base}/{c.quote}
                              </span>
                              <span className="text-[10px] text-muted-foreground mt-1">
                                Vol {c.vol}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-col text-right w-[75px] shrink-0">
                            <span className="font-semibold text-sm leading-none">{c.price}</span>
                            <span
                              className={`text-[11px] mt-1 font-bold ${c.change.startsWith("+") ? "text-success" : "text-destructive"}`}
                            >
                              {c.change}
                            </span>
                          </div>

                          <div className="flex flex-col text-right text-[10px] text-muted-foreground w-[70px] shrink-0 ml-auto hidden sm:flex">
                            <span>H: {c.h}</span>
                            <span className="mt-0.5">L: {c.l}</span>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">
                Quantity
              </label>
              <Input
                type="number"
                step="any"
                placeholder="e.g. 100 or 0.00152"
                value={form.quantity}
                onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                className="tabular"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">
                Avg Buy Price ({detail.baseCurrency})
              </label>
              <Input
                type="number"
                step="any"
                placeholder="e.g. 175.50"
                value={form.averageBuyPrice}
                onChange={(e) => setForm((f) => ({ ...f, averageBuyPrice: e.target.value }))}
                className="tabular"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">
                Notes (optional)
              </label>
              <Input
                placeholder="e.g. Long-term hold"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => void handleAddHolding()}
              disabled={saving}
              className="gradient-primary text-primary-foreground shadow-elegant"
            >
              {saving ? "Adding..." : "Add Holding"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Holding Confirm */}
      <AlertDialog
        open={deleteHoldingId != null}
        onOpenChange={(o) => !o && setDeleteHoldingId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove holding?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this holding from the portfolio.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              onClick={() => void handleDeleteHolding()}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Portfolio Card ──────────────────────────────────────────────────────────

function PortfolioCard({
  p,
  onDelete,
  onRefresh,
}: {
  p: PortfolioSummaryDto;
  onDelete: (id: number) => void;
  onRefresh: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const isStock = p.type === "Stocks";

  return (
    <Card className="gradient-card border-border shadow-card overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-muted/10 transition-colors select-none"
        onClick={() => setExpanded((v) => !v)}
      >
        {/* Icon */}
        <div
          className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${isStock ? "bg-primary/10" : "bg-warning/10"}`}
        >
          {isStock ? (
            <BarChart3 className="size-5 text-primary" />
          ) : (
            <Bitcoin className="size-5 text-warning" />
          )}
        </div>

        {/* Name & meta */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm truncate">{p.name}</span>
            <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0 border-border/60">
              {p.baseCurrency}
            </Badge>
            <Badge
              className={`text-[10px] font-mono px-1.5 py-0 ${isStock ? "bg-primary/10 text-primary border-primary/20" : "bg-warning/10 text-warning border-warning/20"} border`}
            >
              {p.type}
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {p.holdingCount} holding{p.holdingCount !== 1 ? "s" : ""}
            {p.description && <span className="ml-2 opacity-70">· {p.description}</span>}
          </div>
        </div>

        {/* Values */}
        <div className="text-right shrink-0 hidden sm:block">
          <div className="text-sm font-semibold tabular">
            {p.baseCurrency} {fmt(p.totalValue)}
          </div>
          <PnlBadge value={p.totalProfitLoss} pct={p.totalProfitLossPercent} />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 ml-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(p.id);
            }}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
          >
            <Trash2 className="size-3.5" />
          </button>
          {expanded ? (
            <ChevronDown className="size-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="size-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {/* Mobile value row */}
      <div className="sm:hidden px-5 pb-3 flex items-center justify-between">
        <span className="text-sm font-semibold tabular">
          {p.baseCurrency} {fmt(p.totalValue)}
        </span>
        <PnlBadge value={p.totalProfitLoss} pct={p.totalProfitLossPercent} />
      </div>

      {/* Expanded detail panel */}
      {expanded && (
        <div className="border-t border-border/40">
          <PortfolioPanel
            portfolioId={p.id}
            currency={p.baseCurrency}
            onHoldingDeleted={onRefresh}
          />
        </div>
      )}
    </Card>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

function PortfoliosPage() {
  const [portfolios, setPortfolios] = useState<PortfolioSummaryDto[]>([]);
  const [netWorth, setNetWorth] = useState<NetWorthOverviewDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"All" | "Stocks" | "Crypto">("All");

  // Create portfolio dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [newForm, setNewForm] = useState({
    name: "",
    type: "1",
    baseCurrency: "LKR",
    description: "",
  });
  const [creating, setCreating] = useState(false);
  const [newFormFile, setNewFormFile] = useState<File | null>(null);

  // Delete portfolio confirm
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [ps, nw] = await Promise.all([
        portfolioService.list(),
        portfolioService.getNetWorth("LKR"),
      ]);
      setPortfolios(ps);
      setNetWorth(nw);
    } catch {
      toast.error("Failed to load portfolios");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  // Auto-set currency based on type
  const handleTypeChange = (val: string) => {
    setNewForm((f) => ({
      ...f,
      type: val,
      baseCurrency: val === "1" ? "LKR" : "USDT",
    }));
  };

  const handleCreate = async () => {
    if (!newForm.name.trim()) {
      toast.error("Portfolio name is required.");
      return;
    }
    setCreating(true);
    try {
      const newPortfolio = await portfolioService.create({
        name: newForm.name.trim(),
        type: parseInt(newForm.type),
        baseCurrency: newForm.baseCurrency,
        description: newForm.description || undefined,
      });

      if (newFormFile) {
        toast.loading("Syncing holdings from file...", { id: "create-sync" });
        try {
          const res = await portfolioService.syncFromFile(newPortfolio.id, newFormFile);
          toast.success(`Portfolio created and ${res.count} holdings synced`, { id: "create-sync" });
        } catch (error: any) {
          toast.error(error.response?.data || "Portfolio created, but failed to sync file", { id: "create-sync" });
        }
      } else {
        toast.success(`Portfolio "${newForm.name}" created`);
      }

      setNewForm({ name: "", type: "1", baseCurrency: "LKR", description: "" });
      setNewFormFile(null);
      setCreateOpen(false);
      void load();
    } catch {
      toast.error("Failed to create portfolio");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    if (deleteId == null) return;
    try {
      await portfolioService.delete(deleteId);
      toast.success("Portfolio deleted");
      setDeleteId(null);
      void load();
    } catch {
      toast.error("Failed to delete portfolio");
    }
  };

  const filtered = useMemo(() => {
    if (filter === "All") return portfolios;
    return portfolios.filter((p) => p.type === filter);
  }, [portfolios, filter]);

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Portfolios</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Track your stock and crypto investments.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => void load()} className="gap-1.5">
              <RefreshCw className="size-3.5" /> Refresh
            </Button>
            <Button
              size="sm"
              onClick={() => setCreateOpen(true)}
              className="gradient-primary text-primary-foreground shadow-elegant"
            >
              <Plus className="size-4" /> New Portfolio
            </Button>
          </div>
        </div>

        {/* Net Worth Summary Card */}
        {netWorth && (
          <Card className="gradient-card border-border shadow-card p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Wallet className="size-5 text-primary" />
              </div>
              <div>
                <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground/70 mb-1">
                  Total Net Worth
                </div>
                <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4">
                  <div className="text-2xl font-bold tabular tracking-tight text-foreground">
                    LKR {fmt(netWorth.totalNetWorthLkr)}
                  </div>
                  <div className="text-lg font-semibold tabular tracking-tight text-muted-foreground">
                    USDT {fmt(netWorth.totalNetWorthUsdt)}
                  </div>
                </div>
              </div>
              <div className="ml-auto hidden sm:block">
                <PnlBadge
                  value={netWorth.totalProfitLossLkr}
                  pct={
                    netWorth.totalNetWorthLkr > 0
                      ? (netWorth.totalProfitLossLkr /
                          (netWorth.totalNetWorthLkr - netWorth.totalProfitLossLkr)) *
                        100
                      : 0
                  }
                />
                {netWorth.usdtToLkrRate > 0 && (
                  <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <CircleDollarSign className="size-3" />1 USDT = LKR{" "}
                    {fmt(netWorth.usdtToLkrRate)}
                  </div>
                )}
              </div>
            </div>
            {/* Per-portfolio bars */}
            {netWorth.portfolios.length > 1 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {netWorth.portfolios.map((p) => (
                  <div
                    key={p.id}
                    className="rounded-lg bg-muted/30 px-3 py-2 flex items-center justify-between gap-2"
                  >
                    <div>
                      <div className="text-xs font-semibold truncate max-w-[120px]">{p.name}</div>
                      <div className="text-[10px] text-muted-foreground font-mono">
                        {p.type} · {p.baseCurrency}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-semibold tabular">
                        {p.baseCurrency} {fmt(p.totalValue)}
                      </div>
                      <PnlBadge value={p.totalProfitLoss} pct={p.totalProfitLossPercent} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 bg-muted/30 rounded-xl p-1 w-fit">
          {(["All", "Stocks", "Crypto"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filter === f
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f}
              {f !== "All" && (
                <span className="ml-1.5 text-[10px] opacity-60">
                  ({portfolios.filter((p) => p.type === f).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Portfolio List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <Card key={i} className="gradient-card border-border shadow-card p-5 animate-pulse">
                <div className="h-4 bg-muted/40 rounded w-48" />
                <div className="h-3 bg-muted/30 rounded w-24 mt-2" />
              </Card>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="gradient-card border-border shadow-card p-10 text-center">
            <Wallet className="size-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              {filter === "All"
                ? "No portfolios yet. Create your first one to get started."
                : `No ${filter} portfolios found.`}
            </p>
            {filter === "All" && (
              <Button
                size="sm"
                className="mt-4 gradient-primary text-primary-foreground shadow-elegant"
                onClick={() => setCreateOpen(true)}
              >
                <Plus className="size-4 mr-1" /> Create Portfolio
              </Button>
            )}
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((p) => (
              <PortfolioCard key={p.id} p={p} onDelete={setDeleteId} onRefresh={load} />
            ))}
          </div>
        )}

        {/* Create Portfolio Dialog */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create Portfolio</DialogTitle>
              <DialogDescription>
                Name your portfolio and choose its type. The base currency is set automatically.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-1">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">
                  Portfolio Name
                </label>
                <Input
                  placeholder="e.g. CSE Growth Stocks"
                  value={newForm.name}
                  onChange={(e) => setNewForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">
                  Type
                </label>
                <Select value={newForm.type} onValueChange={handleTypeChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">📈 Stocks (LKR)</SelectItem>
                    <SelectItem value="2">₿ Crypto (USDT)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">
                  Base Currency
                </label>
                <div className="px-3 py-2 rounded-md bg-muted/30 border border-border text-sm font-mono font-semibold text-primary">
                  {newForm.baseCurrency}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">
                  Description (optional)
                </label>
                <Input
                  placeholder="e.g. Long-term dividend stocks"
                  value={newForm.description}
                  onChange={(e) => setNewForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>
              {newForm.type === "1" && (
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">
                    Upload ATrad Export (Optional)
                  </label>
                  <Input
                    type="file"
                    accept=".pdf,.xlsx,.xls"
                    onChange={(e) => setNewFormFile(e.target.files?.[0] || null)}
                    className="text-sm cursor-pointer"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Upload your ATrad Client Portfolio PDF or Excel file to auto-populate holdings.
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => void handleCreate()}
                disabled={creating}
                className="gradient-primary text-primary-foreground shadow-elegant"
              >
                {creating ? "Creating..." : "Create Portfolio"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Portfolio Confirm */}
        <AlertDialog open={deleteId != null} onOpenChange={(o) => !o && setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete portfolio?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the portfolio and all its holdings. This action cannot
                be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                onClick={() => void handleDelete()}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppShell>
  );
}
