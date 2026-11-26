import { cn } from "@/lib/utils";
import { fmt, fmtCompact, signed, toneOf } from "@/components/portfolio/format";
import type {
  DeskCryptoMarket,
  DeskCseMarket,
  DeskIndex,
  DeskIndexPoint,
} from "@/services/desk-service";

const label = "text-[10px] font-mono font-semibold uppercase tracking-widest text-muted-foreground";

/** Intraday ASPI line from the desk's own index readings; the dashed line is today's open. */
function IntradayLine({ points }: { points: DeskIndexPoint[] }) {
  if (points.length < 2) {
    return (
      <div className="flex h-16 items-center text-[11px] text-muted-foreground">
        Intraday line builds up as the session runs.
      </div>
    );
  }
  const values = points.map((p) => p.aspi);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const w = 240;
  const h = 64;
  const xy = values.map((v, i) => [
    (i / (values.length - 1)) * w,
    h - 4 - ((v - min) / span) * (h - 8),
  ]);
  const d = xy.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const up = values[values.length - 1] >= values[0];
  const openY = xy[0][1];
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className="h-16 w-full"
      role="img"
      aria-label={`ASPI today from ${fmt(values[0])} to ${fmt(values[values.length - 1])}`}
    >
      <line
        x1="0"
        x2={w}
        y1={openY}
        y2={openY}
        className="stroke-muted-foreground/40"
        strokeDasharray="3 3"
      />
      <path
        d={d}
        fill="none"
        strokeWidth="1.75"
        vectorEffect="non-scaling-stroke"
        className={up ? "stroke-success" : "stroke-destructive"}
      />
    </svg>
  );
}

function IndexCell({ name, idx }: { name: string; idx: DeskIndex }) {
  return (
    <div>
      <div className={label}>{name}</div>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="font-display text-xl font-bold tabular">{fmt(idx.value)}</span>
        <span className={cn("font-mono text-xs font-semibold tabular", toneOf(idx.change))}>
          {signed(idx.change)} ({signed(idx.changePercent)}%)
        </span>
      </div>
      <div className="font-mono text-[10px] text-muted-foreground tabular">
        H {fmt(idx.high)} · L {fmt(idx.low)}
      </div>
    </div>
  );
}

function Stat({
  name,
  value,
  sub,
  tone,
}: {
  name: string;
  value: string;
  sub?: string;
  tone?: string;
}) {
  return (
    <div>
      <div className={label}>{name}</div>
      <div className={cn("mt-1 font-mono text-sm font-semibold tabular", tone)}>{value}</div>
      {sub && <div className="text-[10px] text-muted-foreground">{sub}</div>}
    </div>
  );
}

/** "All ASPI data": indices with the intraday line, breadth, activity, foreign flows, market valuation. */
export function CseMarketPanel({ data }: { data: DeskCseMarket }) {
  const breadthTotal = data.advancers + data.decliners + data.unchanged || 1;
  const foreignNet =
    data.foreignPurchase != null && data.foreignSales != null
      ? data.foreignPurchase - data.foreignSales
      : null;
  const vsAvg =
    data.turnoverAvg20d && data.turnoverAvg20d > 0
      ? (data.turnover / data.turnoverAvg20d) * 100
      : null;

  return (
    <section
      aria-label="ASPI and market"
      className="grid gap-x-6 gap-y-4 rounded-xl border border-border/60 bg-card p-4 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.2fr)_minmax(0,1.7fr)]"
    >
      <div className="space-y-3">
        <IndexCell name="ASPI" idx={data.aspi} />
        <IndexCell name="S&P SL20" idx={data.spSl20} />
      </div>

      <div className="min-w-0">
        <div className={label}>ASPI today</div>
        <IntradayLine points={data.aspiIntraday} />
        <div className="mt-2">
          <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
            <span className="text-success">{data.advancers} up</span>
            <span>{data.unchanged} flat</span>
            <span className="text-destructive">{data.decliners} down</span>
          </div>
          <div className="mt-1 flex h-1.5 overflow-hidden rounded-full" aria-hidden>
            <div
              className="bg-success"
              style={{ width: `${(data.advancers / breadthTotal) * 100}%` }}
            />
            <div
              className="bg-muted"
              style={{ width: `${(data.unchanged / breadthTotal) * 100}%` }}
            />
            <div
              className="bg-destructive"
              style={{ width: `${(data.decliners / breadthTotal) * 100}%` }}
            />
          </div>
          <div className="mt-1 text-[10px] text-muted-foreground">
            Breadth across {data.traded} traded securities
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
        <Stat
          name="Turnover"
          value={`Rs ${fmtCompact(data.turnover)}`}
          sub={vsAvg != null ? `${fmt(vsAvg, 0)}% of 20-day avg` : undefined}
          tone={vsAvg != null && vsAvg >= 120 ? "text-success" : undefined}
        />
        <Stat name="Trades" value={fmt(data.trades, 0)} />
        <Stat name="Market cap" value={`Rs ${fmtCompact(data.marketCap)}`} />
        <Stat
          name="Foreign net"
          value={foreignNet != null ? `Rs ${fmtCompact(foreignNet)}` : "—"}
          sub={
            data.foreignPurchase != null && data.foreignSales != null
              ? `buy ${fmtCompact(data.foreignPurchase)} · sell ${fmtCompact(data.foreignSales)}`
              : undefined
          }
          tone={foreignNet != null ? toneOf(foreignNet) : undefined}
        />
        <Stat
          name="Market P/E · P/BV"
          value={
            data.marketPer != null
              ? `${fmt(data.marketPer)} · ${data.marketPbv != null ? fmt(data.marketPbv) : "—"}`
              : "—"
          }
        />
        <Stat
          name="Dividend yield"
          value={data.marketDividendYield != null ? `${fmt(data.marketDividendYield)}%` : "—"}
          sub={data.dailyDate ? `daily figures · ${data.dailyDate}` : undefined}
        />
      </div>
    </section>
  );
}

/** Compact strip for the crypto desk. */
export function CryptoMarketPanel({ data }: { data: DeskCryptoMarket }) {
  return (
    <section
      aria-label="Crypto market"
      className="flex flex-wrap gap-x-8 gap-y-3 rounded-xl border border-border/60 bg-card p-4"
    >
      <Stat
        name="BTC / USDT"
        value={data.btcPrice != null ? fmt(data.btcPrice) : "—"}
        sub={data.btcChangePercent != null ? `${signed(data.btcChangePercent)}% 24h` : undefined}
        tone={data.btcChangePercent != null ? toneOf(data.btcChangePercent) : undefined}
      />
      <Stat name="24h volume (tracked pairs)" value={`$${fmtCompact(data.quoteVolume24h)}`} />
      <Stat
        name="Breadth"
        value={`${data.advancers} up · ${data.decliners} down`}
        tone={toneOf(data.advancers - data.decliners)}
      />
    </section>
  );
}
