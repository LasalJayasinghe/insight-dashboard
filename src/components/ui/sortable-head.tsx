import type { ReactNode, ThHTMLAttributes } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { TableHead } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { SortDir } from "@/hooks/use-sort";

interface SortableHeadProps extends Omit<ThHTMLAttributes<HTMLTableCellElement>, "onClick"> {
  children: ReactNode;
  /** Current direction for this column, or null when another column is sorted. */
  sortDir: SortDir | null;
  onSort: () => void;
  align?: "left" | "right";
  /** Optional hint shown as the button's tooltip (e.g. what BES means). */
  hint?: string;
}

/** Table header cell with a sort button (arrow shows the active direction) and `aria-sort`. */
export function SortableHead({
  children,
  sortDir: dir,
  onSort,
  align = "left",
  hint,
  className,
  ...props
}: SortableHeadProps) {
  const Icon = dir === "asc" ? ArrowUp : dir === "desc" ? ArrowDown : ArrowUpDown;
  return (
    <TableHead
      aria-sort={dir === "asc" ? "ascending" : dir === "desc" ? "descending" : "none"}
      className={cn(align === "right" && "text-right", className)}
      {...props}
    >
      <button
        type="button"
        onClick={onSort}
        title={hint}
        className={cn(
          "inline-flex items-center gap-1 font-semibold whitespace-nowrap transition-colors cursor-pointer select-none hover:text-primary",
          dir ? "text-foreground" : "text-muted-foreground",
          align === "right" && "ml-auto flex-row-reverse",
        )}
      >
        {children}
        <Icon
          className={cn("size-3 shrink-0", dir ? "text-primary" : "text-muted-foreground/50")}
          aria-hidden
        />
      </button>
    </TableHead>
  );
}
