// Reusable modal for creating or editing a stock alert.
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import type { AlertInput, AlertType, StockAlert } from "@/lib/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: StockAlert | null;
  onSubmit: (input: AlertInput) => Promise<unknown>;
}

interface FormState {
  symbol: string;
  type: AlertType;
  targetPrice: string;
  active: boolean;
}

const empty: FormState = { symbol: "", type: "ABOVE", targetPrice: "", active: true };

export function AlertFormModal({ open, onOpenChange, initial, onSubmit }: Props) {
  const isEdit = Boolean(initial);
  const [form, setForm] = useState<FormState>(empty);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setErrors({});
      setForm(
        initial
          ? {
              symbol: initial.symbol,
              type: initial.type,
              targetPrice: String(initial.targetPrice),
              active: initial.status === "ACTIVE",
            }
          : empty,
      );
    }
  }, [open, initial]);

  const validate = (): boolean => {
    const next: typeof errors = {};
    if (!form.symbol.trim()) next.symbol = "Symbol is required";
    else if (form.symbol.trim().length > 10) next.symbol = "Max 10 characters";
    const price = Number(form.targetPrice);
    if (!form.targetPrice.trim()) next.targetPrice = "Target price is required";
    else if (Number.isNaN(price) || price <= 0) next.targetPrice = "Enter a valid positive number";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await onSubmit({
        symbol: form.symbol.trim().toUpperCase(),
        type: form.type,
        targetPrice: Number(form.targetPrice),
        status: form.active ? "ACTIVE" : "INACTIVE",
      });
      onOpenChange(false);
    } catch {
      toast.error(isEdit ? "Failed to update alert" : "Failed to create alert");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit alert" : "Create alert"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update this alert's parameters." : "Get notified when a stock hits your target price."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="symbol">Stock symbol</Label>
            <Input
              id="symbol"
              placeholder="e.g. AAPL"
              value={form.symbol}
              onChange={(e) => setForm((f) => ({ ...f, symbol: e.target.value.toUpperCase() }))}
              maxLength={10}
              autoFocus
            />
            {errors.symbol && <p className="text-xs text-destructive">{errors.symbol}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="type">Alert type</Label>
              <Select
                value={form.type}
                onValueChange={(v) => setForm((f) => ({ ...f, type: v as AlertType }))}
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ABOVE">Price above</SelectItem>
                  <SelectItem value="BELOW">Price below</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="price">Target price</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={form.targetPrice}
                onChange={(e) => setForm((f) => ({ ...f, targetPrice: e.target.value }))}
              />
              {errors.targetPrice && (
                <p className="text-xs text-destructive">{errors.targetPrice}</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <p className="text-sm font-medium">Active</p>
              <p className="text-xs text-muted-foreground">Receive notifications for this alert.</p>
            </div>
            <Switch
              checked={form.active}
              onCheckedChange={(v) => setForm((f) => ({ ...f, active: v }))}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving..." : isEdit ? "Update alert" : "Create alert"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
