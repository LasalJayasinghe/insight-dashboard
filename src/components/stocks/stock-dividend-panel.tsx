import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, Coins, Landmark, RefreshCw } from "lucide-react";
import { dividendService, type DividendItem } from "@/services/dividend-service";
import { cn } from "@/lib/utils";
import { formatCalendarDate } from "@/lib/format";
import { SkeletonRows, SkeletonStats } from "@/components/ui/skeleton";

interface StockDividendPanelProps {
  symbol: string;
}

/**
 * The API parses CSE payment dates where it can and keeps the original text when it cannot,
 * so fall back to that raw string rather than showing a dash.
 */
function formatPaymentDate(item: DividendItem): string {
  return item.paymentDate ? formatDate(item.paymentDate) : item.paymentDateText?.trim() || "-";
}

/** Calendar dates arrive as `yyyy-MM-dd`; render them without a time-zone shift. */
function formatDate(value?: string | null): string {
  return formatCalendarDate(value, { year: "numeric", month: "short", day: "2-digit" });
}

function formatLkr(value: number): string {
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    maximumFractionDigits: 4,
  }).format(value);
}

export function StockDividendPanel({ symbol }: StockDividendPanelProps) {
  const [items, setItems] = useState<DividendItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await dividendService.getBySymbol(symbol, 6);
      setItems(data);
    } catch {
      setError("Could not load dividend history right now.");
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  useEffect(() => {
    void load();
  }, [load]);

  const latest = useMemo(() => items[0], [items]);

  return (
    <section className="rounded-xl border border-border bg-card shadow-card p-5 space-y-4">
      <div className="flex items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <Coins className="size-4 text-primary" />
          <h3 className="text-sm font-bold uppercase tracking-widest text-foreground">
            Dividend Snapshot
          </h3>
        </div>

        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
        >
          <RefreshCw className={cn("size-3", loading && "animate-spin")} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          <SkeletonStats count={3} />
          <SkeletonRows rows={4} avatar={false} />
        </div>
      ) : error ? (
        <p className="text-xs text-red-400">{error}</p>
      ) : items.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          No dividend records found for this stock yet.
        </p>
      ) : (
        <>
          {latest && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="rounded-lg border border-primary/25 bg-primary/5 px-3 py-2">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Latest Payment Date
                </p>
                <p className="mt-1 text-sm font-bold text-primary inline-flex items-center gap-1.5">
                  <CalendarDays className="size-3.5" />
                  {formatPaymentDate(latest)}
                </p>
              </div>

              <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Voting DPS
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {formatLkr(latest.votingDivPerShare)}
                </p>
              </div>

              <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Record Date
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground inline-flex items-center gap-1.5">
                  <Landmark className="size-3.5 text-primary/80" />
                  {formatDate(latest.recordDate)}
                </p>
              </div>
            </div>
          )}

          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[760px] text-xs">
              <thead className="bg-muted/40 text-muted-foreground uppercase tracking-wider">
                <tr>
                  <th className="px-3 py-2 text-left">Announced</th>
                  <th className="px-3 py-2 text-left">Financial Year</th>
                  <th className="px-3 py-2 text-right">Voting DPS</th>
                  <th className="px-3 py-2 text-right">Non-Voting DPS</th>
                  <th className="px-3 py-2 text-left">Record Date</th>
                  <th className="px-3 py-2 text-left text-primary">Payment Date</th>
                </tr>
              </thead>
              <tbody>
                {items.map((d) => (
                  <tr key={d.id} className="border-t border-border hover:bg-muted/20">
                    <td className="px-3 py-2">{formatDate(d.dateOfAnnouncement)}</td>
                    <td className="px-3 py-2">{d.financialYear || "-"}</td>
                    <td className="px-3 py-2 text-right font-mono">
                      {formatLkr(d.votingDivPerShare)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono">
                      {formatLkr(d.nonVotingDivPerShare)}
                    </td>
                    <td className="px-3 py-2">{formatDate(d.recordDate)}</td>
                    <td className="px-3 py-2 font-semibold text-primary">{formatPaymentDate(d)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
