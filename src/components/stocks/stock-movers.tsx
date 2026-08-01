import { cn } from "@/lib/utils";
import type { StockMovers, TopMover } from "@/services/stock-service";
import { TrendingUp, TrendingDown, Flame } from "lucide-react";
import { fmtPrice, fmtChange } from "./stock-cards";

interface StockMoversPanelProps {
  movers: StockMovers | null;
  loading: boolean;
}

export function StockMoversPanel({ movers, loading }: StockMoversPanelProps) {
  const gainers = movers?.gainers ?? [];
  const losers = movers?.losers ?? [];

  return (
    <div className="rounded-xl border border-border bg-card shadow-card flex flex-col min-h-[400px]">
      <div className="flex items-center px-4 py-3 border-b border-border gap-2">
        <Flame className="size-4 text-orange-500" />
        <span className="text-sm font-bold uppercase tracking-widest text-foreground">
          Top Movers
        </span>
      </div>

      <div className="flex-1 flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-border">
        
        {/* Gainers */}
        <div className="flex-1 p-4">
          <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-4 flex items-center gap-1.5">
            <TrendingUp className="size-3.5" /> Top Gainers
          </h3>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-10 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : gainers.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-10">No gainers found</div>
          ) : (
            <div className="space-y-1">
              {gainers.map((g, i) => (
                <MoverRow key={g.symbol} mover={g} rank={i + 1} type="gain" />
              ))}
            </div>
          )}
        </div>

        {/* Losers */}
        <div className="flex-1 p-4">
          <h3 className="text-xs font-bold text-red-400 uppercase tracking-widest mb-4 flex items-center gap-1.5">
            <TrendingDown className="size-3.5" /> Top Losers
          </h3>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-10 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : losers.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-10">No losers found</div>
          ) : (
            <div className="space-y-1">
              {losers.map((l, i) => (
                <MoverRow key={l.symbol} mover={l} rank={i + 1} type="loss" />
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

function MoverRow({ mover, rank, type }: { mover: TopMover, rank: number, type: "gain" | "loss" }) {
  const isGain = type === "gain";
  return (
    <div className={cn("flex items-center justify-between p-2 rounded-lg hover:bg-muted/40 transition-colors border border-transparent",
      isGain ? "hover:border-emerald-500/20" : "hover:border-red-500/20"
    )}>
      <div className="flex items-center gap-3">
        <span className="text-xs font-bold text-muted-foreground w-4 text-center">{rank}</span>
        <span className="text-sm font-bold font-mono text-foreground">{mover.symbol}</span>
      </div>
      <div className="flex flex-col items-end">
        <span className="text-sm font-bold font-mono text-foreground">{fmtPrice(mover.price)}</span>
        <span className={cn("text-[10px] font-bold font-mono", isGain ? "text-emerald-400" : "text-red-400")}>
          {fmtChange(mover.change)} ({mover.changePercentage.toFixed(2)}%)
        </span>
      </div>
    </div>
  );
}
