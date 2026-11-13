import { useEffect, useMemo, useRef, useState } from "react";
import {
  createChart,
  ColorType,
  CrosshairMode,
  type IChartApi,
  type ISeriesApi,
  type Time,
  type UTCTimestamp,
} from "lightweight-charts";
import type { StockTicker } from "@/services/stock-service";
import { useStockHistory } from "@/hooks/use-stock-history";
import {
  COLOMBO_OFFSET_SECONDS,
  colomboDate,
  emaSeries,
  rsiSeries,
  type PricePoint,
} from "@/lib/technicals";
import { cn } from "@/lib/utils";

// CSE serves about one year of daily history, so there is no "ALL".
const TIMEFRAMES = ["1D", "1W", "1M", "3M", "1Y"] as const;
type Timeframe = (typeof TIMEFRAMES)[number];

const DAYS: Record<Exclude<Timeframe, "1D">, number> = { "1W": 7, "1M": 31, "3M": 92, "1Y": 366 };

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

interface Prepared {
  time: Time;
  point: PricePoint;
  ema9: number | null;
  ema21: number | null;
  rsi: number | null;
}

/**
 * Indicators are computed over the full history and only then sliced to the selected range,
 * so EMA/RSI values at the left edge of a short range are still correct.
 */
function prepare(points: PricePoint[], timeframe: Timeframe): Prepared[] {
  const closes = points.map((p) => p.close);
  const ema9 = emaSeries(closes, 9);
  const ema21 = emaSeries(closes, 21);
  const rsi = rsiSeries(closes, 14);

  const all = points.map((p, i) => ({
    // Daily bars use the Colombo trading date; intraday uses Colombo-shifted timestamps.
    time: (timeframe === "1D"
      ? ((p.time + COLOMBO_OFFSET_SECONDS) as UTCTimestamp)
      : colomboDate(p.time)) as Time,
    point: p,
    ema9: ema9[i],
    ema21: ema21[i],
    rsi: rsi[i],
  }));

  if (timeframe === "1D") return all;
  const cutoff = Date.now() / 1000 - DAYS[timeframe] * 86400;
  return all.filter((d) => d.point.time >= cutoff);
}

export function StockChart({ stock }: { stock: StockTicker }) {
  const [timeframe, setTimeframe] = useState<Timeframe>("3M");
  const { data, loading, error } = useStockHistory(stock.symbol, timeframe === "1D" ? "1D" : "1Y");

  const mainRef = useRef<HTMLDivElement>(null);
  const rsiRef = useRef<HTMLDivElement>(null);

  const chartRef = useRef<IChartApi | null>(null);
  const rsiChartRef = useRef<IChartApi | null>(null);

  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const ema9SeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const ema21SeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const rsiSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const volSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);

  const prepared = useMemo(() => (data ? prepare(data, timeframe) : []), [data, timeframe]);

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

  // Push real history into the chart whenever it (or the range) changes.
  useEffect(() => {
    if (!candleSeriesRef.current) return;

    candleSeriesRef.current.setData(
      prepared.map((d) => ({
        time: d.time,
        open: d.point.open,
        high: d.point.high,
        low: d.point.low,
        close: d.point.close,
      })),
    );
    volSeriesRef.current?.setData(
      prepared.map((d) => ({
        time: d.time,
        value: d.point.volume,
        color: d.point.close >= d.point.open ? "rgba(0,230,118,0.3)" : "rgba(255,23,68,0.3)",
      })),
    );

    const line = (key: "ema9" | "ema21" | "rsi") =>
      prepared.flatMap((d) => (d[key] === null ? [] : [{ time: d.time, value: d[key]! }]));

    ema9SeriesRef.current?.setData(line("ema9"));
    ema21SeriesRef.current?.setData(line("ema21"));
    rsiSeriesRef.current?.setData(line("rsi"));

    chartRef.current?.timeScale().fitContent();
    rsiChartRef.current?.timeScale().fitContent();
  }, [prepared]);

  const empty = !loading && prepared.length === 0;

  return (
    <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden flex flex-col">
      {/* Chart Bar Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold font-mono text-foreground uppercase tracking-wider">
            Price Chart · {stock.symbol}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-primary/10 text-primary uppercase">
            {timeframe === "1D" ? "Today's trades" : "Daily · CSE"}
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
      <div className="p-3 flex flex-col gap-2 relative">
        {(loading || empty) && (
          <div className="absolute inset-0 z-10 flex items-center justify-center text-xs text-muted-foreground bg-card/60">
            {loading
              ? "Loading price history…"
              : error
                ? "Couldn't load price history from CSE."
                : timeframe === "1D"
                  ? "No trades yet today."
                  : "No price history available."}
          </div>
        )}
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
