import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { AlgorithmCard } from "./algorithm-card";
import type { Algorithm } from "@/lib/algorithm-types";

interface Props {
  algorithms: Algorithm[] | null;
  loading: boolean;
}

/**
 * Responsive grid: 2 columns on desktop, 1 column on mobile.
 * Scales gracefully for 3+ algorithms thanks to lg:grid-cols-2 + auto-rows.
 */
export function AlgorithmGrid({ algorithms, loading }: Props) {
  if (loading && !algorithms) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i} className="p-6 gradient-card border-border">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="size-10 rounded-xl" />
            </div>
            <div className="mt-6 grid grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="space-y-2">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-6 w-20" />
                </div>
              ))}
            </div>
            <Skeleton className="mt-5 h-3 w-40" />
          </Card>
        ))}
      </div>
    );
  }

  if (!algorithms || algorithms.length === 0) {
    return (
      <Card className="p-12 text-center border-dashed border-border">
        <p className="text-sm text-muted-foreground">
          No algorithms running yet.
        </p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {algorithms.map((algo) => (
        <AlgorithmCard key={algo.id} algorithm={algo} />
      ))}
    </div>
  );
}
