import { cn } from "@/lib/utils";
import type { StrategySnapshot } from "@/services/crypto-service";
import { TRACKED_SYMBOLS, fmtPrice } from "./market-cards";

const SIGNAL_STYLES = {
  BUY:  "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25",
  SELL: "bg-red-500/10 text-red-400 border border-red-500/25",
  WAIT: "bg-muted/50 text-muted-foreground border border-border",
};

const CONDITION_STYLES = {
  Bullish: "bg-emerald-500/8 text-emerald-400 border border-emerald-500/20",
  Bearish: "bg-red-500/8 text-red-400 border border-red-500/20",
  Neutral: "bg-muted/50 text-muted-foreground border border-border",
};

const BAR_COLORS = {
  BUY:  "from-emerald-500 to-cyan-400",
  SELL: "from-red-500 to-orange-400",
  WAIT: "bg-muted",
};

interface StrategyPanelProps {
  snapshot: StrategySnapshot | null;
  loading: boolean;
  symbol: string;
  onSymbolChange: (s: string) => void;
}

export function StrategyPanel({ snapshot, loading, symbol, onSymbolChange }: StrategyPanelProps) {
  return (
    <div className="rounded-xl border border-border bg-card shadow-card flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            🤖 Strategy Dashboard
          </span>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={symbol}
            onChange={e => onSymbolChange(e.target.value)}
            className="bg-muted/50 border border-border rounded-md px-2 py-1 text-xs font-mono text-foreground outline-none cursor-pointer"
          >
            {TRACKED_SYMBOLS.map(s => <option key={s} value={s}>{s.replace("USDT", "")}/USDT</option>)}
          </select>
          {snapshot && (
            <span className="text-[10px] text-muted-foreground font-mono">
              {new Date(snapshot.evaluatedAt).toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      <div className="p-4 flex flex-col gap-4">
        {/* Strategy label */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">EMA RSI Strategy</span>
          <span className="text-[10px] font-mono text-muted-foreground">EMA 9 / EMA 21 / RSI 14</span>
        </div>

        {/* Indicator boxes */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "EMA 9",  value: snapshot?.ema9?.toFixed(2)  ?? "--", color: "text-[#ffd740]" },
            { label: "EMA 21", value: snapshot?.ema21?.toFixed(2) ?? "--", color: "text-[#40c4ff]" },
            { label: "RSI 14", value: snapshot?.rsi?.toFixed(2)   ?? "--", color: "text-[#ea80fc]" },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex flex-col items-center bg-muted/40 border border-border rounded-lg py-2.5 px-2">
              <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">{label}</span>
              <span className={cn("text-base font-bold font-mono", color)}>
                {loading ? <span className="inline-block h-4 w-12 rounded animate-pulse bg-muted" /> : value}
              </span>
            </div>
          ))}
        </div>

        {/* Signal + condition */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn("text-sm font-extrabold font-mono px-3 py-1 rounded-md", SIGNAL_STYLES[snapshot?.signal ?? "WAIT"])}>
            {snapshot?.signal ?? "WAIT"}
          </span>
          <span className={cn("text-[11px] font-bold rounded-full px-2.5 py-0.5 uppercase tracking-wider", CONDITION_STYLES[snapshot?.marketCondition ?? "Neutral"])}>
            {snapshot?.marketCondition ?? "Neutral"}
          </span>
          <span className="ml-auto text-xs font-mono text-muted-foreground">
            {snapshot ? fmtPrice(snapshot.currentPrice) : ""}
          </span>
        </div>

        {/* Reason */}
        <p className="text-xs text-muted-foreground italic leading-relaxed">
          {loading ? <span className="inline-block h-4 w-full rounded animate-pulse bg-muted" /> : (snapshot?.reason ?? "Loading analysis…")}
        </p>

        {/* Confidence bar */}
        <div>
          <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold mb-1.5 block">Confidence</span>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className={cn("h-full rounded-full bg-gradient-to-r transition-all duration-700", BAR_COLORS[snapshot?.signal ?? "WAIT"])}
                style={{ width: `${snapshot?.confidence ?? 0}%` }}
              />
            </div>
            <span className="text-sm font-bold font-mono text-foreground min-w-[36px] text-right">
              {snapshot?.confidence ?? 0}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
