import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SkeletonRows } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { StockMovers, TopMover } from "@/services/stock-service";
import { TrendingUp, TrendingDown } from "lucide-react";
import { fmtPrice, fmtChange } from "./stock-cards";

type MoverType = "gain" | "loss";

interface MoversPanelProps {
  movers: StockMovers | null;
  loading?: boolean;
  onSelectStock?: (symbol: string) => void;
}

interface MoversCardProps extends Omit<MoversPanelProps, "movers"> {
  items: TopMover[];
  type: MoverType;
}

const COPY: Record<MoverType, { title: string; subtitle: string; empty: string }> = {
  gain: {
    title: "Top Gainers",
    subtitle: "Biggest upside moves today",
    empty: "No gainers found.",
  },
  loss: {
    title: "Top Losers",
    subtitle: "Biggest downside moves today",
    empty: "No losers found.",
  },
};

function MoversCardHeader({ type, count }: { type: MoverType; count?: number }) {
  const isGain = type === "gain";
  const copy = COPY[type];

  return (
    <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
      <div>
        <CardTitle className="text-base font-semibold flex items-center gap-1.5">
          {isGain ? (
            <TrendingUp className="size-4 text-emerald-400" />
          ) : (
            <TrendingDown className="size-4 text-red-400" />
          )}
          {copy.title}
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-0.5">{copy.subtitle}</p>
      </div>
      {count !== undefined && count > 0 && (
        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-muted/80 text-muted-foreground font-medium border border-border/40">
          {count} Stocks
        </span>
      )}
    </CardHeader>
  );
}

function MoversCard({ items, type, loading = false, onSelectStock }: MoversCardProps) {
  if (loading) {
    return (
      <Card className="gradient-card border-border shadow-card h-105">
        <MoversCardHeader type={type} />
        <CardContent className="p-0">
          <SkeletonRows rows={6} />
        </CardContent>
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <Card className="gradient-card border-border shadow-card h-105">
        <MoversCardHeader type={type} />
        <CardContent>
          <p className="text-sm text-muted-foreground">{COPY[type].empty}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="gradient-card border-border shadow-card h-105 flex flex-col">
      <MoversCardHeader type={type} count={items.length} />
      <CardContent className="p-0 flex-1 min-h-0">
        <ScrollArea className="h-85 px-6 pb-6">
          <div className="space-y-2.5">
            {items.map((m, i) => (
              <MoverRow
                key={m.symbol}
                mover={m}
                rank={i + 1}
                type={type}
                onSelectStock={onSelectStock}
              />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export function TopGainersPanel({ movers, loading, onSelectStock }: MoversPanelProps) {
  return (
    <MoversCard
      items={movers?.gainers ?? []}
      type="gain"
      loading={loading}
      onSelectStock={onSelectStock}
    />
  );
}

export function TopLosersPanel({ movers, loading, onSelectStock }: MoversPanelProps) {
  return (
    <MoversCard
      items={movers?.losers ?? []}
      type="loss"
      loading={loading}
      onSelectStock={onSelectStock}
    />
  );
}

function MoverRow({
  mover,
  rank,
  type,
  onSelectStock,
}: {
  mover: TopMover;
  rank: number;
  type: MoverType;
  onSelectStock?: (symbol: string) => void;
}) {
  const isGain = type === "gain";

  return (
    <div
      onClick={() => onSelectStock?.(mover.symbol)}
      className={cn(
        "p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-all duration-200 flex items-center justify-between gap-3 border border-border/20 group",
        onSelectStock && "cursor-pointer",
        isGain ? "hover:border-emerald-500/40" : "hover:border-red-500/40",
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={cn(
            "size-8 rounded-lg flex items-center justify-center text-xs font-bold tracking-tight shrink-0 font-mono",
            isGain ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400",
          )}
        >
          {rank}
        </div>
        <div className="font-bold text-xs font-mono truncate group-hover:text-primary transition-colors">
          {mover.symbol}
        </div>
      </div>

      <div className="flex flex-col items-end gap-1 shrink-0">
        <span className="text-xs font-bold font-mono tabular text-foreground">
          {fmtPrice(mover.price)}
        </span>
        <span
          className={cn(
            "inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[11px] font-bold font-mono tabular",
            isGain ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400",
          )}
        >
          {fmtChange(mover.change)} ({mover.changePercentage.toFixed(2)}%)
        </span>
      </div>
    </div>
  );
}
