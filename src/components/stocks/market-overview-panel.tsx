import { cn } from "@/lib/utils";
import type { StockIndices, MarketStatus } from "@/services/stock-service";
import { Clock, TrendingUp, TrendingDown, Activity } from "lucide-react";
import { fmtPrice } from "./stock-cards";
import { formatUtcToLocalTime } from "@/lib/format";

interface MarketOverviewPanelProps {
  indices: StockIndices | null;
  status: MarketStatus | null;
  loading: boolean;
}

export function MarketOverviewPanel({ indices, status, loading }: MarketOverviewPanelProps) {
  return (
    <div className="w-full rounded-xl border border-border/60 bg-card/60 backdrop-blur-md px-4 py-2.5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
      {/* Left: Market Status */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <Activity className="size-4 text-primary" />
          <span className="text-xs font-bold uppercase tracking-wider text-foreground font-mono">
            CSE Market
          </span>
        </div>

        {status ? (
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "text-[10px] font-bold font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full flex items-center gap-1.5",
                status.isOpen
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "bg-red-500/10 text-red-400 border border-red-500/20",
              )}
            >
              <span className={cn("size-1.5 rounded-full", status.isOpen ? "bg-emerald-400 animate-pulse" : "bg-red-400")} />
              {status.isOpen ? "MARKET OPEN" : "MARKET CLOSED"}
            </span>
            <span className="text-[10px] text-muted-foreground font-mono flex items-center gap-1 hidden sm:flex">
              <Clock className="size-3" />
              {formatUtcToLocalTime(status.updatedAt)} (SLST)
            </span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">Market Status Unavailable</span>
        )}
      </div>

      {/* Right: Sleek Index Chips (ASPI + S&P SL20) */}
      <div className="flex items-center gap-3 overflow-x-auto py-0.5">
        {loading ? (
          <div className="text-xs text-muted-foreground animate-pulse">Loading market indices...</div>
        ) : !indices ? (
          <div className="text-xs text-muted-foreground">Indices unavailable</div>
        ) : (
          <>
            {/* ASPI Index Chip */}
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-muted/30 border border-border/40 shrink-0">
              <div>
                <div className="text-[10px] font-bold font-mono text-muted-foreground uppercase leading-none">
                  ASPI Index
                </div>
                <div className="text-xs font-black font-mono text-foreground mt-0.5">
                  {fmtPrice(indices.aspi.value)}
                </div>
              </div>
              <div
                className={cn(
                  "text-[11px] font-bold font-mono px-1.5 py-0.5 rounded flex items-center gap-0.5",
                  indices.aspi.change >= 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400",
                )}
              >
                {indices.aspi.change >= 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                <span>{indices.aspi.percentage >= 0 ? "+" : ""}{indices.aspi.percentage.toFixed(2)}%</span>
              </div>
              <div className="text-[9px] font-mono text-muted-foreground border-l border-border/40 pl-2 hidden lg:block">
                <div>H: {fmtPrice(indices.aspi.highValue)}</div>
                <div>L: {fmtPrice(indices.aspi.lowValue)}</div>
              </div>
            </div>

            {/* S&P SL20 Index Chip */}
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-muted/30 border border-border/40 shrink-0">
              <div>
                <div className="text-[10px] font-bold font-mono text-muted-foreground uppercase leading-none">
                  S&P SL20
                </div>
                <div className="text-xs font-black font-mono text-foreground mt-0.5">
                  {fmtPrice(indices.snp.value)}
                </div>
              </div>
              <div
                className={cn(
                  "text-[11px] font-bold font-mono px-1.5 py-0.5 rounded flex items-center gap-0.5",
                  indices.snp.change >= 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400",
                )}
              >
                {indices.snp.change >= 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                <span>{indices.snp.percentage >= 0 ? "+" : ""}{indices.snp.percentage.toFixed(2)}%</span>
              </div>
              <div className="text-[9px] font-mono text-muted-foreground border-l border-border/40 pl-2 hidden lg:block">
                <div>H: {fmtPrice(indices.snp.highValue)}</div>
                <div>L: {fmtPrice(indices.snp.lowValue)}</div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
