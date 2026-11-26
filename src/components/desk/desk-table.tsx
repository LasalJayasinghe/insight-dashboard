import { useEffect, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSort, type SortValue } from "@/hooks/use-sort";

export interface DeskColumn<T> {
  key: string;
  label: string;
  align?: "left" | "right";
  /** Sort value; omit for an unsortable column. */
  sort?: (row: T) => SortValue;
  render: (row: T) => ReactNode;
  /** Tooltip on the header. */
  hint?: string;
  className?: string;
}

/**
 * Dense, sortable table for the desk boards. Rows are keyed by symbol; clicking one selects it.
 * `onOrderChange` reports the visible order so the page can move the selection with ↑ / ↓.
 */
export function DeskTable<T extends { symbol: string }>({
  rows,
  columns,
  selected,
  onSelect,
  storageKey,
  initialKey,
  footer,
  empty,
  onOrderChange,
  rowKey,
  initialDir = "desc",
}: {
  rows: T[];
  columns: DeskColumn<T>[];
  selected: string | null;
  onSelect: (symbol: string) => void;
  storageKey: string;
  initialKey?: string;
  footer?: ReactNode;
  empty?: ReactNode;
  onOrderChange?: (symbols: string[]) => void;
  /** Row identity when several rows share a symbol (alerts); defaults to the symbol. */
  rowKey?: (row: T) => string | number;
  initialDir?: "asc" | "desc";
}) {
  const accessors = Object.fromEntries(
    columns.filter((c) => c.sort).map((c) => [c.key, c.sort!]),
  ) as Record<string, (row: T) => SortValue>;
  const sort = useSort(rows, accessors, { initialKey: initialKey ?? null, initialDir, storageKey });

  useEffect(() => {
    onOrderChange?.(sort.sorted.map((r) => r.symbol));
  }, [sort.sorted, onOrderChange]);

  if (rows.length === 0) {
    return (
      <div className="p-6 text-center text-sm text-muted-foreground">
        {empty ?? "Nothing here."}
      </div>
    );
  }

  return (
    <div className="max-h-[560px] overflow-auto">
      <table className="w-full text-xs">
        <thead className="sticky top-0 z-10 bg-card">
          <tr className="border-b border-border">
            {columns.map((c) => {
              const dir = c.sort ? sort.dirOf(c.key) : null;
              const Icon = dir === "asc" ? ArrowUp : dir === "desc" ? ArrowDown : ArrowUpDown;
              return (
                <th
                  key={c.key}
                  scope="col"
                  aria-sort={
                    dir === "asc" ? "ascending" : dir === "desc" ? "descending" : undefined
                  }
                  className={cn(
                    "whitespace-nowrap px-2 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground",
                    c.align === "right" ? "text-right" : "text-left",
                    c.className,
                  )}
                >
                  {c.sort ? (
                    <button
                      type="button"
                      onClick={() => sort.toggle(c.key)}
                      title={c.hint}
                      className={cn(
                        "inline-flex items-center gap-1 cursor-pointer hover:text-foreground",
                        c.align === "right" && "flex-row-reverse",
                        dir && "text-foreground",
                      )}
                    >
                      {c.label}
                      <Icon className={cn("size-3", !dir && "opacity-40")} />
                    </button>
                  ) : (
                    <span title={c.hint}>{c.label}</span>
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sort.sorted.map((row) => (
            <tr
              key={rowKey ? rowKey(row) : row.symbol}
              data-symbol={row.symbol}
              onClick={() => onSelect(row.symbol)}
              aria-selected={row.symbol === selected}
              className={cn(
                "cursor-pointer border-b border-border/40 transition-colors hover:bg-muted/30",
                row.symbol === selected && "bg-primary/10 hover:bg-primary/10",
              )}
            >
              {columns.map((c) => (
                <td
                  key={c.key}
                  className={cn(
                    "whitespace-nowrap px-2 py-1.5 tabular",
                    c.align === "right" ? "text-right" : "text-left",
                    c.className,
                  )}
                >
                  {c.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        {footer && <tfoot className="sticky bottom-0 bg-card">{footer}</tfoot>}
      </table>
    </div>
  );
}
