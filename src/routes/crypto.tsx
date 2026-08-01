import { createFileRoute, redirect } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { MarketCards, TRACKED_SYMBOLS } from "@/components/crypto/market-cards";
import { CryptoChart } from "@/components/crypto/crypto-chart";
import { StrategyPanel } from "@/components/crypto/strategy-panel";
import { AiSummaryPanel } from "@/components/crypto/ai-summary-panel";
import { MarketScanner } from "@/components/crypto/market-scanner";
import { WhaleActivity } from "@/components/crypto/whale-activity";
import { useCryptoHub } from "@/hooks/useCryptoHub";
import { isAuthenticated } from "@/lib/auth";
import {
  cryptoService,
  type TickerData,
  type CandleBar,
  type StrategySnapshot,
  type ScannerResult,
  type WhaleTrade,
  type AiSummary,
} from "@/services/crypto-service";
import { Bitcoin, Wifi, WifiOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Route config ──────────────────────────────────────────────────────────────

export const Route = createFileRoute("/crypto")({
  beforeLoad: () => {
    if (!isAuthenticated()) throw redirect({ to: "/login" });
  },
  head: () => ({
    meta: [
      { title: "Crypto Terminal — AlertMe Trading" },
      { name: "description", content: "Professional crypto trading terminal with live charts, EMA/RSI strategy and whale activity." },
    ],
  }),
  component: CryptoPage,
});

// ── Constants ─────────────────────────────────────────────────────────────────

const INTERVALS = ["1m", "5m", "15m", "1h", "4h", "1d"] as const;
type Interval = (typeof INTERVALS)[number];

// ── Page component ────────────────────────────────────────────────────────────

function CryptoPage() {
  // ── Chart state ─────────────────────────────────────────────────────────────
  const [chartSymbol,   setChartSymbol]   = useState("BTCUSDT");
  const [chartInterval, setChartInterval] = useState<Interval>("1m");
  const [candles,       setCandles]       = useState<CandleBar[]>([]);
  const [candlesLoading, setCandlesLoading] = useState(true);

  // ── Market cards state ───────────────────────────────────────────────────────
  const [tickers, setTickers] = useState<Record<string, TickerData>>({});

  // ── Strategy state ───────────────────────────────────────────────────────────
  const [stratSymbol,   setStratSymbol]   = useState("BTCUSDT");
  const [strategy,      setStrategy]      = useState<StrategySnapshot | null>(null);
  const [stratLoading,  setStratLoading]  = useState(true);

  // ── AI Summary state ─────────────────────────────────────────────────────────
  const [aiSymbol,      setAiSymbol]      = useState("BTCUSDT");
  const [aiData,        setAiData]        = useState<AiSummary | null>(null);
  const [aiLoading,     setAiLoading]     = useState(true);

  // ── Scanner state ────────────────────────────────────────────────────────────
  const [scanner,       setScanner]       = useState<ScannerResult[]>([]);
  const [scannerLoading, setScannerLoading] = useState(true);

  // ── Whale state ──────────────────────────────────────────────────────────────
  const [whaleSymbol,   setWhaleSymbol]   = useState("BTCUSDT");
  const [whales,        setWhales]        = useState<WhaleTrade[]>([]);
  const [whaleLoading,  setWhaleLoading]  = useState(true);

  // ── Live candle pushed from SignalR ──────────────────────────────────────────
  const [liveCandle, setLiveCandle] = useState<(CandleBar & { symbol: string }) | null>(null);

  // ── Interval refs for cleanup ────────────────────────────────────────────────
  const intervalsRef = useRef<ReturnType<typeof setInterval>[]>([]);

  // ── Data loaders ─────────────────────────────────────────────────────────────

  const loadCandles = useCallback(async (sym: string, interval: Interval) => {
    setCandlesLoading(true);
    try {
      const data = await cryptoService.getCandles(sym, interval, 300);
      setCandles(data);
    } catch { /* silent */ }
    finally { setCandlesLoading(false); }
  }, []);

  const loadTickers = useCallback(async () => {
    try {
      const data = await cryptoService.getTickers();
      setTickers(Object.fromEntries(data.map(t => [t.symbol, t])));
    } catch { /* silent */ }
  }, []);

  const loadStrategy = useCallback(async (sym: string) => {
    setStratLoading(true);
    try {
      const data = await cryptoService.getStrategy(sym);
      setStrategy(data);
    } catch { setStrategy(null); }
    finally { setStratLoading(false); }
  }, []);

  const loadAiSummary = useCallback(async (sym: string) => {
    setAiLoading(true);
    try {
      const data = await cryptoService.getAiSummary(sym);
      setAiData(data);
    } catch { setAiData(null); }
    finally { setAiLoading(false); }
  }, []);

  const loadScanner = useCallback(async () => {
    setScannerLoading(true);
    try {
      const data = await cryptoService.getScanner();
      setScanner(data);
    } catch { setScanner([]); }
    finally { setScannerLoading(false); }
  }, []);

  const loadWhales = useCallback(async (sym: string) => {
    setWhaleLoading(true);
    try {
      const data = await cryptoService.getWhales(sym);
      setWhales(data);
    } catch { setWhales([]); }
    finally { setWhaleLoading(false); }
  }, []);

  // ── Initial load ─────────────────────────────────────────────────────────────

  useEffect(() => {
    void loadTickers();
    void loadCandles(chartSymbol, chartInterval);
    void loadStrategy(stratSymbol);
    void loadAiSummary(aiSymbol);
    void loadScanner();
    void loadWhales(whaleSymbol);

    // Periodic refresh intervals
    const timers = [
      setInterval(() => void loadStrategy(stratSymbol),   30_000),
      setInterval(() => void loadScanner(),               60_000),
      setInterval(() => void loadWhales(whaleSymbol),     15_000),
      setInterval(() => void loadAiSummary(aiSymbol),    120_000),
    ];
    intervalsRef.current = timers;
    return () => timers.forEach(clearInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Re-load candles on symbol / interval change ───────────────────────────────
  useEffect(() => { void loadCandles(chartSymbol, chartInterval); }, [chartSymbol, chartInterval, loadCandles]);
  useEffect(() => { void loadStrategy(stratSymbol); }, [stratSymbol, loadStrategy]);
  useEffect(() => { void loadAiSummary(aiSymbol); }, [aiSymbol, loadAiSummary]);
  useEffect(() => { void loadWhales(whaleSymbol); }, [whaleSymbol, loadWhales]);

  // ── SignalR ───────────────────────────────────────────────────────────────────

  const handleTickerUpdate = useCallback((incoming: TickerData[]) => {
    setTickers(prev => {
      const next = { ...prev };
      for (const t of incoming) next[t.symbol] = t;
      return next;
    });
  }, []);

  const handleCandleUpdate = useCallback((candle: CandleBar & { symbol: string }) => {
    setLiveCandle(candle);
  }, []);

  const { status: hubStatus } = useCryptoHub({
    onTickerUpdate: handleTickerUpdate,
    onCandleUpdate: handleCandleUpdate,
  });

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <AppShell>
      <div className="space-y-5">

        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className={cn(
              "size-2 rounded-full",
              hubStatus === "connected"    && "bg-emerald-400 animate-pulse shadow-[0_0_6px_#34d399]",
              hubStatus === "reconnecting" && "bg-yellow-400 animate-pulse",
              hubStatus === "disconnected" && "bg-red-400",
              hubStatus === "connecting"   && "bg-muted animate-pulse",
            )} />
            <Bitcoin className="size-6 text-[#f7931a]" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Crypto Trading Terminal</h1>
            <p className="text-xs text-muted-foreground">Live market data · EMA RSI strategy · Whale radar</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider border border-primary/30 bg-primary/5 text-primary rounded px-2 py-0.5">
              PRO
            </span>
            <span className={cn("flex items-center gap-1 text-[11px] font-bold font-mono uppercase tracking-wider",
              hubStatus === "connected"    ? "text-emerald-400" : "",
              hubStatus === "reconnecting" ? "text-yellow-400"  : "",
              hubStatus === "disconnected" ? "text-red-400"     : "text-muted-foreground",
            )}>
              {hubStatus === "connected"
                ? <><Wifi className="size-3" /> LIVE</>
                : hubStatus === "reconnecting"
                ? <><Loader2 className="size-3 animate-spin" /> RECONNECTING</>
                : <><WifiOff className="size-3" /> {hubStatus.toUpperCase()}</>
              }
            </span>
          </div>
        </div>

        {/* ── Market Cards ─────────────────────────────────────────────────── */}
        <MarketCards
          tickers={tickers}
          selectedSymbol={chartSymbol}
          onSelect={sym => setChartSymbol(sym)}
        />

        {/* ── Chart ──────────────────────────────────────────────────────────── */}
        <div className="rounded-xl border border-white/7 bg-[#0d1117] overflow-hidden">
          {/* Chart toolbar */}
          <div className="flex items-center flex-wrap gap-3 px-4 py-2.5 border-b border-white/7">
            <select
              value={chartSymbol}
              onChange={e => setChartSymbol(e.target.value)}
              className="bg-[#161b27] border border-white/10 rounded-md px-2 py-1 text-xs font-mono font-semibold text-foreground outline-none cursor-pointer"
            >
              {TRACKED_SYMBOLS.map(s => <option key={s} value={s}>{s.replace("USDT","")}/USDT</option>)}
            </select>

            <div className="flex gap-1">
              {INTERVALS.map(iv => (
                <button
                  key={iv}
                  type="button"
                  onClick={() => setChartInterval(iv)}
                  className={cn(
                    "px-2.5 py-1 rounded text-xs font-semibold font-mono transition-all",
                    chartInterval === iv
                      ? "bg-primary/15 text-primary border border-primary/40"
                      : "bg-[#161b27] border border-white/10 text-muted-foreground hover:text-foreground",
                  )}
                >
                  {iv}
                </button>
              ))}
            </div>

            <span className="text-sm font-bold font-mono text-foreground">
              {chartSymbol.replace("USDT","")}/USDT · {chartInterval.toUpperCase()}
            </span>

            {/* Legend */}
            <div className="ml-auto flex items-center gap-3 text-[10px] text-muted-foreground font-mono">
              {[["EMA 9","#ffd740"],["EMA 21","#40c4ff"],["RSI 14","#ea80fc"],["Vol","rgba(68,138,255,0.5)"]].map(([label, color]) => (
                <span key={label} className="flex items-center gap-1">
                  <span className="inline-block w-4 h-0.5 rounded" style={{ background: color }} />
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* Chart body */}
          <div className="relative p-3">
            {candlesLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-[#0d1117]/70 z-10 rounded-b-xl">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" /> Loading chart…
                </div>
              </div>
            )}
            <CryptoChart candles={candles} newCandle={liveCandle} />
          </div>
        </div>

        {/* ── Strategy + AI Summary ─────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <StrategyPanel
            snapshot={strategy}
            loading={stratLoading}
            symbol={stratSymbol}
            onSymbolChange={setStratSymbol}
          />
          <AiSummaryPanel
            data={aiData}
            loading={aiLoading}
            symbol={aiSymbol}
            onSymbolChange={setAiSymbol}
          />
        </div>

        {/* ── Scanner + Whale ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pb-4">
          <MarketScanner
            results={scanner}
            loading={scannerLoading}
            onRefresh={loadScanner}
          />
          <WhaleActivity
            trades={whales}
            loading={whaleLoading}
            symbol={whaleSymbol}
            onSymbolChange={setWhaleSymbol}
            onRefresh={() => loadWhales(whaleSymbol)}
          />
        </div>

      </div>
    </AppShell>
  );
}
