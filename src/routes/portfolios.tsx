import { createFileRoute, redirect } from "@tanstack/react-router";
import { useCallback, useEffect, useState, useMemo, useRef } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { isAuthenticated } from "@/lib/auth";
import { apiErrorMessage } from "@/lib/api-error";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
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
  type HoldingDto,
  type HoldingSignalsDto,
  type NetWorthOverviewDto,
  type PortfolioDetailDto,
  type PortfolioInsightsDto,
  type PortfolioSummaryDto,
} from "@/services/portfolio-service";
import { SkeletonRows } from "@/components/ui/skeleton";
import { NetWorthChart } from "@/components/dashboard/net-worth-chart";
import { AddHoldingDialog } from "@/components/portfolio/add-holding-dialog";
import { HoldingDetailSheet } from "@/components/portfolio/holding-detail-sheet";
import { HoldingDividends } from "@/components/portfolio/holding-dividends";
import { HoldingsTable } from "@/components/portfolio/holdings-table";
import { PnlBadge } from "@/components/portfolio/pnl-badge";
import { PortfolioStats } from "@/components/portfolio/portfolio-stats";
import { fmt, signed, toneOf } from "@/components/portfolio/format";

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

/** Prices refresh in the background (the API serves CSE prices refreshed every 2 min). */
const REFRESH_MS = 60_000;
const INSIGHTS_REFRESH_MS = 10 * 60_000;

/** "COMB" and "COMB.N0000" both mean the same CSE security. */
const normalizeSymbol = (s: string) => {
  const u = s.trim().toUpperCase();
  return u.includes(".") ? u : `${u}.N0000`;
};

// ─── Portfolio trading desk (expanded portfolio) ─────────────────────────────

function PortfolioPanel({
  portfolioId,
  currency,
  onChanged,
}: {
  portfolioId: number;
  currency: string;
  onChanged: () => void;
}) {
  const [detail, setDetail] = useState<PortfolioDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [insights, setInsights] = useState<PortfolioInsightsDto | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);

  const [addOpen, setAddOpen] = useState(false);
  const [deleteHoldingId, setDeleteHoldingId] = useState<number | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [syncingFile, setSyncingFile] = useState(false);

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        setDetail(await portfolioService.getById(portfolioId));
        setUpdatedAt(new Date());
      } catch {
        if (!silent) toast.error("Failed to load portfolio details");
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [portfolioId],
  );

  const loadInsights = useCallback(async () => {
    setInsightsLoading(true);
    try {
      setInsights(await portfolioService.getInsights(portfolioId));
    } catch {
      // Signals/dividends are extras: the table still works without them.
    } finally {
      setInsightsLoading(false);
    }
  }, [portfolioId]);

  useEffect(() => {
    void load();
  }, [load]);

  const isStock = detail?.type === "Stocks";

  useEffect(() => {
    if (!isStock) return;
    void loadInsights();
    const t = setInterval(() => void loadInsights(), INSIGHTS_REFRESH_MS);
    return () => clearInterval(t);
  }, [isStock, loadInsights]);

  // Keep prices fresh while the tab is visible.
  useEffect(() => {
    const t = setInterval(() => {
      if (document.visibilityState === "visible") void load(true);
    }, REFRESH_MS);
    return () => clearInterval(t);
  }, [load]);

  const refreshAll = () => {
    void load(true);
    if (isStock) void loadInsights();
    onChanged();
  };

  const signals = useMemo(() => {
    const map = new Map<string, HoldingSignalsDto>();
    if (!detail || !insights) return map;
    const bySymbol = new Map(insights.signals.map((s) => [normalizeSymbol(s.symbol), s]));
    for (const h of detail.holdings) {
      const s = bySymbol.get(normalizeSymbol(h.symbol));
      if (s) map.set(h.symbol, s);
    }
    return map;
  }, [detail, insights]);

  const selected: HoldingDto | null =
    selectedId == null ? null : (detail?.holdings.find((h) => h.id === selectedId) ?? null);

  const handleDeleteHolding = async () => {
    if (deleteHoldingId == null) return;
    try {
      await portfolioService.deleteHolding(portfolioId, deleteHoldingId);
      toast.success("Holding removed");
      setDeleteHoldingId(null);
      refreshAll();
    } catch {
      toast.error("Failed to delete holding");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSyncingFile(true);
    const toastId = toast.loading("Syncing portfolio from file...");
    try {
      const res = await portfolioService.syncFromFile(portfolioId, file);
      toast.success(`Successfully synced ${res.count} holdings from file`, { id: toastId });
      refreshAll();
    } catch (error) {
      toast.error(apiErrorMessage(error, "Failed to sync file"), { id: toastId });
    } finally {
      setSyncingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (loading) {
    return (
      <div className="p-4">
        <SkeletonRows rows={6} />
      </div>
    );
  }

  if (!detail) return null;

  const actions = (
    <div className="flex items-center gap-2">
      {isStock && (
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
            disabled={syncingFile}
          >
            <Upload className="size-4 mr-1" /> {syncingFile ? "Syncing..." : "Sync ATrad File"}
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
  );

  return (
    <div className="space-y-4 p-4">
      <PortfolioStats detail={detail} expectedDividends={insights?.expectedDividendIncome} />

      {detail.holdings.length === 0 ? (
        <div className="py-6 text-center space-y-3">
          <p className="text-sm text-muted-foreground">No holdings yet. Add your first position.</p>
          <div className="flex justify-center">{actions}</div>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              Click a column to sort · click a row for chart, technicals, dividends and news
              {updatedAt && <> · updated {updatedAt.toLocaleTimeString()}</>}
            </p>
            {actions}
          </div>
          <HoldingsTable
            holdings={detail.holdings}
            currency={currency}
            isStock={isStock}
            signals={signals}
            signalsLoading={insightsLoading && !insights}
            onSelect={(h) => setSelectedId(h.id)}
            onDelete={setDeleteHoldingId}
          />
        </>
      )}

      <div className={cn("grid gap-4", isStock && "lg:grid-cols-2")}>
        {isStock && (
          <HoldingDividends
            items={insights?.upcomingDividends ?? []}
            loading={insightsLoading && !insights}
            currency={currency}
          />
        )}
        <NetWorthChart portfolioId={portfolioId} />
      </div>

      <AddHoldingDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        portfolioId={portfolioId}
        isStock={isStock}
        currency={detail.baseCurrency}
        onSaved={refreshAll}
      />

      <HoldingDetailSheet
        holding={selected}
        currency={currency}
        isStock={isStock}
        signals={selected ? signals.get(selected.symbol) : undefined}
        onOpenChange={(open) => !open && setSelectedId(null)}
      />

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
  defaultExpanded = false,
  onDelete,
  onRefresh,
}: {
  p: PortfolioSummaryDto;
  defaultExpanded?: boolean;
  onDelete: (id: number) => void;
  onRefresh: () => void;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const isStock = p.type === "Stocks";

  return (
    <Card className="gradient-card border-border shadow-card overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-muted/10 transition-colors select-none"
        onClick={() => setExpanded((v) => !v)}
      >
        <div
          className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${isStock ? "bg-primary/10" : "bg-warning/10"}`}
        >
          {isStock ? (
            <BarChart3 className="size-5 text-primary" />
          ) : (
            <Bitcoin className="size-5 text-warning" />
          )}
        </div>

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

        <div className="text-right shrink-0 hidden sm:block">
          <div className="text-sm font-semibold tabular">
            {p.baseCurrency} {fmt(p.totalValue)}
          </div>
          <PnlBadge value={p.totalProfitLoss} pct={p.totalProfitLossPercent} />
          <div className={cn("text-[11px] tabular", toneOf(p.todayProfitLoss))}>
            Today {signed(p.todayProfitLoss)} ({signed(p.todayProfitLossPercent)}%)
          </div>
        </div>

        <div className="flex items-center gap-1 ml-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(p.id);
            }}
            aria-label={`Delete ${p.name}`}
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

      {/* Small-screen value row */}
      <div className="sm:hidden px-5 pb-3 flex items-center justify-between">
        <span className="text-sm font-semibold tabular">
          {p.baseCurrency} {fmt(p.totalValue)}
        </span>
        <PnlBadge value={p.totalProfitLoss} pct={p.totalProfitLossPercent} />
      </div>

      {expanded && (
        <div className="border-t border-border/40">
          <PortfolioPanel portfolioId={p.id} currency={p.baseCurrency} onChanged={onRefresh} />
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
          toast.success(`Portfolio created and ${res.count} holdings synced`, {
            id: "create-sync",
          });
        } catch (error) {
          toast.error(apiErrorMessage(error, "Portfolio created, but failed to sync file"), {
            id: "create-sync",
          });
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
            {filtered.map((p, i) => (
              <PortfolioCard
                key={p.id}
                p={p}
                defaultExpanded={i === 0}
                onDelete={setDeleteId}
                onRefresh={load}
              />
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
