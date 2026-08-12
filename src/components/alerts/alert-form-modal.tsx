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
import { Check, ChevronsUpDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import type { StockOption } from "@/services/watchlist-service";
import type { AlertInput, AlertType, StockAlert } from "@/lib/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: StockAlert | null;
  onSubmit: (input: AlertInput) => Promise<unknown>;
  stockOptions: StockOption[];
  stockOptionsLoading: boolean;
}

interface FormState {
  symbol: string;
  type: AlertType;
  targetPrice: string;
  active: boolean;
}

const empty: FormState = { symbol: "", type: "ABOVE", targetPrice: "", active: true };

export function AlertFormModal({
  open,
  onOpenChange,
  initial,
  onSubmit,
  stockOptions,
  stockOptionsLoading,
}: Props) {
  const isEdit = Boolean(initial);
  const [form, setForm] = useState<FormState>(empty);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [symbolPickerOpen, setSymbolPickerOpen] = useState(false);

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
            {isEdit
              ? "Update this alert's parameters."
              : "Get notified when a stock hits your target price."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="symbol">Stock symbol</Label>
            <Popover open={symbolPickerOpen} onOpenChange={setSymbolPickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  id="symbol"
                  type="button"
                  variant="outline"
                  role="combobox"
                  aria-expanded={symbolPickerOpen}
                  className="w-full justify-between"
                  disabled={isEdit}
                >
                  {form.symbol
                    ? form.symbol
                    : stockOptionsLoading
                      ? "Loading stocks..."
                      : "Select symbol"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search stock name..." />
                  <CommandList>
                    <CommandEmpty>
                      {stockOptionsLoading ? "Loading stocks..." : "No stock found."}
                    </CommandEmpty>
                    <CommandGroup>
                      {stockOptions.map((option) => (
                        <CommandItem
                          key={option.symbol}
                          value={`${option.symbol} ${option.name}`}
                          onSelect={() => {
                            setForm((f) => ({ ...f, symbol: option.symbol }));
                            setSymbolPickerOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              form.symbol === option.symbol ? "opacity-100" : "opacity-0",
                            )}
                          />
                          <div className="flex flex-col">
                            <span>{option.symbol}</span>
                            <span className="text-xs text-muted-foreground">{option.name}</span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {isEdit && (
              <p className="text-xs text-muted-foreground">
                Symbol cannot be changed for an existing alert.
              </p>
            )}
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
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
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
