import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { COIN_META } from "@/components/crypto/market-format";
import { portfolioService } from "@/services/portfolio-service";
import { watchlistService, type StockOption } from "@/services/watchlist-service";

const EMPTY = { symbol: "", quantity: "", averageBuyPrice: "", notes: "" };

/** Add (or top up, via weighted average) a holding. */
export function AddHoldingDialog({
  open,
  onOpenChange,
  portfolioId,
  isStock,
  currency,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  portfolioId: number;
  isStock: boolean;
  currency: string;
  onSaved: () => void;
}) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [stockOptions, setStockOptions] = useState<StockOption[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(false);

  useEffect(() => {
    if (!open || !isStock || stockOptions.length > 0) return;
    let cancelled = false;
    setOptionsLoading(true);
    watchlistService
      .listStockOptions()
      .then((data) => {
        if (!cancelled) setStockOptions(data);
      })
      .catch(() => toast.error("Failed to load stock list"))
      .finally(() => {
        if (!cancelled) setOptionsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, isStock, stockOptions.length]);

  const save = async () => {
    const quantity = parseFloat(form.quantity);
    const averageBuyPrice = parseFloat(form.averageBuyPrice);
    if (!form.symbol || !(quantity > 0) || !(averageBuyPrice > 0)) {
      toast.error("Symbol, a quantity above 0 and an average buy price above 0 are required.");
      return;
    }
    setSaving(true);
    try {
      await portfolioService.addHolding(portfolioId, {
        symbol: form.symbol.toUpperCase(),
        quantity,
        averageBuyPrice,
        notes: form.notes || undefined,
      });
      toast.success(`${form.symbol.toUpperCase()} added to portfolio`);
      setForm(EMPTY);
      onOpenChange(false);
      onSaved();
    } catch {
      toast.error("Failed to add holding");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Holding</DialogTitle>
          <DialogDescription>
            Adding a symbol you already hold updates its quantity and weighted average price.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-1">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">
              Symbol
            </label>
            <Select
              value={form.symbol}
              onValueChange={(val) => setForm((f) => ({ ...f, symbol: val }))}
            >
              <SelectTrigger className="font-mono uppercase">
                <SelectValue placeholder={isStock ? "Select stock" : "Select coin"} />
              </SelectTrigger>
              <SelectContent>
                {isStock ? (
                  optionsLoading ? (
                    <div className="space-y-2 p-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-4/5" />
                      <Skeleton className="h-4 w-3/5" />
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
                  )
                ) : (
                  Object.entries(COIN_META).map(([symbol, meta]) => (
                    <SelectItem key={symbol} value={symbol}>
                      <div className="flex items-center gap-3 min-w-[200px]">
                        <span
                          className="size-2.5 rounded-full shrink-0"
                          style={{ background: meta.color }}
                        />
                        <span className="font-semibold">{meta.base}/USDT</span>
                        <span className="text-muted-foreground text-xs">{meta.name}</span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
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
              Avg Buy Price ({currency}){isStock ? " — trade price, before fees" : ""}
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => void save()}
            disabled={saving}
            className="gradient-primary text-primary-foreground shadow-elegant"
          >
            {saving ? "Adding..." : "Add Holding"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
