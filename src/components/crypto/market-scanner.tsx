import { cn } from "@/lib/utils";
import type { ScannerResult } from "@/services/crypto-service";
import { COIN_META, fmtPrice } from "./market-cards";
import { RefreshCw, Loader2 } from "lucide-react";

const SIG = {
  BUY:  { pill: "bg-emerald-500/10 text-emerald-400", bar: "bg-emerald-400" },
  SELL: { pill: "bg-red-500/10 text-red-400",         bar: "bg-red-400"     },
  WAIT: { pill: "bg-muted text-muted-foreground",     bar: "bg-muted"       },
};

const COND = {
  Bullish: "bg-emerald-500/8 text-emerald-400",
  Bearish: "bg-red-500/8 text-red-400",
  Neutral: "bg-muted text-muted-foreground",
};

interface MarketScannerProps {
  results: ScannerResult[];
  loading: boolean;
  onRefresh: () => void;
}

export function MarketScanner({ results, loading, onRefresh }: MarketScannerProps) {
  return (
    <div className="rounded-xl border border-border bg-card shadow-card flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          📡 Market Scanner
        </span>
        <button
          type="button"
          onClick={onRefresh}
          className="flex items-center gap-1 border border-border bg-muted/30 rounded-md px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
        >
          <RefreshCw className="size-3" />
        </button>
      </div>

      <div className="overflow-hidden">
        {loading ? (
          <div className="flex items-center gap-2 justify-center py-10 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Scanning markets…
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr>
                {["Symbol", "Signal", "Confidence", "Condition", "Price"].map(h => (
                  <th key={h} className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-b border-border">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {results.map(r => {
                const meta = COIN_META[r.symbol] ?? { base: r.symbol.replace("USDT",""), color: "#888" };
                const sig  = SIG[r.signal];
                const cond = COND[r.marketCondition];
                return (
                  <tr key={r.symbol} className="hover:bg-muted/40 transition-colors border-b border-border/50 last:border-none">
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="inline-flex items-center justify-center rounded-full text-white text-[8px] font-bold shrink-0"
                          style={{ background: meta.color, width: 16, height: 16 }}
                        >
                          {meta.base[0]}
                        </span>
                        <span className="text-xs font-semibold font-mono text-foreground">{meta.base}/USDT</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider", sig.pill)}>
                        {r.signal}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <div className="w-16 h-1 rounded-full bg-muted overflow-hidden">
                          <div className={cn("h-full rounded-full", sig.bar)} style={{ width: `${r.confidence}%` }} />
                        </div>
                        <span className="text-[10px] font-mono text-muted-foreground">{r.confidence}%</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={cn("text-[10px] font-semibold rounded-full px-2 py-0.5 uppercase", cond)}>
                        {r.marketCondition}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-[11px] font-mono text-muted-foreground">
                      {fmtPrice(r.price)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
