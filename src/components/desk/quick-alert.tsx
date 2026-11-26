import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { apiErrorMessage } from "@/lib/api-error";
import { cn } from "@/lib/utils";
import { deskService, type DeskAlert, type DeskMarket } from "@/services/desk-service";
import { fmtPrice } from "@/components/portfolio/format";

/** Round a target to sensible precision: 2 dp for CSE, more for small crypto prices. */
function roundTarget(n: number, market: DeskMarket) {
  if (market === "cse") return Math.round(n * 100) / 100;
  const dp = n >= 1000 ? 2 : n >= 1 ? 4 : 6;
  const f = 10 ** dp;
  return Math.round(n * f) / f;
}

interface QuickAlertProps {
  symbol: string;
  market: DeskMarket;
  price: number;
  dayHigh?: number;
  dayLow?: number;
  /** Shown as a preset when you hold the stock. */
  breakEven?: number | null;
  /** Active alerts on the symbol (badge). */
  count?: number;
  /** Called after an alert is created or deleted. */
  onChanged?: () => void;
  /** Icon-only trigger for table rows. */
  compact?: boolean;
  /** Controlled open state (the desk's `A` shortcut). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/**
 * One-click price alert: presets from the live price (±2%, ±5%, day high / low, break-even) or a typed
 * price; above / below is worked out from the current price. Lists the symbol's alerts with delete.
 */
export function QuickAlert({
  symbol,
  market,
  price,
  dayHigh,
  dayLow,
  breakEven,
  count = 0,
  onChanged,
  compact = false,
  open: controlledOpen,
  onOpenChange,
}: QuickAlertProps) {
  const [innerOpen, setInnerOpen] = useState(false);
  const open = controlledOpen ?? innerOpen;
  const setOpen = (v: boolean) => {
    setInnerOpen(v);
    onOpenChange?.(v);
  };

  const [custom, setCustom] = useState("");
  const [fireOnce, setFireOnce] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alerts, setAlerts] = useState<DeskAlert[] | null>(null);

  useEffect(() => {
    if (!open) return;
    setCustom("");
    let cancelled = false;
    deskService
      .alertsFor(symbol)
      .then((a) => !cancelled && setAlerts(a.filter((x) => x.isActive)))
      .catch(() => !cancelled && setAlerts([]));
    return () => {
      cancelled = true;
    };
  }, [open, symbol]);

  const presets: { label: string; target: number }[] =
    price > 0
      ? [
          { label: "+2%", target: price * 1.02 },
          { label: "+5%", target: price * 1.05 },
          { label: "−2%", target: price * 0.98 },
          { label: "−5%", target: price * 0.95 },
          ...(dayHigh && dayHigh > price ? [{ label: "Day high", target: dayHigh }] : []),
          ...(dayLow && dayLow > 0 && dayLow < price ? [{ label: "Day low", target: dayLow }] : []),
          ...(breakEven && breakEven > 0 ? [{ label: "Break-even", target: breakEven }] : []),
        ].map((p) => ({ ...p, target: roundTarget(p.target, market) }))
      : [];

  const create = async (target: number) => {
    if (!(target > 0) || !(price > 0)) return;
    const isAbove = target >= price;
    setSaving(true);
    try {
      await deskService.createAlert({ symbol, targetPrice: target, isAbove, fireOnce });
      toast.success(
        `Alert set: ${symbol} ${isAbove ? "above" : "below"} ${fmtPrice(target, market === "cse" ? "LKR" : "USDT")}`,
      );
      setOpen(false);
      onChanged?.();
    } catch (error) {
      toast.error(apiErrorMessage(error, "Could not create the alert"));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    try {
      await deskService.deleteAlert(id);
      setAlerts((a) => a?.filter((x) => x.id !== id) ?? null);
      onChanged?.();
    } catch {
      toast.error("Could not delete the alert");
    }
  };

  const ccy = market === "cse" ? "LKR" : "USDT";
  const typed = parseFloat(custom);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {compact ? (
          <button
            type="button"
            aria-label={`Quick alert for ${symbol}`}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "relative inline-flex size-7 items-center justify-center rounded-md transition-colors cursor-pointer",
              count > 0
                ? "text-primary hover:bg-primary/10"
                : "text-muted-foreground/60 hover:text-foreground hover:bg-muted/60",
            )}
          >
            <Bell className="size-3.5" />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 rounded-full bg-primary px-1 text-[9px] font-bold leading-[14px] text-primary-foreground">
                {count}
              </span>
            )}
          </button>
        ) : (
          <Button size="sm" variant="outline" className="gap-1.5">
            <Bell className="size-3.5" /> Alert{count > 0 ? ` (${count})` : ""}
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-72 space-y-3 p-3"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-baseline justify-between">
          <span className="font-mono text-xs font-bold">{symbol}</span>
          <span className="font-mono text-xs text-muted-foreground tabular">
            now {fmtPrice(price, ccy)}
          </span>
        </div>

        {presets.length > 0 && (
          <div className="grid grid-cols-3 gap-1.5">
            {presets.map((p) => (
              <button
                key={p.label}
                type="button"
                disabled={saving}
                onClick={() => void create(p.target)}
                title={`${p.target >= price ? "Above" : "Below"} ${fmtPrice(p.target, ccy)}`}
                className={cn(
                  "rounded-md border px-1.5 py-1.5 text-left transition-colors cursor-pointer disabled:opacity-50",
                  p.target >= price
                    ? "border-success/30 hover:bg-success/10"
                    : "border-destructive/30 hover:bg-destructive/10",
                )}
              >
                <span className="block text-[11px] font-semibold">{p.label}</span>
                <span className="block font-mono text-[10px] text-muted-foreground tabular">
                  {fmtPrice(p.target, ccy)}
                </span>
              </button>
            ))}
          </div>
        )}

        <form
          className="flex gap-1.5"
          onSubmit={(e) => {
            e.preventDefault();
            void create(roundTarget(typed, market));
          }}
        >
          <Input
            type="number"
            step="any"
            min="0"
            placeholder={`Price (${ccy})`}
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            className="h-8 tabular"
            aria-label="Alert price"
          />
          <Button type="submit" size="sm" disabled={saving || !(typed > 0)}>
            {typed > 0 ? (typed >= price ? "Above" : "Below") : "Set"}
          </Button>
        </form>

        <label className="flex items-center justify-between gap-2 text-xs cursor-pointer">
          <span>
            Notify once
            <span className="block text-[10px] text-muted-foreground">
              {fireOnce ? "Switches off after it fires" : "Repeats while the price stays past it"}
            </span>
          </span>
          <Switch checked={fireOnce} onCheckedChange={setFireOnce} />
        </label>

        {alerts && alerts.length > 0 && (
          <div className="border-t border-border pt-2">
            <div className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Active on {symbol}
            </div>
            <ul className="space-y-1">
              {alerts.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-2 text-xs">
                  <span className="tabular">
                    {a.isAbove ? "▲ above" : "▼ below"} {fmtPrice(a.targetPrice, ccy)}
                    {!a.fireOnce && <span className="text-muted-foreground"> · repeats</span>}
                  </span>
                  <button
                    type="button"
                    aria-label="Delete alert"
                    onClick={() => void remove(a.id)}
                    className="text-muted-foreground hover:text-destructive cursor-pointer"
                  >
                    <X className="size-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
