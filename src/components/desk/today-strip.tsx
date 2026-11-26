import { cn } from "@/lib/utils";
import { fmt, fmtPrice, fmtQty, signed, toneOf } from "@/components/portfolio/format";
import type { DeskMarket, DeskToday } from "@/services/desk-service";

const time = (iso: string) =>
  new Date(iso.endsWith("Z") ? iso : `${iso}Z`).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });

/** Today's trades with realised P/L, alerts that fired, and cash available. */
export function TodayStrip({
  today,
  market,
  cash,
  onSelect,
}: {
  today: DeskToday;
  market: DeskMarket;
  cash: number;
  onSelect: (symbol: string) => void;
}) {
  const ccy = market === "cse" ? "LKR" : "USDT";
  return (
    <section
      aria-label="Today"
      className="grid gap-4 rounded-xl border border-border/60 bg-card p-4 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto]"
    >
      <div className="min-w-0">
        <div className="mb-1.5 flex items-baseline gap-2">
          <h2 className="text-sm font-semibold">Today's trades</h2>
          {today.trades.length > 0 && (
            <span
              className={cn("font-mono text-xs font-semibold", toneOf(today.realizedProfitLoss))}
            >
              realised {signed(today.realizedProfitLoss)}
            </span>
          )}
        </div>
        {today.trades.length === 0 ? (
          <p className="text-xs text-muted-foreground">No buys or sells recorded today.</p>
        ) : (
          <ul className="space-y-1 text-xs">
            {today.trades.slice(0, 8).map((t, i) => (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => onSelect(t.symbol)}
                  className="flex w-full gap-2 text-left tabular cursor-pointer hover:underline"
                >
                  <span className="text-muted-foreground">{time(t.at)}</span>
                  <span className={t.side === "Buy" ? "text-success" : "text-destructive"}>
                    {t.side}
                  </span>
                  <span className="font-mono font-semibold">
                    {t.symbol.replace(/\.N0000$/, "")}
                  </span>
                  <span>
                    {fmtQty(t.quantity)} @ {fmtPrice(t.price, ccy)}
                  </span>
                  {t.realizedProfitLoss != null && (
                    <span className={cn("ml-auto font-semibold", toneOf(t.realizedProfitLoss))}>
                      {signed(t.realizedProfitLoss)}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="min-w-0">
        <h2 className="mb-1.5 text-sm font-semibold">Alerts fired today</h2>
        {today.alertsFired.length === 0 ? (
          <p className="text-xs text-muted-foreground">None yet.</p>
        ) : (
          <ul className="space-y-1 text-xs">
            {today.alertsFired.slice(0, 8).map((a) => (
              <li key={a.id}>
                <button
                  type="button"
                  onClick={() => onSelect(a.symbol)}
                  className="flex w-full gap-2 text-left tabular cursor-pointer hover:underline"
                >
                  <span className="text-muted-foreground">
                    {a.lastTriggeredAt ? time(a.lastTriggeredAt) : ""}
                  </span>
                  <span className="font-mono font-semibold">{a.label}</span>
                  <span>
                    {a.isAbove ? "above" : "below"} {fmtPrice(a.targetPrice, ccy)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="md:text-right">
        <div className="text-[10px] font-mono font-semibold uppercase tracking-widest text-muted-foreground">
          {market === "cse" ? "Buying power" : "USDT available"}
        </div>
        <div className="mt-1 font-mono text-lg font-bold tabular">
          {ccy} {fmt(cash)}
        </div>
      </div>
    </section>
  );
}
