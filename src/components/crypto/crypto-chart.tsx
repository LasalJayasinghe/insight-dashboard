import { useEffect, useRef } from "react";
import { createChart, ColorType, CrosshairMode, type IChartApi, type ISeriesApi } from "lightweight-charts";
import type { CandleBar } from "@/services/crypto-service";

const COLORS = {
  up: "#00e676",
  down: "#ff1744",
  ema9: "#ffd740",
  ema21: "#40c4ff",
  rsi: "#ea80fc",
  volume: "rgba(68,138,255,0.28)",
  background: "#0d1117",
  grid: "rgba(255,255,255,0.04)",
  text: "#94a3b8",
  border: "rgba(255,255,255,0.07)",
};

function calcEMA(closes: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const out: number[] = [];
  let ema: number | null = null;
  for (const c of closes) {
    ema = ema === null ? c : c * k + ema * (1 - k);
    out.push(ema);
  }
  return out;
}

function calcRSI(closes: number[], period = 14): (number | null)[] {
  const out: (number | null)[] = new Array(period).fill(null);
  for (let i = period; i < closes.length; i++) {
    let gain = 0, loss = 0;
    for (let j = i - period + 1; j <= i; j++) {
      const diff = closes[j] - closes[j - 1];
      if (diff > 0) gain += diff; else loss += Math.abs(diff);
    }
    out.push(loss === 0 ? 100 : 100 - 100 / (1 + gain / loss));
  }
  return out;
}

interface CryptoChartProps {
  candles: CandleBar[];
  newCandle?: (CandleBar & { symbol: string }) | null;
}

export function CryptoChart({ candles, newCandle }: CryptoChartProps) {
  const mainRef = useRef<HTMLDivElement>(null);
  const rsiRef  = useRef<HTMLDivElement>(null);

  const chartRef    = useRef<IChartApi | null>(null);
  const rsiChartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const ema9SeriesRef   = useRef<ISeriesApi<"Line"> | null>(null);
  const ema21SeriesRef  = useRef<ISeriesApi<"Line"> | null>(null);
  const rsiSeriesRef    = useRef<ISeriesApi<"Line"> | null>(null);
  const volSeriesRef    = useRef<ISeriesApi<"Histogram"> | null>(null);

  // ── Initialise charts once ─────────────────────────────────────────────────
  useEffect(() => {
    if (!mainRef.current || !rsiRef.current) return;

    const common = {
      layout: { background: { type: ColorType.Solid, color: COLORS.background }, textColor: COLORS.text },
      grid: { vertLines: { color: COLORS.grid }, horzLines: { color: COLORS.grid } },
      rightPriceScale: { borderColor: COLORS.border },
      timeScale: { borderColor: COLORS.border, timeVisible: true, secondsVisible: false },
      crosshair: { mode: CrosshairMode.Normal },
    };

    const main = createChart(mainRef.current, { ...common, width: mainRef.current.clientWidth, height: mainRef.current.clientHeight });
    const rsiChart = createChart(rsiRef.current, { ...common, width: rsiRef.current.clientWidth, height: rsiRef.current.clientHeight, timeScale: { ...common.timeScale, visible: false } });

    chartRef.current    = main;
    rsiChartRef.current = rsiChart;

    candleSeriesRef.current = main.addCandlestickSeries({
      upColor: COLORS.up, downColor: COLORS.down,
      borderUpColor: COLORS.up, borderDownColor: COLORS.down,
      wickUpColor: COLORS.up, wickDownColor: COLORS.down,
    });

    ema9SeriesRef.current  = main.addLineSeries({ color: COLORS.ema9,  lineWidth: 1, priceLineVisible: false, title: "EMA 9" });
    ema21SeriesRef.current = main.addLineSeries({ color: COLORS.ema21, lineWidth: 1, priceLineVisible: false, title: "EMA 21" });

    volSeriesRef.current = main.addHistogramSeries({
      color: COLORS.volume,
      priceScaleId: "volume",
    });
    main.priceScale("volume").applyOptions({ scaleMargins: { top: 0.85, bottom: 0 } });

    rsiSeriesRef.current = rsiChart.addLineSeries({ color: COLORS.rsi, lineWidth: 1, priceLineVisible: false, title: "RSI 14" });

    // Responsive resize
    const ro = new ResizeObserver(() => {
      main.applyOptions({ width: mainRef.current?.clientWidth ?? 600 });
      rsiChart.applyOptions({ width: rsiRef.current?.clientWidth ?? 600 });
    });
    if (mainRef.current) ro.observe(mainRef.current);
    if (rsiRef.current)  ro.observe(rsiRef.current);

    return () => {
      ro.disconnect();
      main.remove();
      rsiChart.remove();
      chartRef.current       = null;
      rsiChartRef.current    = null;
      candleSeriesRef.current = null;
      ema9SeriesRef.current   = null;
      ema21SeriesRef.current  = null;
      rsiSeriesRef.current    = null;
      volSeriesRef.current    = null;
    };
  }, []);

  // ── Populate data whenever candles array changes ───────────────────────────
  useEffect(() => {
    if (!candles.length || !candleSeriesRef.current) return;

    const closes = candles.map(c => c.close);
    const ema9   = calcEMA(closes, 9);
    const ema21v = calcEMA(closes, 21);
    const rsi    = calcRSI(closes, 14);

    candleSeriesRef.current.setData(candles.map(c => ({ time: c.time as any, open: c.open, high: c.high, low: c.low, close: c.close })));

    volSeriesRef.current?.setData(candles.map(c => ({
      time: c.time as any,
      value: c.volume,
      color: c.close >= c.open ? "rgba(0,230,118,0.22)" : "rgba(255,23,68,0.18)",
    })));

    ema9SeriesRef.current?.setData(candles.map((c, i) => ({ time: c.time as any, value: parseFloat(ema9[i].toFixed(4)) })));
    ema21SeriesRef.current?.setData(candles.map((c, i) => ({ time: c.time as any, value: parseFloat(ema21v[i].toFixed(4)) })));
    rsiSeriesRef.current?.setData(
      candles.map((c, i) => rsi[i] !== null ? { time: c.time as any, value: parseFloat((rsi[i] as number).toFixed(2)) } : null).filter(Boolean) as any
    );

    chartRef.current?.timeScale().fitContent();
  }, [candles]);

  // ── Live candle push from SignalR ──────────────────────────────────────────
  useEffect(() => {
    if (!newCandle || !candleSeriesRef.current) return;
    candleSeriesRef.current.update({ time: newCandle.time as any, open: newCandle.open, high: newCandle.high, low: newCandle.low, close: newCandle.close });
  }, [newCandle]);

  return (
    <div className="flex flex-col gap-1">
      <div ref={mainRef} className="w-full" style={{ height: 380 }} />
      <div className="flex items-center gap-1.5 px-1">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">RSI 14</span>
      </div>
      <div ref={rsiRef} className="w-full" style={{ height: 110 }} />
    </div>
  );
}
