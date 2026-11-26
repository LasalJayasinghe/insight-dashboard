import { Pencil, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SortableHead } from "@/components/ui/sortable-head";
import { useSort, type SortAccessors } from "@/hooks/use-sort";
import { cn } from "@/lib/utils";
import type { HoldingDto, HoldingSignalsDto } from "@/services/portfolio-service";
import { fmt, fmtCompact, fmtPrice, fmtQty, signed, toneOf } from "./format";
import { PnlCell } from "./pnl-badge";
import { SignalBadges } from "./signal-badges";

type Col =
  | "symbol"
  | "quantity"
  | "avg"
  | "cost"
  | "bes"
  | "price"
  | "today"
  | "value"
  | "weight"
  | "pnl"
  | "volume"
  | "turnover";

const ACCESSORS: SortAccessors<HoldingDto, Col> = {
  symbol: (h) => h.symbol,
  quantity: (h) => h.quantity,
  avg: (h) => h.averageBuyPrice,
  cost: (h) => h.costPerShare ?? null,
  bes: (h) => h.breakEvenPrice ?? null,
  price: (h) => h.currentPrice,
  today: (h) => h.dayChangePercent,
  value: (h) => h.currentValue,
  weight: (h) => h.weightPercent,
  pnl: (h) => h.profitLoss,
  volume: (h) => h.shareVolume ?? null,
  turnover: (h) => h.turnover ?? null,
};

interface Props {
  holdings: HoldingDto[];
  currency: string;
  isStock: boolean;
  signals: Map<string, HoldingSignalsDto>;
  signalsLoading: boolean;
  onSelect: (h: HoldingDto) => void;
  onDelete: (id: number) => void;
  /** Correct quantity / average price (no cash moves). */
  onEdit?: (h: HoldingDto) => void;
  /** Open the trade dialog on Sell for this holding. */
  onSell?: (h: HoldingDto) => void;
}

/**
 * The trading-desk holdings table: every column sorts (click header; again to reverse).
 * The sort choice is remembered per browser.
 */
export function HoldingsTable({
  holdings,
  currency,
  isStock,
  signals,
  signalsLoading,
  onSelect,
  onDelete,
  onEdit,
  onSell,
}: Props) {
  const sort = useSort(holdings, ACCESSORS, {
    initialKey: "value",
    initialDir: "desc",
    storageKey: isStock ? "portfolio-holdings-stocks" : "portfolio-holdings-crypto",
  });

  const head = (col: Col, label: string, align: "left" | "right" = "right", hint?: string) => (
    <SortableHead
      align={align}
      hint={hint}
      sortDir={sort.dirOf(col)}
      onSort={() => sort.toggle(col)}
      className="h-9 px-3 text-[11px] uppercase tracking-wider"
    >
      {label}
    </SortableHead>
  );

  return (
    <div className="overflow-x-auto rounded-lg border border-border/50">
      <Table className="min-w-[1180px]">
        <TableHeader className="sticky top-0 z-10 bg-card">
          <TableRow className="bg-muted/30 hover:bg-muted/30">
            {head("symbol", "Symbol", "left")}
            {head("quantity", "Qty")}
            {head("avg", "Avg buy")}
            {isStock &&
              head(
                "cost",
                "Cost/sh",
                "right",
                "Cost per share = avg buy × 1.0112 (what you paid incl. the 1.12% buy fee). Selling at this price still loses the 1.12% sell fee.",
              )}
            {isStock &&
              head(
                "bes",
                "BES",
                "right",
                "Break-even selling price = avg × 1.0112 ÷ 0.9888: covers the buy AND sell fees, so P/L is exactly 0 here.",
              )}
            {head("price", "Price")}
            {head("today", "Today")}
            {head("value", "Value")}
            {head("weight", "Weight")}
            {head(
              "pnl",
              "P/L",
              "right",
              isStock ? "Unrealised P/L after 1.12% buy and sell charges" : undefined,
            )}
            {isStock && head("volume", "Volume", "right", "Shares traded today (whole market)")}
            {isStock && head("turnover", "Turnover", "right", "Rupee value traded today")}
            {isStock && (
              <TableHead className="h-9 px-3 text-[11px] uppercase tracking-wider">
                Signals
              </TableHead>
            )}
            <TableHead className="h-9 w-8" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {sort.sorted.map((h) => {
            const aboveBes = h.breakEvenPrice != null && h.currentPrice >= h.breakEvenPrice;
            return (
              <TableRow
                key={h.id}
                onClick={() => onSelect(h)}
                className="group cursor-pointer"
                title="Open chart, technicals, dividends and news"
              >
                <TableCell className="px-3 py-2.5">
                  <div className="font-mono text-sm font-semibold text-foreground">{h.symbol}</div>
                  {h.name && (
                    <div className="text-[11px] text-muted-foreground truncate max-w-[180px]">
                      {h.name}
                    </div>
                  )}
                </TableCell>
                <TableCell className="px-3 text-right tabular text-sm">
                  {fmtQty(h.quantity)}
                </TableCell>
                <TableCell className="px-3 text-right tabular text-sm">
                  {fmtPrice(h.averageBuyPrice, currency)}
                </TableCell>
                {isStock && (
                  <TableCell className="px-3 text-right tabular text-sm text-muted-foreground">
                    {h.costPerShare != null ? fmtPrice(h.costPerShare, currency) : "—"}
                  </TableCell>
                )}
                {isStock && (
                  <TableCell className="px-3 text-right tabular text-sm">
                    {h.breakEvenPrice != null ? fmtPrice(h.breakEvenPrice, currency) : "—"}
                  </TableCell>
                )}
                <TableCell
                  className={cn(
                    "px-3 text-right tabular text-sm font-semibold",
                    isStock && h.breakEvenPrice != null
                      ? aboveBes
                        ? "text-success"
                        : "text-destructive"
                      : "text-foreground",
                  )}
                >
                  {fmtPrice(h.currentPrice, currency)}
                </TableCell>
                <TableCell
                  className={cn("px-3 text-right tabular leading-tight", toneOf(h.dayChange))}
                >
                  <div className="text-sm font-semibold">{signed(h.dayChangePercent)}%</div>
                  <div className="text-[11px] opacity-80">{signed(h.dayProfitLoss)}</div>
                </TableCell>
                <TableCell className="px-3 text-right tabular text-sm font-semibold">
                  {fmt(h.currentValue)}
                </TableCell>
                <TableCell className="px-3 text-right">
                  <div className="tabular text-sm">{fmt(h.weightPercent, 1)}%</div>
                  <div className="mt-1 ml-auto h-1 w-14 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary/70"
                      style={{ width: `${Math.min(100, Math.max(0, h.weightPercent))}%` }}
                    />
                  </div>
                </TableCell>
                <TableCell className="px-3 text-right">
                  <PnlCell value={h.profitLoss} pct={h.profitLossPercent} />
                </TableCell>
                {isStock && (
                  <TableCell className="px-3 text-right tabular text-sm">
                    {fmtCompact(h.shareVolume)}
                  </TableCell>
                )}
                {isStock && (
                  <TableCell className="px-3 text-right tabular text-sm">
                    {fmtCompact(h.turnover)}
                  </TableCell>
                )}
                {isStock && (
                  <TableCell className="px-3">
                    {signalsLoading && !signals.has(h.symbol) ? (
                      <span className="text-xs text-muted-foreground">…</span>
                    ) : (
                      <SignalBadges signals={signals.get(h.symbol)} />
                    )}
                  </TableCell>
                )}
                <TableCell className="px-2 text-right whitespace-nowrap">
                  {onSell && (
                    <button
                      type="button"
                      aria-label={`Sell ${h.symbol}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSell(h);
                      }}
                      className="mr-2 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity rounded border border-destructive/30 px-1.5 py-0.5 text-[10px] font-semibold text-destructive hover:bg-destructive/10 cursor-pointer"
                    >
                      Sell
                    </button>
                  )}
                  {onEdit && (
                    <button
                      type="button"
                      aria-label={`Edit ${h.symbol}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(h);
                      }}
                      className="mr-2 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    aria-label={`Remove ${h.symbol}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(h.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity text-muted-foreground hover:text-destructive cursor-pointer"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
