import { useCallback, useEffect, useState, type ReactNode } from "react";
import { ExternalLink, Landmark, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCalendarDate } from "@/lib/format";
import { SkeletonStats } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  fundamentalsService,
  type FundamentalStatus,
  type FundamentalValue,
  type StockFundamentals,
} from "@/services/fundamentals-service";
import { fmtPrice } from "./format";

interface StockFundamentalsPanelProps {
  symbol: string;
}

const statusMeta: Record<FundamentalStatus, { label: string; className: string }> = {
  verified: { label: "Checked against the report", className: "bg-success" },
  manual: { label: "Entered by hand", className: "bg-primary" },
  unverified: { label: "Read from the report, not cross-checked", className: "bg-warning" },
  partial: { label: "Based on incomplete data", className: "bg-warning" },
  missing: { label: "Not available", className: "bg-muted-foreground/30" },
};

const num = (n: number, digits = 2) =>
  n.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });

/** 326,441,859,452 → "Rs 326.4B". */
function fmtCompactRs(n: number | null): string {
  if (n == null) return "—";
  if (n >= 1e9) return `Rs ${num(n / 1e9, 1)}B`;
  if (n >= 1e6) return `Rs ${num(n / 1e6, 1)}M`;
  return `Rs ${num(n, 0)}`;
}

/**
 * Core CSE fundamentals read from the company's latest interim report (NAV, EPS, public float)
 * combined with the live price (P/BV, P/E, ROE, dividend yield) and CSE market data (beta, 52-week range).
 * Every figure shows how far it can be trusted.
 */
export function StockFundamentalsPanel({ symbol }: StockFundamentalsPanelProps) {
  const [data, setData] = useState<StockFundamentals | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await fundamentalsService.get(symbol));
    } catch {
      setError("Could not load fundamentals right now.");
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  useEffect(() => {
    void load();
  }, [load]);

  const price = data?.price ?? null;
  const low = data?.low52Week ?? null;
  const high = data?.high52Week ?? null;
  const rangePct =
    price != null && low != null && high != null && high > low
      ? Math.min(100, Math.max(0, ((price - low) / (high - low)) * 100))
      : null;

  return (
    <section className="rounded-xl border border-border bg-card shadow-card p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <Landmark className="size-4 text-primary" />
          <h3 className="text-sm font-bold uppercase tracking-widest text-foreground">
            Fundamentals
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {data?.reportUrl && (
            <a
              href={data.reportUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground"
              title={data.reportTitle ?? undefined}
            >
              Report to{" "}
              {formatCalendarDate(data.reportPeriodEnd, {
                year: "numeric",
                month: "short",
                day: "2-digit",
              })}
              <ExternalLink className="size-3" />
            </a>
          )}
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
          >
            <RefreshCw className={cn("size-3", loading && "animate-spin")} />
            Refresh
          </button>
        </div>
      </div>

      {loading && !data ? (
        <SkeletonStats count={4} />
      ) : error ? (
        <p className="text-sm text-muted-foreground">{error}</p>
      ) : data ? (
        <TooltipProvider>
          {!data.hasReports && (
            <p className="text-xs text-muted-foreground">
              This company's financial statements haven't been read yet — NAV, EPS and the ratios
              built on them appear once its latest report is processed.
            </p>
          )}

          <div className="space-y-4">
            <Group title="Valuation">
              <Metric
                label="NAV / share"
                v={data.navPerShare}
                format={(n) => `Rs ${fmtPrice(n)}`}
              />
              <Metric label="P / BV" v={data.priceToBook} format={(n) => `${num(n)}×`} />
              <Metric label="EPS (TTM)" v={data.epsTtm} format={(n) => `Rs ${fmtPrice(n)}`} />
              <Metric label="P / E" v={data.priceToEarnings} format={(n) => `${num(n)}×`} />
              <Metric label="Dividend yield" v={data.dividendYield} format={(n) => `${num(n)}%`} />
              <Metric label="ROE (TTM)" v={data.roe} format={(n) => `${num(n)}%`} />
            </Group>

            <Group title="Ownership & risk">
              <Metric
                label="Public float"
                v={data.publicFloatPercent}
                format={(n) => `${num(n)}%`}
              />
              <Plain label="Market cap" value={fmtCompactRs(data.marketCap)} />
              <Plain
                label="Beta · ASPI"
                value={data.betaAspi != null ? num(data.betaAspi) : "—"}
                hint="Sensitivity to the All Share Price Index — 1.0 moves with the market."
              />
              <Plain
                label="Beta · S&P SL20"
                value={data.betaSl20 != null ? num(data.betaSl20) : "—"}
              />
            </Group>

            {rangePct != null && (
              <div className="pt-1">
                <div className="flex justify-between text-xs font-mono text-muted-foreground mb-1">
                  <span>52W low {fmtPrice(low!)}</span>
                  <span className="font-bold text-foreground">52-week range</span>
                  <span>52W high {fmtPrice(high!)}</span>
                </div>
                <div className="relative h-2 w-full rounded-full bg-muted" aria-hidden>
                  <div
                    className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-card bg-primary"
                    style={{ left: `${rangePct}%` }}
                  />
                </div>
              </div>
            )}

            <Legend />
          </div>
        </TooltipProvider>
      ) : null}
    </section>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
        {title}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">{children}</div>
    </div>
  );
}

function Metric({
  label,
  v,
  format,
}: {
  label: string;
  v: FundamentalValue;
  format: (n: number) => string;
}) {
  const meta = statusMeta[v.status] ?? statusMeta.missing;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          tabIndex={0}
          className="bg-muted/30 border border-border rounded-lg p-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="flex items-center justify-between gap-2 text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
            {label}
            <span className={cn("size-1.5 shrink-0 rounded-full", meta.className)} aria-hidden />
          </span>
          <span
            className={cn(
              "font-mono font-bold",
              v.value == null ? "text-muted-foreground" : "text-foreground",
            )}
          >
            {v.value != null ? format(v.value) : "—"}
          </span>
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs text-xs space-y-1 p-2.5">
        <p className="font-semibold">{meta.label}</p>
        {v.note && <p className="leading-relaxed opacity-90">{v.note}</p>}
      </TooltipContent>
    </Tooltip>
  );
}

function Plain({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="bg-muted/30 border border-border rounded-lg p-3" title={hint}>
      <span className="block text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
        {label}
      </span>
      <span className="font-mono font-bold text-foreground">{value}</span>
    </div>
  );
}

function Legend() {
  const items: FundamentalStatus[] = ["verified", "unverified", "partial", "manual"];
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-muted-foreground">
      {items.map((s) => (
        <span key={s} className="inline-flex items-center gap-1.5">
          <span className={cn("size-1.5 rounded-full", statusMeta[s].className)} aria-hidden />
          {statusMeta[s].label}
        </span>
      ))}
    </div>
  );
}
