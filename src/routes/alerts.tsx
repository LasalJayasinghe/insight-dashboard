import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
import { AlertsTable } from "@/components/alerts/alerts-table";
import { AlertFormModal } from "@/components/alerts/alert-form-modal";
import { useAlerts } from "@/hooks/use-alerts";
import { isAuthenticated } from "@/lib/auth";
import { Bell, Plus, Search, AlertTriangle } from "lucide-react";
import type { StockAlert } from "@/lib/types";
import { watchlistService, type StockOption } from "@/services/watchlist-service";
import { toast } from "sonner";

export const Route = createFileRoute("/alerts")({
  beforeLoad: () => {
    if (typeof window !== "undefined" && !isAuthenticated()) {
      throw redirect({ to: "/login" });
    }
  },
  head: () => ({
    meta: [
      { title: "Stock Alerts — AlertMe Trading" },
      { name: "description", content: "Create, edit and manage your stock price alerts." },
    ],
  }),
  component: AlertsPage,
});

function AlertsPage() {
  const { alerts, loading, error, refresh, create, update, remove } = useAlerts();
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<StockAlert | null>(null);
  const [pendingDelete, setPendingDelete] = useState<StockAlert | null>(null);
  const [stockOptions, setStockOptions] = useState<StockOption[]>([]);
  const [stockOptionsLoading, setStockOptionsLoading] = useState(false);

  useEffect(() => {
    if (!modalOpen || stockOptions.length > 0) return;

    let cancelled = false;

    const loadStockOptions = async () => {
      setStockOptionsLoading(true);
      try {
        const data = await watchlistService.listStockOptions();
        if (!cancelled) setStockOptions(data);
      } catch {
        if (!cancelled) toast.error("Failed to load stock names");
      } finally {
        if (!cancelled) setStockOptionsLoading(false);
      }
    };

    void loadStockOptions();

    return () => {
      cancelled = true;
    };
  }, [modalOpen, stockOptions.length]);

  const filtered = useMemo(() => {
    const q = query.trim().toUpperCase();
    if (!q) return alerts;
    return alerts.filter((a) => a.symbol.includes(q));
  }, [alerts, query]);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (alert: StockAlert) => {
    setEditing(alert);
    setModalOpen(true);
  };

  const handleSubmit = async (input: Parameters<typeof create>[0]) => {
    if (editing) await update(editing.id, input);
    else await create(input);
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    await remove(pendingDelete.id);
    setPendingDelete(null);
  };

  const activeCount = alerts.filter((a) => a.status === "ACTIVE").length;

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Stock Alerts</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Get notified the moment your target prices are hit.
            </p>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Filter by symbol..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9 h-10 w-full md:w-64"
              />
            </div>
            <Button onClick={openCreate} className="gradient-primary text-primary-foreground shadow-elegant">
              <Plus className="size-4" /> New alert
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-5 gradient-card border-border shadow-card">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Total alerts</p>
            <p className="mt-2 text-2xl font-semibold">{alerts.length}</p>
          </Card>
          <Card className="p-5 gradient-card border-border shadow-card">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Active</p>
            <p className="mt-2 text-2xl font-semibold text-success">{activeCount}</p>
          </Card>
          <Card className="p-5 gradient-card border-border shadow-card">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Inactive</p>
            <p className="mt-2 text-2xl font-semibold text-muted-foreground">
              {alerts.length - activeCount}
            </p>
          </Card>
        </div>

        {error ? (
          <Card className="p-8 flex flex-col items-center text-center gap-3 border-destructive/40">
            <AlertTriangle className="size-8 text-destructive" />
            <div>
              <p className="font-medium">Couldn't load alerts</p>
              <p className="text-sm text-muted-foreground mt-1">{error}</p>
            </div>
            <Button variant="outline" onClick={() => void refresh()}>
              Try again
            </Button>
          </Card>
        ) : loading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="p-12 flex flex-col items-center text-center gap-3">
            <div className="size-12 rounded-full bg-muted flex items-center justify-center">
              <Bell className="size-6 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">
                {query ? "No alerts match your search" : "No alerts yet"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {query
                  ? "Try a different symbol."
                  : "Create your first alert to get notified on price movements."}
              </p>
            </div>
            {!query && (
              <Button onClick={openCreate} className="mt-2">
                <Plus className="size-4" /> Create alert
              </Button>
            )}
          </Card>
        ) : (
          <AlertsTable alerts={filtered} onEdit={openEdit} onDelete={setPendingDelete} />
        )}
      </div>

      <AlertFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        initial={editing}
        onSubmit={handleSubmit}
        stockOptions={stockOptions}
        stockOptionsLoading={stockOptionsLoading}
      />

      <AlertDialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this alert?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete &&
                `You're about to delete the ${pendingDelete.type === "ABOVE" ? "above" : "below"} alert for ${pendingDelete.symbol}. This can't be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
