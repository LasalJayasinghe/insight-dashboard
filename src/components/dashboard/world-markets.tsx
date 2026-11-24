import { useEffect, useState } from "react";
import { Cell, CellLabel, Delta } from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatRelative } from "@/lib/format";
import {
  globalMarketsService,
  type GlobalMarketOverview,
  type GlobalMarketQuote,
} from "@/services/global-markets-service";

/** The server refreshes every 5 minutes; polling faster would only re-read the same cache. */
const REFRESH_MS = 5 * 60_000;

const formatPrice = (n: number) =>
  n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const toneClass = {
  positive: "text-success",
  negative: "text-destructive",
  neutral: "text-foreground",
} as const;

/**
 * "World markets" — a glance at the US close/futures, Asia, gold/silver/oil and risk gauges,
 * meant for checking before the CSE opens (a big drop in Asia usually drags the CSE too).
 */
export function WorldMarkets() {
  const [data, setData] = useState<GlobalMarketOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const res = await globalMarketsService.getOverview();
        if (!mounted) return;
        setData(res);
        setFailed(false);
      } catch {
        if (mounted) setFailed(true);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void load();
    const t = setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, REFRESH_MS);

    return () => {
      mounted = false;
      clearInterval(t);
    };
  }, []);

  const groups = data?.groups ?? [];
  const mood = data?.mood;

  return (
    <Cell className="rounded-xl border border-border/60 shadow-sm overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <CellLabel>World markets</CellLabel>
          <p className="mt-1.5 text-xs text-muted-foreground">
            Check before the CSE opens at 9:30 — Asia trades live in the morning; the US shows its
            last close plus futures.
          </p>
        </div>

        {mood && mood.label !== "Unknown" && (
          <div className="text-right">
            <div
              className={cn(
                "font-display text-lg font-bold leading-none",
                toneClass[mood.tone] ?? toneClass.neutral,
              )}
            >
              {mood.label}
            </div>
            <div className="mt-1.5 font-mono text-[11px] text-muted-foreground tabular-nums">
              {mood.summary}
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ))}
        </div>
      ) : groups.length === 0 ? (
        <p className="mt-5 text-sm text-muted-foreground">
          {failed
            ? "World market data is unavailable right now."
            : "World market data hasn't loaded yet — check back in a minute."}
        </p>
      ) : (
        <>
          <div className="mt-5 grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2 xl:grid-cols-4">
            {groups.map((g) => (
              <div key={g.key} className="min-w-0">
                <div className="label-caps text-muted-foreground">{g.title}</div>
                <ul className="mt-2 divide-y divide-hairline/70 border-t border-hairline/70">
                  {g.quotes.map((q) => (
                    <QuoteRow key={q.symbol} q={q} />
                  ))}
                </ul>
              </div>
            ))}
          </div>
          {data?.updatedAt && (
            <p className="mt-4 font-mono text-[10px] text-muted-foreground">
              Updated {formatRelative(data.updatedAt)} · ● open now · prices may be delayed
            </p>
          )}
        </>
      )}
    </Cell>
  );
}

function QuoteRow({ q }: { q: GlobalMarketQuote }) {
  return (
    <li className="flex items-center gap-2 py-2" title={`${q.name} · ${q.region}`}>
      <span
        className={cn(
          "size-1.5 shrink-0 rounded-full",
          q.isOpen ? "bg-success" : "bg-muted-foreground/30",
        )}
        aria-label={q.isOpen ? "Open" : "Closed"}
      />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{q.name}</div>
        <div className="truncate text-[11px] text-muted-foreground">{q.region}</div>
      </div>
      <div className="text-right">
        <div className="font-mono text-xs font-semibold tabular-nums">{formatPrice(q.price)}</div>
        <Delta value={q.changePercent} />
      </div>
    </li>
  );
}
