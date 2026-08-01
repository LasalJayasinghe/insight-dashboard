import { cn } from "@/lib/utils";
import type { WhaleTrade } from "@/services/crypto-service";
import { COIN_META, TRACKED_SYMBOLS, fmtPrice, fmtVolume } from "./market-cards";
import { RefreshCw, Loader2 } from "lucide-react";

function timeAgo(dateStr: string) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60)   return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

interface WhaleActivityProps {
  trades: WhaleTrade[];
  loading: boolean;
  symbol: string;
  onSymbolChange: (s: string) => void;
  onRefresh: () => void;
}

export function WhaleActivity({ trades, loading, symbol, onSymbolChange, onRefresh }: WhaleActivityProps) {
  return (
    <div className="rounded-xl border border-border bg-card shadow-card flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          🐋 Whale Activity
        </span>
        <div className="flex items-center gap-2">
          <select
            value={symbol}
            onChange={e => onSymbolChange(e.target.value)}
            className="bg-muted/50 border border-border rounded-md px-2 py-1 text-xs font-mono text-foreground outline-none cursor-pointer"
          >
            {TRACKED_SYMBOLS.slice(0, 5).map(s => <option key={s} value={s}>{s.replace("USDT","")}/USDT</option>)}
          </select>
          <button
            type="button"
            onClick={onRefresh}
            className="flex items-center gap-1 border border-border bg-muted/30 rounded-md px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
          >
            <RefreshCw className="size-3" />
          </button>
        </div>
      </div>

      <div className="p-3 flex-1">
        <p className="text-[10px] text-muted-foreground font-mono mb-2">Showing trades &gt; $100,000 USD</p>

        {loading ? (
          <div className="flex items-center gap-2 justify-center py-8 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Fetching large trades…
          </div>
        ) : trades.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-sm text-muted-foreground gap-1">
            <span className="text-2xl">🐟</span>
            No whale trades detected
          </div>
        ) : (
          <div className="flex flex-col gap-1.5 max-h-72 overflow-y-auto pr-0.5 scrollbar-thin">
            {trades.map((t, i) => {
              const meta = COIN_META[t.symbol] ?? { base: t.symbol.replace("USDT","") };
              const isBuy = t.side === "BUY";
              return (
                <div
                  key={i}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-xs transition-all",
                    isBuy
                      ? "border-l-2 border-l-emerald-500 border-border"
                      : "border-l-2 border-l-red-500 border-border",
                  )}
                >
                  <span className={cn("font-extrabold font-mono text-[10px] px-1.5 py-0.5 rounded min-w-[34px] text-center",
                    isBuy ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                  )}>
                    {t.side}
                  </span>
                  <span className="font-bold font-mono text-foreground min-w-[50px]">
                    {meta.base}/USDT
                  </span>
                  <span className="font-bold font-mono text-[#ffd740] flex-1">
                    ${fmtVolume(t.amount)}
                  </span>
                  <span className="text-muted-foreground font-mono text-[10px]">
                    {fmtPrice(t.price)}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono min-w-[50px] text-right">
                    {timeAgo(t.time)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
