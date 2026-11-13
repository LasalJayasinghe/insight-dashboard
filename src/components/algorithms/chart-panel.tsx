import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { cryptoService } from "@/services/crypto-service";

interface Props {
  /** Display pair, e.g. "BTC/USDT" or "ETH/BTC". Anything else (e.g. "7 coins") falls back to BTC/USDT. */
  pair: string;
  bias: "BUY" | "SELL" | "HOLD";
  /** Binance kline interval matching the strategy, e.g. "1m", "5m", "15m", "1h". */
  interval?: string;
}

const BARS = 96;
const INTERVALS = new Set(["1m", "3m", "5m", "15m", "30m", "1h", "2h", "4h", "1d"]);

const PAIR = /^([A-Z0-9]+)\/([A-Z0-9]+)$/;

/** "BTC/USDT" → "BTCUSDT"; "ETH/BTC" → "ETHBTC"; unknown → "BTCUSDT". */
function toBinanceSymbol(pair: string): string {
  const m = PAIR.exec(pair.trim().toUpperCase());
  return m ? `${m[1]}${m[2]}` : "BTCUSDT";
}

function formatTime(seconds: number, interval: string): string {
  const d = new Date(seconds * 1000);
  return interval === "1d"
    ? d.toLocaleDateString(undefined, { month: "short", day: "numeric" })
    : d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

/** Real Binance price action for the algorithm's pair and timeframe (via /api/crypto/candles). */
export function ChartPanel({ pair, bias, interval = "1h" }: Props) {
  const symbol = toBinanceSymbol(pair);
  const tf = INTERVALS.has(interval) ? interval : "1h";
  const [data, setData] = useState<{ t: string; price: number }[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setFailed(false);
    cryptoService
      .getCandles(symbol, tf, BARS)
      .then((candles) => {
        if (cancelled) return;
        setData(candles.map((c) => ({ t: formatTime(c.time, tf), price: c.close })));
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [symbol, tf]);

  const stroke =
    bias === "BUY"
      ? "var(--color-success)"
      : bias === "SELL"
        ? "var(--color-destructive)"
        : "var(--color-warning)";

  const displayPair = PAIR.test(pair.trim().toUpperCase()) ? pair : "BTC/USDT";

  return (
    <Card className="gradient-card border-border shadow-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold tracking-tight">Price Action — {displayPair}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Binance close prices</p>
        </div>
        <div className="text-xs text-muted-foreground">
          {tf} · last {BARS} bars
        </div>
      </div>
      <div className="h-56">
        {data === null || data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            {failed
              ? "Couldn't load Binance prices."
              : data === null
                ? "Loading prices…"
                : "No price data."}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={stroke} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={stroke} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="t" tickLine={false} axisLine={false} fontSize={11} minTickGap={24} />
              <YAxis
                tickLine={false}
                axisLine={false}
                fontSize={11}
                width={64}
                domain={["auto", "auto"]}
                tickFormatter={(v: number) =>
                  v.toLocaleString(undefined, { maximumFractionDigits: 6 })
                }
              />
              <Tooltip
                contentStyle={{
                  background: "var(--color-popover)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Area
                type="monotone"
                dataKey="price"
                stroke={stroke}
                strokeWidth={2}
                fill="url(#chartFill)"
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}
