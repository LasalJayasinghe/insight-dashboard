import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { SortableHead } from "@/components/ui/sortable-head";
import { useSort, type SortAccessors } from "@/hooks/use-sort";
import { cn } from "@/lib/utils";
import type { TopMover } from "@/services/stock-service";
import { fmtChange, fmtPrice } from "./format";

type Col = "symbol" | "price" | "change" | "pct";

const ACCESSORS: SortAccessors<TopMover, Col> = {
  symbol: (m) => m.symbol,
  price: (m) => m.price,
  change: (m) => m.change,
  pct: (m) => m.changePercentage,
};

/** Top gainers / losers as a sortable table (all rows CSE returns — 10 each). */
export function MoversTable({
  rows,
  type,
  onSelect,
}: {
  rows: TopMover[];
  type: "gain" | "loss";
  onSelect?: (symbol: string) => void;
}) {
  // Default order = CSE's ranking by % change (gainers high→low, losers low→high).
  const sort = useSort(rows, ACCESSORS, {
    initialKey: "pct",
    initialDir: type === "gain" ? "desc" : "asc",
  });

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
    <Table>
      <TableHeader className="sticky top-0 z-10 bg-card">
        <TableRow className="hover:bg-transparent">
          {head("symbol", "Symbol", "left")}
          {head("price", "Price")}
          {head("change", "Chg")}
          {head("pct", "Chg %")}
        </TableRow>
      </TableHeader>
      <TableBody>
        {sort.sorted.map((m) => {
          const up = m.changePercentage >= 0;
          return (
            <TableRow
              key={m.symbol}
              onClick={() => onSelect?.(m.symbol)}
              className={cn("group", onSelect && "cursor-pointer")}
            >
              <TableCell className="px-2 py-2 font-mono text-xs font-semibold group-hover:text-primary">
                {m.symbol}
              </TableCell>
              <TableCell className="px-2 py-2 text-right font-mono text-xs tabular">
                {fmtPrice(m.price)}
              </TableCell>
              <TableCell
                className={cn(
                  "px-2 py-2 text-right font-mono text-xs tabular",
                  up ? "text-emerald-500" : "text-red-500",
                )}
              >
                {fmtChange(m.change)}
              </TableCell>
              <TableCell className="px-2 py-2 text-right">
                <span
                  className={cn(
                    "inline-flex rounded px-1.5 py-0.5 font-mono text-[11px] font-bold tabular",
                    up ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500",
                  )}
                >
                  {up ? "+" : ""}
                  {m.changePercentage.toFixed(2)}%
                </span>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
