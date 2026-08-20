import { useEffect, useRef, useState } from "react";
import {
  createChart,
  ColorType,
  CrosshairMode,
  type IChartApi,
  type ISeriesApi,
} from "lightweight-charts";
import type { StockTicker } from "@/services/stock-service";
import { cn } from "@/lib/utils";

interface CandleData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

const TIMEFRAMES = ["1D", "1W", "1M", "1Y", "ALL"] as const;

function generateStockHistory(stock: StockTicker, timeframe: string): CandleData[] {
  const points = timeframe === "1D" ? 30 : timeframe === "1W" ? 60 : timeframe === "1M" ? 90 : 180;
  const result: CandleData[] = [];

  let currentPrice = stock.previousClose > 0 ? stock.previousClose : stock.price * 0.95;
  const now = new Date();

  for (let i = points; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = d.toISOString().split("T")[0];

    const volatility = stock.price * 0.015;
    const change = (Math.random() - 0.48) * volatility;

    const open = Math.max(0.1, currentPrice);
    const close = Math.max(0.1, i === 0 ? stock.price : open + change);
    const high = Math.max(open, close) + Math.random() * (volatility * 0.5);
    const low = Math.max(0.1, Math.min(open, close) - Math.random() * (volatility * 0.5));
    const volume = Math.floor(Math.random() * 50000) + 5000;

    result.push({
      time: dateStr,
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume,
    });

    currentPrice = close;
  }

  return result;
}

function calcEMA(closes: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const out: number[] = [];
  let ema: number | null = null;
  for (const c of closes) {
    ema = ema === null ? c : c * k + ema * (1 - k);
    out.push(Number(ema.toFixed(2)));
  }
  return out;
}

function calcRSI(closes: number[], period = 14): (number | null)[] {
  const out: (number | null)[] = new Array(period).fill(null);
  for (let i = period; i < closes.length; i++) {
    let gain = 0,
      loss = 0;
    for (let j = i - period + 1; j <= i; j++) {
      const diff = closes[j] - closes[j - 1];
      if (diff > 0) gain += diff;
      else loss += Math.abs(diff);
    }
    out.push(loss === 0 ? 100 : Number((100 - 100 / (1 + gain / loss)).toFixed(2)));
  }
  return out;
}

function getThemeColors() {
  const isLight =
    typeof document !== "undefined" && document.documentElement.classList.contains("light");
  return {
    background: "transparent",
    grid: isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.04)",
    text: isLight ? "#475569" : "#94a3b8",
    border: isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.07)",
  };
}

export function StockChart({ stock }: { stock: StockTicker }) {
  const [timeframe, setTimeframe] = useState<string>("1M");

  const mainRef = useRef<HTMLDivElement>(null);
  const rsiRef = useRef<HTMLDivElement>(null);

  const chartRef = useRef<IChartApi | null>(null);
  const rsiChartRef = useRef<IChartApi | null>(null);

  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const ema9SeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const ema21SeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const rsiSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const volSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);

  useEffect(() => {
    if (!mainRef.current || !rsiRef.current) return;

    const themeColors = getThemeColors();

    const common = {
      layout: {
        background: { type: ColorType.Solid, color: themeColors.background },
        textColor: themeColors.text,
      },
      grid: { vertLines: { color: themeColors.grid }, horzLines: { color: themeColors.grid } },
      rightPriceScale: { borderColor: themeColors.border },
      timeScale: { borderColor: themeColors.border, timeVisible: true, secondsVisible: false },
      crosshair: { mode: CrosshairMode.Normal },
    };

    const main = createChart(mainRef.current, {
      ...common,
      width: mainRef.current.clientWidth,
      height: mainRef.current.clientHeight,
    });

    const rsiChart = createChart(rsiRef.current, {
      ...common,
      width: rsiRef.current.clientWidth,
      height: rsiRef.current.clientHeight,
      timeScale: { ...common.timeScale, visible: false },
    });

    chartRef.current = main;
    rsiChartRef.current = rsiChart;

    candleSeriesRef.current = main.addCandlestickSeries({
      upColor: "#00e676",
      downColor: "#ff1744",
      borderUpColor: "#00e676",
      borderDownColor: "#ff1744",
      wickUpColor: "#00e676",
      wickDownColor: "#ff1744",
    });

    ema9SeriesRef.current = main.addLineSeries({
      color: "#ffd740",
      lineWidth: 1,
      priceLineVisible: false,
      title: "EMA 9",
    });
    ema21SeriesRef.current = main.addLineSeries({
      color: "#40c4ff",
      lineWidth: 1,
      priceLineVisible: false,
      title: "EMA 21",
    });

    volSeriesRef.current = main.addHistogramSeries({
      color: "rgba(68,138,255,0.28)",
      priceScaleId: "volume",
    });
    main.priceScale("volume").applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });

    rsiSeriesRef.current = rsiChart.addLineSeries({
      color: "#ea80fc",
      lineWidth: 1,
      priceLineVisible: false,
      title: "RSI 14",
    });

    // Dynamic theme observer
    const updateThemeOptions = () => {
      const tc = getThemeColors();
      const options = {
        layout: { background: { type: ColorType.Solid, color: tc.background }, textColor: tc.text },
        grid: { vertLines: { color: tc.grid }, horzLines: { color: tc.grid } },
        rightPriceScale: { borderColor: tc.border },
        timeScale: { borderColor: tc.border },
      };
      main.applyOptions(options);
      rsiChart.applyOptions(options);
    };

    const observer = new MutationObserver(updateThemeOptions);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    // Resize observer
    const ro = new ResizeObserver(() => {
      main.applyOptions({ width: mainRef.current?.clientWidth ?? 600 });
      rsiChart.applyOptions({ width: rsiRef.current?.clientWidth ?? 600 });
    });
    if (mainRef.current) ro.observe(mainRef.current);
    if (rsiRef.current) ro.observe(rsiRef.current);

    return () => {
      observer.disconnect();
      ro.disconnect();
      main.remove();
      rsiChart.remove();
      chartRef.current = null;
      rsiChartRef.current = null;
      candleSeriesRef.current = null;
      ema9SeriesRef.current = null;
      ema21SeriesRef.current = null;
      rsiSeriesRef.current = null;
      volSeriesRef.current = null;
    };
  }, []);

  // Update chart data when stock or timeframe changes
  useEffect(() => {
    if (!candleSeriesRef.current) return;

    const data = generateStockHistory(stock, timeframe);
    const closes = data.map((d) => d.close);
    const ema9 = calcEMA(closes, 9);
    const ema21 = calcEMA(closes, 21);
    const rsi = calcRSI(closes, 14);

    candleSeriesRef.current.setData(
      data.map((d) => ({
        time: d.time as any,
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
      })),
    );
    volSeriesRef.current?.setData(
      data.map((d) => ({
        time: d.time as any,
        value: d.volume,
        color: d.close >= d.open ? "rgba(0,230,118,0.3)" : "rgba(255,23,68,0.3)",
      })),
    );

    ema9SeriesRef.current?.setData(data.map((d, i) => ({ time: d.time as any, value: ema9[i] })));
    ema21SeriesRef.current?.setData(data.map((d, i) => ({ time: d.time as any, value: ema21[i] })));

    const rsiData: { time: any; value: number }[] = [];
    data.forEach((d, i) => {
      if (rsi[i] !== null) rsiData.push({ time: d.time as any, value: rsi[i]! });
    });
    rsiSeriesRef.current?.setData(rsiData);

    chartRef.current?.timeScale().fitContent();
  }, [stock.symbol, timeframe]);

  return (
    <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden flex flex-col">
      {/* Chart Bar Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold font-mono text-foreground uppercase tracking-wider">
            Interactive Chart · {stock.symbol}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-primary/10 text-primary uppercase">
            CSE LIVE
          </span>
        </div>

        {/* Timeframe Selector */}
        <div className="flex items-center gap-1">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf}
              type="button"
              onClick={() => setTimeframe(tf)}
              className={cn(
                "px-2.5 py-1 rounded text-xs font-semibold font-mono transition-all",
                timeframe === tf
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted/40 border border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {tf}
            </button>
          ))}
        </div>

        {/* Indicator Legend */}
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-mono">
          {[
            ["EMA 9", "#ffd740"],
            ["EMA 21", "#40c4ff"],
            ["RSI 14", "#ea80fc"],
            ["Volume", "rgba(68,138,255,0.6)"],
          ].map(([label, color]) => (
            <span key={label} className="flex items-center gap-1">
              <span className="inline-block w-3 h-0.5 rounded" style={{ background: color }} />
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Main Chart Canvas */}
      <div className="p-3 flex flex-col gap-2">
        <div ref={mainRef} className="w-full h-[360px]" />
        <div className="border-t border-border pt-1">
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1 mb-1">
            RSI (14) Oscillator
          </div>
          <div ref={rsiRef} className="w-full h-[100px]" />
        </div>
      </div>
    </div>
  );
}
