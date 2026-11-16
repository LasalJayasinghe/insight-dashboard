import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SortDir } from "@/hooks/use-sort";

/**
 * Column-style sort buttons for card lists that aren't tables (same behaviour as SortableHead).
 */
export function SortBar<K extends string>({
  options,
  dirOf,
  onSort,
  className,
}: {
  options: { key: K; label: string }[];
  dirOf: (key: K) => SortDir | null;
  onSort: (key: K) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-1 text-[11px]", className)}>
      <span className="text-muted-foreground mr-1">Sort:</span>
      {options.map(({ key, label }) => {
        const dir = dirOf(key);
        const Icon = dir === "asc" ? ArrowUp : dir === "desc" ? ArrowDown : ArrowUpDown;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onSort(key)}
            aria-pressed={dir !== null}
            className={cn(
              "inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-semibold transition-colors cursor-pointer",
              dir ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
            <Icon className="size-3" aria-hidden />
          </button>
        );
      })}
    </div>
  );
}
