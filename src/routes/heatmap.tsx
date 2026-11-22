import { createFileRoute, redirect, Link, useNavigate } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { LayoutGrid, RefreshCw } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Masthead } from "@/components/ui/panel";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { isAuthenticated } from "@/lib/auth";
import { apiErrorMessage } from "@/lib/api-error";
import { cn } from "@/lib/utils";
import { squarify, type TreemapRect } from "@/lib/treemap";
import { heatStyle, HEAT_CLAMP } from "@/components/heatmap/heat-color";
import { fmt, fmtCompact, fmtPrice, fmtQty, signed, toneOf } from "@/components/portfolio/format";
import { portfolioService, type HoldingDto, type PortfolioType } from "@/services/portfolio-service";

export const Route = createFileRoute("/heatmap")({
  beforeLoad: () => {
    if (typeof window !== "undefined" && !isAuthenticated()) throw redirect({ to: "/login" });
  },
  head: () => ({
    meta: [
      { title: "Holdings Heatmap — AlertMe" },
      { name: "description", content: "Every holding across your portfolios in one treemap heatmap." },
      { property: "og:title", content: "Holdings Heatmap — AlertMe" },
      { property: "og:description", content: "Every holding across your portfolios in one treemap heatmap." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HeatmapRoute,
});

function HeatmapRoute() {
  const [client] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={client}>
      <AppShell>
        <HeatmapPage />
      </AppShell>
    </QueryClientProvider>
  );
}

interface Tile extends HoldingDto {
  key: string;
  portfolioId: number;
  portfolioName: string;
  portfolioType: PortfolioType;
  currency: string;
}
type Currency = "LKR" | "USDT";
type ColorBy = "day" | "total";
type GroupBy = "none" | "portfolio";

async function loadTiles(): Promise<Tile[]> {
  const list = await portfolioService.list();
  const details = await Promise.all(list.map((p) => portfolioService.getById(p.id)));
  return details.flatMap((d) =>
    d.holdings.map((h) => ({
      ...h,
      key: `${d.id}-${h.id}`,
      portfolioId: d.id,
      portfolioName: d.name,
      portfolioType: d.type,
      currency: d.baseCurrency,
    })),
  );
}

const isCrypto = (t: Tile) => t.portfolioType === "Crypto";

function HeatmapPage() {
  const q = useQuery({ queryKey: ["heatmap-holdings"], queryFn: loadTiles, refetchInterval: 60_000 });
  const [currency, setCurrency] = useState<Currency>("LKR");
  const [colorBy, setColorBy] = useState<ColorBy>("day");
  const [groupBy, setGroupBy] = useState<GroupBy>("none");
  const [highlight, setHighlight] = useState<string | null>(null);

  const all = q.data ?? [];
  const hasStocks = all.some((t) => !isCrypto(t));
  const hasCrypto = all.some(isCrypto);
  useEffect(() => {
    if (q.data && !hasStocks && hasCrypto) setCurrency("USDT");
  }, [q.data, hasStocks, hasCrypto]);

  const tiles = useMemo(
    () => all.filter((t) => (currency === "USDT" ? isCrypto(t) : !isCrypto(t))),
    [all, currency],
  );
  const pctOf = (t: Tile) => (colorBy === "day" ? t.dayChangePercent : t.profitLossPercent);

  const updated = q.dataUpdatedAt
    ? new Date(q.dataUpdatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <div className="space-y-6">
      <Masthead
        eyebrow="Portfolios"
        title="Holdings Heatmap"
        meta={updated ? `Updated ${updated} · refreshes every minute` : "All holdings, sized by value"}
        actions={
          <Button variant="outline" size="sm" className="min-h-11" onClick={() => q.refetch()} disabled={q.isFetching}>
            <RefreshCw className={cn("size-4", q.isFetching && "animate-spin")} /> Refresh
          </Button>
        }
      />

      {q.isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
          </div>
          <Skeleton className="h-[60vh] w-full md:h-[70vh]" />
        </div>
      ) : q.isError ? (
        <Card className="p-8 text-center">
          <p className="font-medium">Couldn't load your holdings.</p>
          <p className="mt-1 text-sm text-muted-foreground">{apiErrorMessage(q.error, "Please try again.")}</p>
          <Button className="mt-4 min-h-11" onClick={() => q.refetch()}>Try again</Button>
        </Card>
      ) : all.length === 0 ? (
        <Card className="p-10 text-center">
          <LayoutGrid className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-3 font-medium">No holdings yet.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Add one in <Link to="/portfolios" className="underline underline-offset-4">Portfolios</Link>.
          </p>
        </Card>
      ) : (
        <>
          <Summary tiles={tiles} currency={currency} onPick={(k) => {
            setHighlight(k);
            document.getElementById(`tile-${k}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
            setTimeout(() => setHighlight(null), 2500);
          }} />

          <div className="-mx-1 flex gap-4 overflow-x-auto px-1 pb-1">
            {hasStocks && hasCrypto && (
              <Control label="Currency">
                <ToggleGroup type="single" value={currency} onValueChange={(v) => v && setCurrency(v as Currency)} variant="outline">
                  <ToggleGroupItem value="LKR" className="min-h-11">LKR</ToggleGroupItem>
                  <ToggleGroupItem value="USDT" className="min-h-11">USDT</ToggleGroupItem>
                </ToggleGroup>
              </Control>
            )}
            <Control label="Colour by">
              <ToggleGroup type="single" value={colorBy} onValueChange={(v) => v && setColorBy(v as ColorBy)} variant="outline">
                <ToggleGroupItem value="day" className="min-h-11 whitespace-nowrap">Today</ToggleGroupItem>
                <ToggleGroupItem value="total" className="min-h-11 whitespace-nowrap">Total return</ToggleGroupItem>
              </ToggleGroup>
            </Control>
            <Control label="Group by">
              <ToggleGroup type="single" value={groupBy} onValueChange={(v) => v && setGroupBy(v as GroupBy)} variant="outline">
                <ToggleGroupItem value="none" className="min-h-11">None</ToggleGroupItem>
                <ToggleGroupItem value="portfolio" className="min-h-11">Portfolio</ToggleGroupItem>
              </ToggleGroup>
            </Control>
          </div>

          <Treemap tiles={tiles} groupBy={groupBy} pctOf={pctOf} highlight={highlight} />
          <Legend />
        </>
      )}
    </div>
  );
}

function Control({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex shrink-0 items-center gap-2">
      <span className="label-caps whitespace-nowrap">{label}</span>
      {children}
    </div>
  );
}

function Summary({ tiles, currency, onPick }: { tiles: Tile[]; currency: string; onPick: (k: string) => void }) {
  const total = tiles.reduce((a, t) => a + t.currentValue, 0);
  const day = tiles.reduce((a, t) => a + t.dayProfitLoss, 0);
  const pl = tiles.reduce((a, t) => a + t.profitLoss, 0);
  const dayPct = total - day > 0 ? (day / (total - day)) * 100 : 0;
  const cost = total - pl;
  const plPct = cost > 0 ? (pl / cost) * 100 : 0;
  const sorted = [...tiles].sort((a, b) => b.dayChangePercent - a.dayChangePercent);
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      <Stat label="Total value" value={`${currency} ${fmtCompact(total)}`} />
      <Stat label="Today's P/L" value={`${signed(day)}`} sub={`${signed(dayPct)}%`} tone={toneOf(day)} />
      <Stat label="Total P/L" value={`${signed(pl)}`} sub={`${signed(plPct)}%`} tone={toneOf(pl)} />
      <Stat label="Holdings" value={String(tiles.length)} />
      {best && <Stat label="Best today" value={best.symbol} sub={`${signed(best.dayChangePercent)}%`} tone={toneOf(best.dayChangePercent)} onClick={() => onPick(best.key)} />}
      {worst && <Stat label="Worst today" value={worst.symbol} sub={`${signed(worst.dayChangePercent)}%`} tone={toneOf(worst.dayChangePercent)} onClick={() => onPick(worst.key)} />}
    </div>
  );
}

function Stat({ label, value, sub, tone, onClick }: { label: string; value: string; sub?: string; tone?: string; onClick?: () => void }) {
  const Comp = onClick ? "button" : "div";
  return (
    <Comp onClick={onClick} className={cn("min-h-11 border border-hairline bg-card p-3 text-left", onClick && "transition-colors hover:bg-muted")}>
      <div className="label-caps">{label}</div>
      <div className={cn("mt-1 truncate font-mono text-lg font-semibold tabular-nums", tone)}>{value}</div>
      {sub && <div className={cn("font-mono text-xs tabular-nums", tone)}>{sub}</div>}
    </Comp>
  );
}

function useSize<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => e && setSize({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, size] as const;
}

const HEADER = 22;

function Treemap({ tiles, groupBy, pctOf, highlight }: { tiles: Tile[]; groupBy: GroupBy; pctOf: (t: Tile) => number; highlight: string | null }) {
  const [ref, { w, h }] = useSize<HTMLDivElement>();
  const byKey = useMemo(() => new Map(tiles.map((t) => [t.key, t])), [tiles]);

  const layout = useMemo(() => {
    if (groupBy === "none") {
      return { groups: [] as { id: string; name: string; total: number; r: TreemapRect }[], rects: squarify(tiles.map((t) => ({ id: t.key, value: t.currentValue })), w, h) };
    }
    const groups = new Map<string, { name: string; items: Tile[] }>();
    for (const t of tiles) {
      const g = groups.get(String(t.portfolioId)) ?? { name: t.portfolioName, items: [] };
      g.items.push(t);
      groups.set(String(t.portfolioId), g);
    }
    const totals = [...groups.entries()].map(([id, g]) => ({ id, value: g.items.reduce((a, t) => a + t.currentValue, 0) }));
    const outer = squarify(totals, w, h);
    const rects: TreemapRect[] = [];
    const gOut = outer.map((r) => {
      const g = groups.get(r.id)!;
      const inner = squarify(g.items.map((t) => ({ id: t.key, value: t.currentValue })), Math.max(0, r.w - 4), Math.max(0, r.h - HEADER - 4));
      for (const i of inner) rects.push({ ...i, x: i.x + r.x + 2, y: i.y + r.y + HEADER + 2 });
      return { id: r.id, name: g.name, total: totals.find((t) => t.id === r.id)!.value, r };
    });
    return { groups: gOut, rects };
  }, [tiles, groupBy, w, h]);

  return (
    <div ref={ref} className="relative h-[60vh] w-full overflow-hidden border border-hairline bg-muted md:h-[70vh]">
      {layout.groups.map((g) => (
        <div key={g.id} className="absolute border-2 border-foreground/40" style={{ left: g.r.x, top: g.r.y, width: g.r.w, height: g.r.h }}>
          <div className="flex h-[22px] items-center justify-between gap-2 overflow-hidden bg-background px-2 text-[11px]">
            <span className="truncate font-semibold">{g.name}</span>
            <span className="shrink-0 font-mono text-muted-foreground">{fmtCompact(g.total)}</span>
          </div>
        </div>
      ))}
      {layout.rects.map((r) => {
        const t = byKey.get(r.id);
        return t ? <TileView key={r.id} t={t} r={r} pct={pctOf(t)} highlighted={highlight === r.id} /> : null;
      })}
    </div>
  );
}

function TileView({ t, r, pct, highlighted }: { t: Tile; r: TreemapRect; pct: number; highlighted: boolean }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const showText = r.w >= 44 && r.h >= 32;
  const showValue = r.w >= 110 && r.h >= 70;
  const strong = Math.abs(pct) >= HEAT_CLAMP * 0.5;
  const go = () => {
    if (isCrypto(t)) navigate({ to: "/crypto" });
    else navigate({ to: "/stocks", search: { symbol: t.symbol } });
  };
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          id={`tile-${t.key}`}
          type="button"
          aria-label={`${t.symbol} ${signed(pct)}%`}
          onMouseEnter={() => window.matchMedia("(hover: hover)").matches && setOpen(true)}
          onMouseLeave={() => window.matchMedia("(hover: hover)").matches && setOpen(false)}
          onClick={(e) => {
            if (window.matchMedia("(hover: hover)").matches) { e.preventDefault(); go(); }
          }}
          className={cn(
            "absolute flex flex-col items-center justify-center overflow-hidden border border-background p-1 text-center transition-[outline] focus-visible:outline-2 focus-visible:outline-ring",
            strong ? "text-background" : "text-foreground",
            highlighted && "z-10 outline outline-4 outline-ring",
          )}
          style={{ left: r.x, top: r.y, width: r.w, height: r.h, ...heatStyle(pct) }}
        >
          {showText && (
            <>
              <span className="max-w-full truncate font-display text-sm font-bold">{t.symbol}</span>
              <span className="font-mono text-xs tabular-nums">{signed(pct)}%</span>
              {showValue && <span className="mt-0.5 font-mono text-[11px] opacity-80">{t.currency} {fmtCompact(t.currentValue)}</span>}
            </>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-4" side="top" onOpenAutoFocus={(e) => e.preventDefault()}>
        <div className="font-display font-bold">{t.symbol}</div>
        <div className="truncate text-sm text-muted-foreground">{t.name || t.assetType} · {t.portfolioName}</div>
        <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 font-mono text-xs tabular-nums">
          <dt className="text-muted-foreground">Quantity</dt><dd className="text-right">{fmtQty(t.quantity)}</dd>
          <dt className="text-muted-foreground">Avg buy</dt><dd className="text-right">{fmtPrice(t.averageBuyPrice, t.currency)}</dd>
          <dt className="text-muted-foreground">Current</dt><dd className="text-right">{fmtPrice(t.currentPrice, t.currency)}</dd>
          <dt className="text-muted-foreground">Value</dt><dd className="text-right">{t.currency} {fmt(t.currentValue)}</dd>
          <dt className="text-muted-foreground">Weight</dt><dd className="text-right">{fmt(t.weightPercent)}%</dd>
          <dt className="text-muted-foreground">Today P/L</dt><dd className={cn("text-right", toneOf(t.dayProfitLoss))}>{t.currency} {signed(t.dayProfitLoss)} ({signed(t.dayChangePercent)}%)</dd>
          <dt className="text-muted-foreground">Total P/L</dt><dd className={cn("text-right", toneOf(t.profitLoss))}>{t.currency} {signed(t.profitLoss)} ({signed(t.profitLossPercent)}%)</dd>
        </dl>
        <Button size="sm" variant="outline" className="mt-3 min-h-11 w-full" onClick={go}>
          Open {isCrypto(t) ? "Crypto market" : t.symbol}
        </Button>
      </PopoverContent>
    </Popover>
  );
}

function Legend() {
  return (
    <div className="mx-auto w-full max-w-md">
      <div
        className="h-3 w-full border border-hairline"
        style={{ background: "linear-gradient(to right, var(--destructive), var(--muted), var(--success))" }}
      />
      <div className="mt-1 flex justify-between font-mono text-xs text-muted-foreground">
        <span>−{HEAT_CLAMP}%</span><span>0%</span><span>+{HEAT_CLAMP}%</span>
      </div>
    </div>
  );
}
