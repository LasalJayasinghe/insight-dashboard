import type { AiSummary } from "@/services/crypto-service";
import { TRACKED_SYMBOLS } from "./market-cards";
import { Loader2, Cpu } from "lucide-react";

interface AiSummaryPanelProps {
  data: AiSummary | null;
  loading: boolean;
  symbol: string;
  onSymbolChange: (s: string) => void;
}

export function AiSummaryPanel({ data, loading, symbol, onSymbolChange }: AiSummaryPanelProps) {
  return (
    <div className="rounded-xl border border-border bg-card shadow-card flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            🧠 AI Market Summary
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-purple-300 bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.5 rounded">
            <Cpu className="size-2.5" /> AI
          </span>
        </div>
        <select
          value={symbol}
          onChange={e => onSymbolChange(e.target.value)}
          className="bg-muted/50 border border-border rounded-md px-2 py-1 text-xs font-mono text-foreground outline-none cursor-pointer"
        >
          {TRACKED_SYMBOLS.map(s => <option key={s} value={s}>{s.replace("USDT", "")}/USDT</option>)}
        </select>
      </div>

      <div className="p-4 flex-1">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
            <Loader2 className="size-4 animate-spin" />
            Analysing market…
          </div>
        ) : data ? (
          <div>
            <p className="text-sm text-muted-foreground leading-[1.75] whitespace-pre-line">
              {data.summary}
            </p>
            <div className="flex items-center gap-3 mt-4 pt-3 border-t border-border">
              {[
                { label: "EMA 9",  value: data.indicators.ema9.toFixed(2),  color: "text-[#ffd740]" },
                { label: "EMA 21", value: data.indicators.ema21.toFixed(2), color: "text-[#40c4ff]" },
                { label: "RSI",    value: data.indicators.rsi.toFixed(2),   color: "text-[#ea80fc]" },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex flex-col">
                  <span className="text-[9px] uppercase tracking-widest text-muted-foreground">{label}</span>
                  <span className={`text-xs font-bold font-mono ${color}`}>{value}</span>
                </div>
              ))}
              <span className="ml-auto text-[10px] text-muted-foreground font-mono">
                {new Date(data.generatedAt).toLocaleTimeString()}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
            No analysis available
          </div>
        )}
      </div>
    </div>
  );
}
