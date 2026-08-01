import { cn } from "@/lib/utils";
import type { StockIndices, MarketStatus } from "@/services/stock-service";
import { Activity, Clock, TrendingUp, TrendingDown, Landmark } from "lucide-react";
import { fmtPrice, fmtChange } from "./stock-cards";

interface MarketOverviewPanelProps {
  indices: StockIndices | null;
  status: MarketStatus | null;
  loading: boolean;
}

export function MarketOverviewPanel({ indices, status, loading }: MarketOverviewPanelProps) {
  return (
    <div className="rounded-xl border border-white/7 bg-[#0d1117] flex flex-col min-h-[300px]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/7">
        <div className="flex items-center gap-2">
          <Landmark className="size-4 text-primary" />
          <span className="text-sm font-bold uppercase tracking-widest text-foreground">
            Market Overview
          </span>
        </div>
        
        {status && (
          <div className="flex items-center gap-3">
            <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded flex items-center gap-1",
              status.isOpen ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
            )}>
              <span className={cn("size-1.5 rounded-full", status.isOpen ? "bg-emerald-400 animate-pulse" : "bg-red-400")} />
              {status.isOpen ? "MARKET OPEN" : "MARKET CLOSED"}
            </span>
            <span className="text-[10px] text-muted-foreground font-mono flex items-center gap-1">
              <Clock className="size-3" />
              {new Date(status.updatedAt).toLocaleTimeString()}
            </span>
          </div>
        )}
      </div>

      <div className="p-6 flex-1 flex flex-col justify-center">
        {loading ? (
          <div className="flex items-center justify-center text-sm text-muted-foreground animate-pulse">
            Loading market data...
          </div>
        ) : !indices ? (
          <div className="flex items-center justify-center text-sm text-muted-foreground">
            Market indices unavailable
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl mx-auto">
            {/* ASPI */}
            <div className="flex flex-col gap-2 p-6 rounded-xl bg-[#161b27] border border-white/10 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-blue-500/50 group-hover:bg-blue-400 transition-colors" />
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                All Share Price Index (ASPI)
              </h3>
              <div className="flex items-baseline gap-3 mt-2">
                <span className="text-4xl font-black font-mono text-foreground tracking-tighter">
                  {fmtPrice(indices.aspi.value)}
                </span>
                <span className={cn("text-lg font-bold font-mono flex items-center",
                  indices.aspi.change >= 0 ? "text-emerald-400" : "text-red-400"
                )}>
                  {indices.aspi.change >= 0 ? <TrendingUp className="size-4 mr-1" /> : <TrendingDown className="size-4 mr-1" />}
                  {indices.aspi.percentage.toFixed(2)}%
                </span>
              </div>
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10 text-xs font-mono text-muted-foreground">
                <span>High: <strong className="text-foreground">{fmtPrice(indices.aspi.highValue)}</strong></span>
                <span>Change: <strong className={indices.aspi.change >= 0 ? "text-emerald-400" : "text-red-400"}>{fmtChange(indices.aspi.change)}</strong></span>
                <span>Low: <strong className="text-foreground">{fmtPrice(indices.aspi.lowValue)}</strong></span>
              </div>
            </div>

            {/* S&P SL20 */}
            <div className="flex flex-col gap-2 p-6 rounded-xl bg-[#161b27] border border-white/10 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-purple-500/50 group-hover:bg-purple-400 transition-colors" />
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                S&P SL20 Index
              </h3>
              <div className="flex items-baseline gap-3 mt-2">
                <span className="text-4xl font-black font-mono text-foreground tracking-tighter">
                  {fmtPrice(indices.snp.value)}
                </span>
                <span className={cn("text-lg font-bold font-mono flex items-center",
                  indices.snp.change >= 0 ? "text-emerald-400" : "text-red-400"
                )}>
                  {indices.snp.change >= 0 ? <TrendingUp className="size-4 mr-1" /> : <TrendingDown className="size-4 mr-1" />}
                  {indices.snp.percentage.toFixed(2)}%
                </span>
              </div>
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10 text-xs font-mono text-muted-foreground">
                <span>High: <strong className="text-foreground">{fmtPrice(indices.snp.highValue)}</strong></span>
                <span>Change: <strong className={indices.snp.change >= 0 ? "text-emerald-400" : "text-red-400"}>{fmtChange(indices.snp.change)}</strong></span>
                <span>Low: <strong className="text-foreground">{fmtPrice(indices.snp.lowValue)}</strong></span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
