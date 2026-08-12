import { useMemo } from "react";
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

interface Props {
  pair: string;
  bias: "BUY" | "SELL" | "HOLD";
}

/**
 * Lightweight chart placeholder. Swap with a candlestick library
 * (e.g. lightweight-charts) when wiring real Binance kline data.
 */
export function ChartPanel({ pair, bias }: Props) {
  const data = useMemo(() => {
    const base = 100;
    let v = base;
    return Array.from({ length: 36 }).map((_, i) => {
      v += (Math.sin(i / 3) + (Math.random() - 0.5)) * 1.4;
      return { t: i, price: Number(v.toFixed(2)) };
    });
  }, []);

  const stroke =
    bias === "BUY"
      ? "var(--color-success)"
      : bias === "SELL"
        ? "var(--color-destructive)"
        : "var(--color-warning)";

  return (
    <Card className="gradient-card border-border shadow-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold tracking-tight">Price Action — {pair}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Candlestick chart placeholder</p>
        </div>
        <div className="text-xs text-muted-foreground">1H · last 36 bars</div>
      </div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={stroke} stopOpacity={0.35} />
                <stop offset="100%" stopColor={stroke} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="t" tickLine={false} axisLine={false} fontSize={11} />
            <YAxis tickLine={false} axisLine={false} fontSize={11} width={40} />
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
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
