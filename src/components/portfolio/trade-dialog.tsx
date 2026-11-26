import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
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
import { apiErrorMessage } from "@/lib/api-error";
import { cn } from "@/lib/utils";
import {
  portfolioService,
  type PortfolioDetailDto,
  type TradeSide,
} from "@/services/portfolio-service";
import { watchlistService, type StockOption } from "@/services/watchlist-service";
import { fmt, fmtQty, signed, toneOf } from "./format";

/** CSE charges per side (brokerage + CSE + CDS + SEC + STL) — the same rate the server applies. */
const CSE_FEE_RATE = 0.0112;
/** Binance spot fee used when none is entered. */
const CRYPTO_FEE_RATE = 0.001;

const label = "text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block";

/**
 * Buy or sell. Buys pay from the portfolio's cash unless "Pay from cash" is off (recording a
 * position you already had — the old "Add holding"); sells add the net proceeds to cash.
 */
export function TradeDialog({
  open,
  onOpenChange,
  detail,
  initialSide = "Buy",
  initialSymbol,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  detail: PortfolioDetailDto;
  initialSide?: TradeSide;
  initialSymbol?: string;
  onSaved: (detail: PortfolioDetailDto) => void;
}) {
  const isStock = detail.type === "Stocks";
  const ccy = detail.baseCurrency;

  const [side, setSide] = useState<TradeSide>(initialSide);
  const [symbol, setSymbol] = useState(initialSymbol ?? "");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [fee, setFee] = useState("");
  const [useCash, setUseCash] = useState(true);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [stockOptions, setStockOptions] = useState<StockOption[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(false);

  // Reset to what the opener asked for each time the dialog opens.
  useEffect(() => {
    if (!open) return;
    setSide(initialSide);
    setSymbol(initialSymbol ?? "");
    setQuantity("");
    setPrice("");
    setFee("");
    setUseCash(true);
    setNotes("");
  }, [open, initialSide, initialSymbol]);

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

  const holding = detail.holdings.find((h) => h.symbol.toUpperCase() === symbol.toUpperCase());
  const qty = parseFloat(quantity);
  const px = parseFloat(price);
  const valid = qty > 0 && px > 0 && symbol !== "";

  // Mirrors the server's maths so the preview matches what gets recorded.
  const preview = useMemo(() => {
    if (!(qty > 0 && px > 0)) return null;
    const gross = qty * px;
    const fees = isStock
      ? gross * CSE_FEE_RATE
      : fee !== ""
        ? parseFloat(fee) || 0
        : gross * CRYPTO_FEE_RATE;
    if (side === "Buy") {
      const total = gross + fees;
      return { gross, fees, cashEffect: -total, realized: null as number | null };
    }
    const proceeds = gross - fees;
    const avg = holding?.averageBuyPrice ?? 0;
    const costBasis = isStock ? qty * avg * (1 + CSE_FEE_RATE) : qty * avg;
    return { gross, fees, cashEffect: proceeds, realized: holding ? proceeds - costBasis : null };
  }, [qty, px, fee, side, isStock, holding]);

  const cashAfter =
    preview && useCash ? detail.cashBalance + preview.cashEffect : detail.cashBalance;
  const shortOfCash = side === "Buy" && useCash && preview != null && cashAfter < 0;
  const oversell = side === "Sell" && holding != null && qty > holding.quantity;

  const save = async () => {
    if (!valid) {
      toast.error("Choose a symbol and enter a quantity and price above 0.");
      return;
    }
    setSaving(true);
    try {
      const updated = await portfolioService.trade(detail.id, {
        side,
        symbol: symbol.toUpperCase(),
        quantity: qty,
        price: px,
        fees: !isStock && fee !== "" ? parseFloat(fee) : undefined,
        useCash,
        notes: notes || undefined,
      });
      toast.success(`${side === "Buy" ? "Bought" : "Sold"} ${fmtQty(qty)} ${symbol.toUpperCase()}`);
      onOpenChange(false);
      onSaved(updated);
    } catch (error) {
      toast.error(apiErrorMessage(error, "Failed to record the trade"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Trade</DialogTitle>
          <DialogDescription>
            {isStock
              ? "CSE charges of 1.12% are applied on each side, as in the rest of the portfolio."
              : "Exchange fee defaults to 0.1% — enter the real fee if it differed."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-1">
          {/* Buy / Sell */}
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted/40 p-1" role="tablist">
            {(["Buy", "Sell"] as const).map((s) => (
              <button
                key={s}
                type="button"
                role="tab"
                aria-selected={side === s}
                onClick={() => {
                  setSide(s);
                  if (s === "Sell" && !detail.holdings.some((h) => h.symbol === symbol))
                    setSymbol("");
                }}
                disabled={s === "Sell" && detail.holdings.length === 0}
                className={cn(
                  "rounded-md py-1.5 text-sm font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-40",
                  side === s
                    ? s === "Buy"
                      ? "bg-success text-success-foreground"
                      : "bg-destructive text-destructive-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {s}
              </button>
            ))}
          </div>

          <div>
            <label className={label}>Symbol</label>
            <Select value={symbol} onValueChange={setSymbol}>
              <SelectTrigger className="font-mono uppercase">
                <SelectValue placeholder={isStock ? "Select stock" : "Select coin"} />
              </SelectTrigger>
              <SelectContent>
                {side === "Sell" ? (
                  detail.holdings.map((h) => (
                    <SelectItem key={h.symbol} value={h.symbol}>
                      <div className="flex justify-between items-center w-full gap-8 min-w-[200px]">
                        <span className="font-semibold">{h.symbol}</span>
                        <span className="text-muted-foreground text-xs">
                          holding {fmtQty(h.quantity)}
                        </span>
                      </div>
                    </SelectItem>
                  ))
                ) : isStock ? (
                  optionsLoading ? (
                    <div className="space-y-2 p-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-4/5" />
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
                  Object.entries(COIN_META).map(([sym, meta]) => (
                    <SelectItem key={sym} value={sym}>
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
            {side === "Sell" && holding && (
              <button
                type="button"
                onClick={() => setQuantity(String(holding.quantity))}
                className="mt-1 text-[11px] text-muted-foreground underline underline-offset-2 hover:text-foreground cursor-pointer"
              >
                Sell all {fmtQty(holding.quantity)} (avg {fmt(holding.averageBuyPrice, 4)})
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label}>Quantity</label>
              <Input
                type="number"
                step="any"
                min="0"
                placeholder={isStock ? "e.g. 100" : "e.g. 0.0015"}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="tabular"
              />
            </div>
            <div>
              <label className={label}>Price ({ccy})</label>
              <Input
                type="number"
                step="any"
                min="0"
                placeholder={isStock ? "trade price" : "fill price"}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="tabular"
              />
            </div>
          </div>

          {!isStock && (
            <div>
              <label className={label}>Fee ({ccy}) — optional</label>
              <Input
                type="number"
                step="any"
                min="0"
                placeholder={preview ? `${fmt(preview.gross * CRYPTO_FEE_RATE, 4)} (0.1%)` : "0.1%"}
                value={fee}
                onChange={(e) => setFee(e.target.value)}
                className="tabular"
              />
            </div>
          )}

          <label className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 cursor-pointer">
            <span>
              <span className="block text-sm font-medium">
                {side === "Buy" ? "Pay from cash" : "Add proceeds to cash"}
              </span>
              <span className="block text-[11px] text-muted-foreground">
                Cash available: {ccy} {fmt(detail.cashBalance)}
                {side === "Buy" && !useCash && " · recording a position you already had"}
              </span>
            </span>
            <Switch checked={useCash} onCheckedChange={setUseCash} />
          </label>

          {preview && (
            <div className="rounded-lg bg-muted/30 border border-border px-3 py-2.5 space-y-1 text-xs tabular">
              <Row k="Trade value" v={`${ccy} ${fmt(preview.gross)}`} />
              <Row
                k={isStock ? "Charges (1.12%)" : "Fee"}
                v={`${ccy} ${fmt(preview.fees, isStock ? 2 : 4)}`}
              />
              <Row
                k={side === "Buy" ? "Total cost" : "Net proceeds"}
                v={`${ccy} ${fmt(Math.abs(preview.cashEffect))}`}
                strong
              />
              {preview.realized != null && (
                <Row
                  k="Realised P/L"
                  v={`${signed(preview.realized)}`}
                  tone={toneOf(preview.realized)}
                />
              )}
              {useCash && (
                <Row
                  k="Cash after"
                  v={`${ccy} ${fmt(cashAfter)}`}
                  tone={shortOfCash ? "text-destructive" : undefined}
                />
              )}
            </div>
          )}

          {shortOfCash && (
            <p className="text-xs text-destructive">
              Not enough cash for this buy. Deposit first, or turn off "Pay from cash" to record a
              position you already had.
            </p>
          )}
          {oversell && (
            <p className="text-xs text-destructive">
              You hold {fmtQty(holding!.quantity)} {symbol}; you can't sell more than that.
            </p>
          )}

          <div>
            <label className={label}>Notes (optional)</label>
            <Input
              placeholder="e.g. Took profit"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => void save()}
            disabled={saving || !valid || shortOfCash || oversell}
            className={cn(
              "text-primary-foreground",
              side === "Buy"
                ? "bg-success hover:bg-success/90"
                : "bg-destructive hover:bg-destructive/90",
            )}
          >
            {saving ? "Saving..." : side === "Buy" ? "Record buy" : "Record sell"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Row({ k, v, strong, tone }: { k: string; v: string; strong?: boolean; tone?: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground">{k}</span>
      <span className={cn(strong && "font-semibold text-foreground", tone)}>{v}</span>
    </div>
  );
}
