import { useCallback, useEffect, useState } from "react";
import { ChevronDown, ChevronRight, History } from "lucide-react";
import { cn } from "@/lib/utils";
import { SkeletonRows } from "@/components/ui/skeleton";
import {
  portfolioService,
  type PortfolioTransactionDto,
  type TransactionType,
} from "@/services/portfolio-service";
import { fmt, fmtQty, signed, toneOf } from "./format";

const typeLabel: Record<TransactionType, string> = {
  Opening: "Opening",
  Buy: "Buy",
  Sell: "Sell",
  Deposit: "Deposit",
  Withdrawal: "Withdraw",
  CashAdjustment: "Cash adj.",
  HoldingAdjustment: "Edit",
};

const typeTone: Partial<Record<TransactionType, string>> = {
  Buy: "bg-success/10 text-success border-success/20",
  Sell: "bg-destructive/10 text-destructive border-destructive/20",
  Deposit: "bg-primary/10 text-primary border-primary/20",
  Withdrawal: "bg-warning/10 text-warning border-warning/20",
};

/**
 * The portfolio's ledger (newest first), collapsed by default. `refreshKey` reloads it after a trade
 * or cash change.
 */
export function TransactionsList({
  portfolioId,
  currency,
  refreshKey,
}: {
  portfolioId: number;
  currency: string;
  refreshKey: number;
}) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<PortfolioTransactionDto[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    try {
      setItems(await portfolioService.getTransactions(portfolioId, 100));
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [portfolioId]);

  useEffect(() => {
    if (open) void load();
  }, [open, load, refreshKey]);

  return (
    <section className="rounded-lg border border-border/60">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 px-4 py-3 text-left cursor-pointer hover:bg-muted/20"
      >
        <History className="size-4 text-muted-foreground" />
        <span className="text-sm font-semibold">Transaction history</span>
        <span className="text-xs text-muted-foreground">buys, sells and cash movements</span>
        <span className="ml-auto text-muted-foreground">
          {open ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
        </span>
      </button>

      {open && (
        <div className="border-t border-border/60">
          {loading && !items ? (
            <div className="p-4">
              <SkeletonRows rows={4} />
            </div>
          ) : failed ? (
            <p className="p-4 text-sm text-muted-foreground">Could not load the history.</p>
          ) : !items || items.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">No transactions yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    <th className="px-4 py-2 text-left font-semibold">Date</th>
                    <th className="px-3 py-2 text-left font-semibold">Type</th>
                    <th className="px-3 py-2 text-left font-semibold">Symbol</th>
                    <th className="px-3 py-2 text-right font-semibold">Qty @ price</th>
                    <th className="px-3 py-2 text-right font-semibold">Fees</th>
                    <th className="px-3 py-2 text-right font-semibold">Cash</th>
                    <th className="px-3 py-2 text-right font-semibold">Realised</th>
                    <th className="px-4 py-2 text-right font-semibold">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((t) => (
                    <tr
                      key={t.id}
                      className="border-t border-border/40"
                      title={t.notes ?? undefined}
                    >
                      <td className="px-4 py-2 whitespace-nowrap text-xs text-muted-foreground tabular">
                        {new Date(
                          t.executedAt.endsWith("Z") ? t.executedAt : `${t.executedAt}Z`,
                        ).toLocaleString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={cn(
                            "inline-block rounded border px-1.5 py-0.5 text-[10px] font-mono font-semibold",
                            typeTone[t.type] ?? "border-border text-muted-foreground",
                          )}
                        >
                          {typeLabel[t.type] ?? t.type}
                        </span>
                      </td>
                      <td className="px-3 py-2 font-mono text-xs font-semibold">
                        {t.symbol ?? "—"}
                      </td>
                      <td className="px-3 py-2 text-right tabular text-xs">
                        {t.quantity != null && t.price != null
                          ? `${fmtQty(Math.abs(t.quantity))} @ ${fmt(t.price, 4)}`
                          : "—"}
                      </td>
                      <td className="px-3 py-2 text-right tabular text-xs text-muted-foreground">
                        {t.fees ? fmt(t.fees) : "—"}
                      </td>
                      <td
                        className={cn("px-3 py-2 text-right tabular text-xs", toneOf(t.cashChange))}
                      >
                        {t.cashChange ? signed(t.cashChange) : "—"}
                      </td>
                      <td
                        className={cn(
                          "px-3 py-2 text-right tabular text-xs font-semibold",
                          t.realizedProfitLoss != null && toneOf(t.realizedProfitLoss),
                        )}
                      >
                        {t.realizedProfitLoss != null ? signed(t.realizedProfitLoss) : "—"}
                      </td>
                      <td className="px-4 py-2 text-right tabular text-xs">
                        {currency} {fmt(t.cashBalanceAfter)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
