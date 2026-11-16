import { CalendarClock } from "lucide-react";
import type { HoldingDividendDto } from "@/services/portfolio-service";
import { formatCalendarDate } from "@/lib/format";
import { fmt } from "./format";

/** Announced dividends for stocks in this portfolio, with the payout expected from the held quantity. */
export function HoldingDividends({
  items,
  loading,
  currency,
}: {
  items: HoldingDividendDto[];
  loading: boolean;
  currency: string;
}) {
  return (
    <div className="rounded-lg border border-border/50 p-4">
      <div className="flex items-center gap-2 mb-3">
        <CalendarClock className="size-4 text-primary" />
        <h3 className="text-sm font-semibold">Upcoming dividends on your holdings</h3>
      </div>

      {loading ? (
        <p className="text-xs text-muted-foreground">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          No announced dividends with a future record date for these stocks.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-muted-foreground">
                <th className="text-left font-medium py-1.5">Symbol</th>
                <th className="text-right font-medium py-1.5">DPS</th>
                <th className="text-right font-medium py-1.5">Qty</th>
                <th className="text-right font-medium py-1.5">Expected</th>
                <th className="text-right font-medium py-1.5">Record date</th>
                <th className="text-right font-medium py-1.5">Payment</th>
              </tr>
            </thead>
            <tbody>
              {items.map((d) => (
                <tr
                  key={`${d.symbol}-${d.recordDate}-${d.dividendPerShare}`}
                  className="border-t border-border/30"
                >
                  <td className="py-2 font-mono font-semibold">{d.symbol}</td>
                  <td className="py-2 text-right tabular">{fmt(d.dividendPerShare)}</td>
                  <td className="py-2 text-right tabular">{fmt(d.quantity, 0)}</td>
                  <td className="py-2 text-right tabular font-semibold text-success">
                    {currency} {fmt(d.expectedPayout)}
                  </td>
                  <td className="py-2 text-right tabular">{formatCalendarDate(d.recordDate)}</td>
                  <td className="py-2 text-right tabular">
                    {d.paymentDate ? formatCalendarDate(d.paymentDate) : (d.paymentDateRaw ?? "—")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-[10px] text-muted-foreground">
            Expected payout = quantity held × dividend per share, before withholding tax. You must
            hold the shares on the record date.
          </p>
        </div>
      )}
    </div>
  );
}
