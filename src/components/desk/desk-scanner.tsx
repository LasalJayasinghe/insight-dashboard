import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { fmtCompact, fmtPrice, signed, toneOf } from "@/components/portfolio/format";
import type { DeskBoardRow, DeskMarket } from "@/services/desk-service";

type ScanTab = "active" | "gainers" | "losers";
const TOP = 20;

/** Most active (default), gainers and losers — derived from the full board, no extra calls. */
export function DeskScanner({
  board,
  market,
  selected,
  onSelect,
}: {
  board: DeskBoardRow[];
  market: DeskMarket;
  selected: string | null;
  onSelect: (symbol: string) => void;
}) {
  const [tab, setTab] = useState<ScanTab>("active");
  const ccy = market === "cse" ? "LKR" : "USDT";

  const rows = useMemo(() => {
    const traded = board.filter((r) => (market === "cse" ? (r.trades ?? 0) > 0 : r.volume > 0));
    switch (tab) {
      case "gainers":
        return traded
          .filter((r) => r.changePercent > 0)
          .sort((a, b) => b.changePercent - a.changePercent)
          .slice(0, TOP);
      case "losers":
        return traded
          .filter((r) => r.changePercent < 0)
          .sort((a, b) => a.changePercent - b.changePercent)
          .slice(0, TOP);
      default:
        return [...traded].sort((a, b) => b.turnover - a.turnover).slice(0, TOP);
    }
  }, [board, tab, market]);

  return (
    <section aria-label="Scanner" className="rounded-xl border border-border/60 bg-card">
      <div className="flex items-center justify-between px-3 pt-3">
        <h2 className="text-sm font-semibold">Scanner</h2>
        <span className="text-[10px] text-muted-foreground">top {TOP}</span>
      </div>
      <div role="tablist" className="flex gap-1 px-3 py-2">
        {(
          [
            ["active", "Most active"],
            ["gainers", "Gainers"],
            ["losers", "Losers"],
          ] as const
        ).map(([id, text]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={cn(
              "rounded-md px-2 py-1 text-[11px] font-semibold transition-colors cursor-pointer",
              tab === id
                ? "bg-foreground text-background"
                : "bg-muted/50 text-muted-foreground hover:text-foreground",
            )}
          >
            {text}
          </button>
        ))}
      </div>
      <ul className="max-h-[420px] overflow-auto border-t border-border/60">
        {rows.length === 0 ? (
          <li className="p-4 text-xs text-muted-foreground">Nothing has traded yet.</li>
        ) : (
          rows.map((r) => (
            <li key={r.symbol}>
              <button
                type="button"
                onClick={() => onSelect(r.symbol)}
                className={cn(
                  "flex w-full items-center justify-between gap-2 border-b border-border/40 px-3 py-1.5 text-left text-xs transition-colors cursor-pointer hover:bg-muted/30",
                  r.symbol === selected && "bg-primary/10",
                )}
              >
                <span className="min-w-0">
                  <span className="block font-mono font-bold">
                    {r.symbol.replace(/\.N0000$/, "")}
                  </span>
                  <span className="block truncate text-[10px] text-muted-foreground">
                    {tab === "active"
                      ? `${market === "cse" ? "Rs" : "$"} ${fmtCompact(r.turnover)}`
                      : r.name}
                  </span>
                </span>
                <span className="text-right tabular">
                  <span className="block font-semibold">{fmtPrice(r.price, ccy)}</span>
                  <span className={cn("block text-[10px] font-semibold", toneOf(r.changePercent))}>
                    {signed(r.changePercent)}%
                  </span>
                </span>
              </button>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
