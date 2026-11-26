import { createFileRoute, redirect } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Skeleton, SkeletonRows } from "@/components/ui/skeleton";
import { isAuthenticated } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { useCryptoHub } from "@/hooks/useCryptoHub";
import type { TickerData } from "@/services/crypto-service";
import {
  deskService,
  type DeskBoardRow,
  type DeskMarket,
  type DeskOverview,
  type DeskSymbol,
} from "@/services/desk-service";
import {
  portfolioService,
  type PortfolioDetailDto,
  type TradeSide,
} from "@/services/portfolio-service";
import { globalMarketsService, type GlobalMarketMood } from "@/services/global-markets-service";
import { CseMarketPanel, CryptoMarketPanel } from "@/components/desk/market-panel";
import { DeskBoards, type BoardTab } from "@/components/desk/desk-boards";
import { SymbolPanel } from "@/components/desk/symbol-panel";
import { DeskScanner } from "@/components/desk/desk-scanner";
import { TodayStrip } from "@/components/desk/today-strip";
import { TradeDialog } from "@/components/portfolio/trade-dialog";

export const Route = createFileRoute("/desk")({
  beforeLoad: () => {
    if (typeof window !== "undefined" && !isAuthenticated()) {
      throw redirect({ to: "/login" });
    }
  },
  head: () => ({
    meta: [
      { title: "Trading Desk — AlertMe" },
      {
        name: "description",
        content: "The whole market, your positions, quick alerts and today's trades on one screen.",
      },
    ],
  }),
  component: DeskPage,
});

// ── Small helpers ────────────────────────────────────────────────────────────

function readStore<T extends string>(key: string, fallback: T): T {
  try {
    return (localStorage.getItem(key) as T | null) ?? fallback;
  } catch {
    return fallback;
  }
}

function writeStore(key: string, value: string | null) {
  try {
    if (value == null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    // Private mode / blocked storage: the desk still works, it just won't remember.
  }
}

/** Colombo wall-clock minutes since midnight. */
function colomboMinutes(): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Colombo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const h = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const m = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return h * 60 + m;
}

const toMinutes = (hhmm: string | null) => {
  if (!hhmm) return null;
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

const sameStock = (a: string, b: string) => {
  const n = (s: string) => {
    const u = s.trim().toUpperCase();
    return u.includes(".") ? u : `${u}.N0000`;
  };
  return n(a) === n(b);
};

const isTyping = (el: EventTarget | null) =>
  el instanceof HTMLElement &&
  (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName));

/** Live Binance prices for the crypto desk (mounted only on the crypto side). */
function CryptoLive({ onTickers }: { onTickers: (t: TickerData[]) => void }) {
  useCryptoHub({ onTickerUpdate: onTickers });
  return null;
}

// ── Page ─────────────────────────────────────────────────────────────────────

function DeskPage() {
  const [market, setMarketState] = useState<DeskMarket>(() =>
    readStore<DeskMarket>("desk:market", "cse"),
  );
  const [tab, setTabState] = useState<BoardTab>(() => readStore<BoardTab>("desk:tab", "market"));
  const [selected, setSelectedState] = useState<string | null>(
    () =>
      readStore<string>(`desk:selected:${readStore<DeskMarket>("desk:market", "cse")}`, "") || null,
  );

  const [data, setData] = useState<DeskOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<DeskSymbol | null>(null);
  const [mood, setMood] = useState<GlobalMarketMood | null>(null);
  const [alertOpen, setAlertOpen] = useState(false);
  const [trade, setTrade] = useState<{
    side: TradeSide;
    detail: PortfolioDetailDto;
    symbol: string;
  } | null>(null);
  const [, setClock] = useState(0);

  const orderRef = useRef<string[]>([]);
  const failedRef = useRef(false);

  const setMarket = (m: DeskMarket) => {
    setMarketState(m);
    writeStore("desk:market", m);
    setData(null);
    setDetail(null);
    setSelectedState(readStore<string>(`desk:selected:${m}`, "") || null);
  };
  const setTab = (t: BoardTab) => {
    setTabState(t);
    writeStore("desk:tab", t);
  };
  const select = useCallback(
    (symbol: string) => {
      setSelectedState(symbol);
      writeStore(`desk:selected:${market}`, symbol);
    },
    [market],
  );

  // ── Data ──
  const load = useCallback(async () => {
    try {
      const res = await deskService.overview(market);
      setData(res);
      failedRef.current = false;
    } catch {
      if (!failedRef.current) toast.error("Could not load the desk");
      failedRef.current = true;
    } finally {
      setLoading(false);
    }
  }, [market]);

  const loadDetail = useCallback(async () => {
    if (!selected) return setDetail(null);
    try {
      setDetail(await deskService.symbol(selected, market));
    } catch {
      setDetail(null);
    }
  }, [selected, market]);

  const refreshAll = useCallback(() => {
    void load();
    void loadDetail();
  }, [load, loadDetail]);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);

  useEffect(() => {
    setDetail(null);
    void loadDetail();
  }, [loadDetail]);

  // Pick something to show the first time.
  useEffect(() => {
    if (!selected && data) {
      const first =
        data.portfolio[0]?.symbol ??
        [...data.board].sort((a, b) => b.turnover - a.turnover)[0]?.symbol;
      if (first) select(first);
    }
  }, [data, selected, select]);

  // CSE: 30 s while open, 5 min when closed. Crypto: prices are live; lists every 60 s.
  const isOpen = data?.session.isOpen ?? false;
  useEffect(() => {
    const ms = market === "crypto" ? 60_000 : isOpen ? 30_000 : 5 * 60_000;
    const t = setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, ms);
    return () => clearInterval(t);
  }, [market, isOpen, load]);

  // Selected-stock panel (position, alerts, fundamentals) every 60 s.
  useEffect(() => {
    const t = setInterval(() => {
      if (document.visibilityState === "visible") void loadDetail();
    }, 60_000);
    return () => clearInterval(t);
  }, [loadDetail]);

  // World mood (US / Asia) for the CSE strip, every 5 min.
  useEffect(() => {
    if (market !== "cse") return;
    const get = () =>
      globalMarketsService
        .getOverview()
        .then((o) => setMood(o.mood))
        .catch(() => undefined);
    void get();
    const t = setInterval(get, 5 * 60_000);
    return () => clearInterval(t);
  }, [market]);

  // Re-render the session countdown each minute.
  useEffect(() => {
    const t = setInterval(() => setClock((c) => c + 1), 60_000);
    return () => clearInterval(t);
  }, []);

  const onTickers = useCallback((tickers: TickerData[]) => {
    const live = new Map(tickers.map((t) => [t.symbol, t]));
    const apply = (r: DeskBoardRow): DeskBoardRow => {
      const t = live.get(r.symbol);
      return t
        ? {
            ...r,
            price: t.lastPrice,
            changePercent: t.priceChangePercent,
            high: t.high24h,
            low: t.low24h,
            turnover: t.quoteVolume,
          }
        : r;
    };
    setData((d) =>
      d && d.market === "crypto"
        ? { ...d, board: d.board.map(apply), watchlist: d.watchlist.map(apply) }
        : d,
    );
  }, []);

  // ── Trading ──
  const openTrade = useCallback(
    async (side: TradeSide, portfolioId: number) => {
      if (!selected) return;
      try {
        const p = await portfolioService.getById(portfolioId);
        const held = p.holdings.find((h) =>
          market === "cse"
            ? sameStock(h.symbol, selected)
            : h.symbol.toUpperCase() === selected.toUpperCase(),
        );
        setTrade({ side, detail: p, symbol: side === "Sell" && held ? held.symbol : selected });
      } catch {
        toast.error("Could not open the portfolio");
      }
    },
    [selected, market],
  );

  // ── Keyboard ──
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || isTyping(e.target) || trade || alertOpen) return;
      if (document.querySelector("[role='dialog'], [role='menu']")) return;

      if (e.key === "/") {
        e.preventDefault();
        setTab("market");
        setTimeout(() => document.getElementById("desk-search")?.focus(), 0);
      } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        const order = orderRef.current;
        if (order.length === 0) return;
        e.preventDefault();
        const i = selected ? order.indexOf(selected) : -1;
        const next =
          order[Math.min(order.length - 1, Math.max(0, i + (e.key === "ArrowDown" ? 1 : -1)))];
        if (next) {
          select(next);
          document
            .querySelector(`tr[data-symbol="${CSS.escape(next)}"]`)
            ?.scrollIntoView({ block: "nearest" });
        }
      } else if (e.key === "a" || e.key === "A") {
        if (selected) {
          e.preventDefault();
          setAlertOpen(true);
        }
      } else if (["b", "B", "s", "S"].includes(e.key) && detail) {
        const side: TradeSide = e.key.toLowerCase() === "b" ? "Buy" : "Sell";
        const choices =
          side === "Sell" ? detail.portfolios.filter((p) => p.quantity > 0) : detail.portfolios;
        if (choices.length === 1) {
          e.preventDefault();
          void openTrade(side, choices[0].id);
        } else if (choices.length > 1) {
          toast.info(`Pick the portfolio with the ${side} button`);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const onOrderChange = useCallback((symbols: string[]) => {
    orderRef.current = symbols;
  }, []);

  // ── Render ──
  const session = data?.session;
  const now = colomboMinutes();
  const close = toMinutes(session?.closeTime ?? null);
  const open = toMinutes(session?.openTime ?? null);
  const sessionText =
    market === "crypto"
      ? "24/7 · live prices"
      : session?.isOpen && close != null
        ? `closes in ${Math.floor(Math.max(0, close - now) / 60)}h ${Math.max(0, close - now) % 60}m`
        : session?.isTradingDay && open != null && now < open
          ? `opens ${session.openTime}`
          : "closed";

  const liveQuote =
    data && selected ? (data.board.find((r) => r.symbol === selected) ?? null) : null;
  const watched = !!(data && selected && data.watchlist.some((r) => r.symbol === selected));

  return (
    <AppShell>
      <div className="mx-auto max-w-[1700px] space-y-4">
        {market === "crypto" && <CryptoLive onTickers={onTickers} />}

        {/* Header + session strip */}
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline pb-3">
          <div className="flex flex-wrap items-center gap-4">
            <h1 className="font-display text-2xl font-bold">Trading desk</h1>
            <div role="tablist" aria-label="Market" className="flex rounded-lg bg-muted/50 p-0.5">
              {(["cse", "crypto"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  role="tab"
                  aria-selected={market === m}
                  onClick={() => market !== m && setMarket(m)}
                  className={cn(
                    "rounded-md px-3 py-1 text-xs font-semibold transition-colors cursor-pointer",
                    market === m
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {m === "cse" ? "CSE" : "Crypto"}
                </button>
              ))}
            </div>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider",
                market === "crypto" || session?.isOpen ? "text-success" : "text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  market === "crypto" || session?.isOpen ? "bg-success" : "bg-muted-foreground",
                )}
              />
              {market === "crypto" || session?.isOpen ? "Open" : "Closed"} · {sessionText}
            </span>
            {market === "cse" && mood && mood.label !== "Unknown" && (
              <span className="text-[11px] text-muted-foreground">
                World:{" "}
                <span
                  className={cn(
                    "font-semibold",
                    mood.tone === "positive" && "text-success",
                    mood.tone === "negative" && "text-destructive",
                  )}
                >
                  {mood.label}
                </span>{" "}
                <span className="font-mono">{mood.summary}</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden font-mono text-[10px] text-muted-foreground lg:inline">
              / search · ↑↓ move · A alert · B buy · S sell
            </span>
            {data?.pricesAsOf && (
              <span className="font-mono text-[10px] text-muted-foreground">
                prices {new Date(data.pricesAsOf).toLocaleTimeString("en-GB")}
              </span>
            )}
            <Button size="sm" variant="outline" onClick={refreshAll} className="gap-1.5">
              <RefreshCw className="size-3.5" /> Refresh
            </Button>
          </div>
        </header>

        {loading && !data ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <SkeletonRows rows={8} />
          </div>
        ) : data ? (
          <>
            {data.cse && <CseMarketPanel data={data.cse} />}
            {data.crypto && <CryptoMarketPanel data={data.crypto} />}

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_480px]">
              <div className="min-w-0 space-y-4">
                <DeskBoards
                  data={data}
                  tab={tab}
                  onTabChange={setTab}
                  selected={selected}
                  onSelect={select}
                  onAlertsChanged={refreshAll}
                  onOrderChange={onOrderChange}
                />
                <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
                  <DeskScanner
                    board={data.board}
                    market={market}
                    selected={selected}
                    onSelect={select}
                  />
                  <TodayStrip
                    today={data.today}
                    market={market}
                    cash={data.portfolioTotals.cash}
                    onSelect={select}
                  />
                </div>
              </div>

              <div className="xl:sticky xl:top-4 xl:self-start">
                <SymbolPanel
                  market={market}
                  symbol={selected}
                  detail={detail}
                  liveQuote={liveQuote}
                  watched={watched}
                  alertOpen={alertOpen}
                  onAlertOpenChange={setAlertOpen}
                  onTrade={(side, id) => void openTrade(side, id)}
                  onChanged={refreshAll}
                />
              </div>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">The desk couldn't load. Try Refresh.</p>
        )}
      </div>

      {trade && (
        <TradeDialog
          open
          onOpenChange={(o) => !o && setTrade(null)}
          detail={trade.detail}
          initialSide={trade.side}
          initialSymbol={trade.symbol}
          onSaved={() => {
            setTrade(null);
            refreshAll();
          }}
        />
      )}
    </AppShell>
  );
}
