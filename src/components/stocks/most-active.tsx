import { useEffect, useState } from "react";
import { Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SkeletonRows } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { SortableHead } from "@/components/ui/sortable-head";
import { useSort, type SortAccessors } from "@/hooks/use-sort";
import { cn } from "@/lib/utils";
import { stockService, type ActiveStock, type MostActive } from "@/services/stock-service";
import { fmtCompact } from "@/components/portfolio/format";
import { fmtPrice } from "./format";

type Metric = "volume" | "turnover";
type Col = "symbol" | "price" | "pct" | "volume" | "trades" | "turnover";

const ACCESSORS: SortAccessors<ActiveStock, Col> = {
  symbol: (s) => s.symbol,
  price: (s) => s.price,
  pct: (s) => s.changePercentage,
  volume: (s) => s.shareVolume,
  trades: (s) => s.tradeVolume,
  turnover: (s) => s.turnover,
};

const REFRESH_MS = 2 * 60_000;

/**
 * Today's 10 most active CSE stocks by share volume or by turnover (from CSE's trade summary).
 * Loads itself and refreshes every 2 minutes.
 */
export function MostActivePanel({
  onSelectStock,
  className,
}: {
  onSelectStock?: (symbol: string) => void;
  className?: string;
}) {
  const [data, setData] = useState<MostActive | null>(null);
  const [loading, setLoading] = useState(true);
  const [metric, setMetric] = useState<Metric>("turnover");

  useEffect(() => {
    let cancelled = false;
    const load = () =>
      stockService
        .getMostActive(10)
        .then((d) => {
          if (!cancelled) setData(d);
        })
        .catch(() => {
          // Keep the last good data; the panel shows an empty state if there never was any.
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    void load();
    const t = setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  const rows = metric === "volume" ? (data?.byVolume ?? []) : (data?.byTurnover ?? []);
  const sort = useSort(rows, ACCESSORS, { initialKey: metric, initialDir: "desc" });

  // Switching the list re-sorts by its own metric, highest first. toggle() on a new numeric
  // column starts descending; on the same column it flips asc → desc.
  const pick = (m: Metric) => {
    setMetric(m);
    if (sort.sortKey !== m || sort.sortDir !== "desc") sort.toggle(m);
  };

  const head = (col: Col, label: string, align: "left" | "right" = "right") => (
    <SortableHead
      align={align}
      sortDir={sort.dirOf(col)}
      onSort={() => sort.toggle(col)}
      className="h-8 px-2 text-[10px] uppercase tracking-wider"
    >
      {label}
    </SortableHead>
  );

  return (
    <Card className={cn("gradient-card border-border shadow-card flex flex-col", className)}>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2 gap-2">
        <div>
          <CardTitle className="text-base font-semibold flex items-center gap-1.5">
            <Activity className="size-4 text-primary" /> Most Active
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Top 10 by {metric === "volume" ? "shares traded" : "rupee turnover"} today
          </p>
        </div>
        <div className="flex rounded-lg bg-muted/40 p-0.5 text-xs font-semibold">
          {(["turnover", "volume"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => pick(m)}
              className={cn(
                "px-2.5 py-1 rounded-md cursor-pointer transition-colors capitalize",
                metric === m
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {m}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-1 min-h-0">
        {loading ? (
          <SkeletonRows rows={6} />
        ) : rows.length === 0 ? (
          <p className="px-6 pb-6 text-sm text-muted-foreground">No trading activity yet today.</p>
        ) : (
          <div className="overflow-x-auto px-2 pb-3">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  {head("symbol", "Symbol", "left")}
                  {head("price", "Price")}
                  {head("pct", "Chg %")}
                  {head("volume", "Volume")}
                  {head("trades", "Trades")}
                  {head("turnover", "Turnover")}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sort.sorted.map((s) => {
                  const up = s.changePercentage >= 0;
                  return (
                    <TableRow
                      key={s.symbol}
                      onClick={() => onSelectStock?.(s.symbol)}
                      className={cn("group", onSelectStock && "cursor-pointer")}
                    >
                      <TableCell className="px-2 py-2">
                        <div className="font-mono text-xs font-semibold group-hover:text-primary">
                          {s.symbol}
                        </div>
                        <div className="text-[10px] text-muted-foreground truncate max-w-35">
                          {s.name}
                        </div>
                      </TableCell>
                      <TableCell className="px-2 py-2 text-right font-mono text-xs tabular">
                        {fmtPrice(s.price)}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "px-2 py-2 text-right font-mono text-xs tabular",
                          up ? "text-emerald-500" : "text-red-500",
                        )}
                      >
                        {up ? "+" : ""}
                        {s.changePercentage.toFixed(2)}%
                      </TableCell>
                      <TableCell className="px-2 py-2 text-right font-mono text-xs tabular">
                        {fmtCompact(s.shareVolume)}
                      </TableCell>
                      <TableCell className="px-2 py-2 text-right font-mono text-xs tabular">
                        {fmtCompact(s.tradeVolume)}
                      </TableCell>
                      <TableCell className="px-2 py-2 text-right font-mono text-xs tabular font-semibold">
                        {fmtCompact(s.turnover)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
