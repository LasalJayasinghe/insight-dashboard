import React, { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  CalendarDays,
  ExternalLink,
  Newspaper,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
} from "lucide-react";
import { newsService, type NewsArticle } from "@/services/news-service";
import { Bento, Cell, CellLabel } from "@/components/ui/panel";
import { cn } from "@/lib/utils";
import { SkeletonRows } from "@/components/ui/skeleton";

interface MarketNewsFeedProps {
  defaultCategory?: string;
  symbolFilter?: string;
  title?: string;
  className?: string;
  maxHeight?: string;
}

const CATEGORIES = [
  { id: "ALL", label: "All" },
  { id: "CSE_STOCKS", label: "CSE" },
  { id: "GLOBAL_CRYPTO", label: "Crypto" },
  { id: "GLOBAL_BUSINESS", label: "Global" },
];

export function MarketNewsFeed({
  defaultCategory = "ALL",
  symbolFilter,
  title = "Market Intelligence & News",
  className,
  maxHeight = "h-[560px]",
}: MarketNewsFeedProps) {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [activeCategory, setActiveCategory] = useState<string>(defaultCategory);

  const fetchNews = async () => {
    setLoading(true);
    try {
      if (symbolFilter) {
        const data = await newsService.getNewsBySymbol(symbolFilter, 15);
        setArticles(prioritizeDividendPaymentDates(data));
      } else {
        const data = await newsService.getNews(activeCategory, undefined, 20, 1);
        setArticles(prioritizeDividendPaymentDates(data.items || []));
      }
    } catch (err) {
      console.error("Failed to load news articles:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, [activeCategory, symbolFilter]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await newsService.syncNews();
      await fetchNews();
    } catch (err) {
      console.error("Failed to sync news:", err);
    } finally {
      setSyncing(false);
    }
  };

  const getSentimentMeta = (sentiment: string) => {
    const s = sentiment?.toUpperCase();
    if (s === "BULLISH") {
      return {
        label: "Bullish",
        Icon: TrendingUp,
        rail: "bg-success",
        text: "text-success",
        chip: "border-success/30 bg-success/10 text-success",
      };
    }
    if (s === "BEARISH") {
      return {
        label: "Bearish",
        Icon: TrendingDown,
        rail: "bg-destructive",
        text: "text-destructive",
        chip: "border-destructive/30 bg-destructive/10 text-destructive",
      };
    }
    return {
      label: "Neutral",
      Icon: Minus,
      rail: "bg-muted-foreground/40",
      text: "text-muted-foreground",
      chip: "border-border bg-muted/50 text-muted-foreground",
    };
  };


  const getCategoryLabel = (cat: string) => {
    switch (cat?.toUpperCase()) {
      case "CSE_STOCKS":
        return "CSE Stocks";
      case "GLOBAL_CRYPTO":
        return "Crypto";
      case "GLOBAL_BUSINESS":
        return "Global Finance";
      default:
        return cat || "Market";
    }
  };

  const parseTickers = (jsonStr: string): string[] => {
    try {
      const parsed = JSON.parse(jsonStr);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const isDividendArticle = (article: NewsArticle): boolean => {
    const haystack = `${article.title} ${article.summary} ${article.validationReasoning || ""}`.toLowerCase();
    return haystack.includes("dividend");
  };

  const extractPaymentDateText = (article: NewsArticle): string | null => {
    if (article.dividendPaymentDate) {
      const structuredDate = new Date(article.dividendPaymentDate);
      if (!Number.isNaN(structuredDate.getTime())) {
        return structuredDate.toLocaleDateString();
      }

      return article.dividendPaymentDate;
    }

    const haystack = `${article.title}\n${article.summary}\n${article.validationReasoning || ""}`;

    const regexes = [
      /payment\s*date\s*[:\-]?\s*([0-9]{4}-[0-9]{2}-[0-9]{2})/i,
      /payment\s*date\s*[:\-]?\s*([0-9]{1,2}[\/\-][0-9]{1,2}[\/\-][0-9]{2,4})/i,
      /payment\s*date\s*[:\-]?\s*([A-Za-z]{3,9}\s+[0-9]{1,2},?\s+[0-9]{4})/i,
      /payable\s*on\s*[:\-]?\s*([A-Za-z]{3,9}\s+[0-9]{1,2},?\s+[0-9]{4})/i,
      /payable\s*on\s*[:\-]?\s*([0-9]{4}-[0-9]{2}-[0-9]{2})/i,
    ];

    for (const regex of regexes) {
      const match = haystack.match(regex);
      if (match?.[1]) return match[1].trim();
    }

    return null;
  };

  const prioritizeDividendPaymentDates = (items: NewsArticle[]): NewsArticle[] => {
    return [...items].sort((a, b) => {
      const aDividend = isDividendArticle(a);
      const bDividend = isDividendArticle(b);
      const aPayment = extractPaymentDateText(a);
      const bPayment = extractPaymentDateText(b);

      const aScore = (aDividend ? 2 : 0) + (aPayment ? 1 : 0);
      const bScore = (bDividend ? 2 : 0) + (bPayment ? 1 : 0);

      if (aScore !== bScore) return bScore - aScore;

      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    });
  };

  const formatRelativeTime = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${Math.max(1, diffMins)}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const formatCalendarDate = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString();
  };

  const isCseFocused = !!symbolFilter || activeCategory === "CSE_STOCKS";

  return (
    <Bento className={cn("flex min-h-0 flex-col overflow-hidden", maxHeight, className)}>
      <Cell className="shrink-0 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CellLabel index="VIII">
              <span className="flex items-center gap-2">
                <Newspaper className="size-4 text-primary" />
                {title}
              </span>
            </CellLabel>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70">
              {loading ? "Loading feed" : `${articles.length} stories`}
              {" · "}
              AI-validated
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-7 shrink-0 gap-1.5 px-2 font-mono text-[10px] uppercase tracking-wider"
            onClick={handleSync}
            disabled={syncing}
            title="Sync latest market news"
          >
            <RefreshCw className={cn("size-3.5", syncing && "animate-spin")} />
            {syncing ? "Syncing" : "Sync"}
          </Button>
        </div>

        {!symbolFilter && (
          <div className="mt-3 flex items-center gap-4 border-b border-hairline">
            {CATEGORIES.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveCategory(tab.id)}
                className={cn(
                  "-mb-px border-b-2 pb-1.5 font-mono text-[10px] font-medium uppercase tracking-wider transition-colors",
                  activeCategory === tab.id
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </Cell>

      <Cell className="flex min-h-0 flex-1 flex-col p-0">
        {loading ? (
          <div className="h-full overflow-hidden">
            <SkeletonRows rows={7} avatar={false} />
          </div>
        ) : articles.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center text-muted-foreground">
            <Newspaper className="size-8 opacity-40" />
            <p className="text-sm">No recent news available.</p>
            <Button variant="ghost" size="sm" onClick={handleSync} disabled={syncing}>
              Fetch Latest News
            </Button>
          </div>
        ) : (
          <ScrollArea className="h-full flex-1">
            <div className="divide-y divide-hairline/70">
              {articles.map((article, idx) => {
                const tickers = parseTickers(article.mentionedTickersJson);
                const dividendArticle = isDividendArticle(article);
                const paymentDateText = extractPaymentDateText(article);
                const publishedDate = formatCalendarDate(article.publishedAt);
                const isCseArticle = article.marketCategory?.toUpperCase() === "CSE_STOCKS";
                const sentiment = getSentimentMeta(article.sentiment);

                return (
                  <article
                    key={article.id}
                    className="group relative flex gap-3 p-4 transition-colors hover:bg-muted/30"
                  >
                    <span
                      className={cn(
                        "absolute left-0 top-0 h-full w-[2px] opacity-70 transition-opacity group-hover:opacity-100",
                        sentiment.rail,
                      )}
                      aria-hidden
                    />

                    <div className="flex w-8 shrink-0 flex-col items-start gap-1 pt-0.5">
                      <span className="font-mono text-[10px] tabular-nums text-muted-foreground/50">
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                      <sentiment.Icon className={cn("size-3.5", sentiment.text)} />
                    </div>

                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70">
                        <span className={cn("font-semibold", sentiment.text)}>{sentiment.label}</span>
                        <span className="opacity-40">/</span>
                        <span className={cn(isCseArticle && "text-primary")}>
                          {getCategoryLabel(article.marketCategory)}
                        </span>
                        <span className="opacity-40">/</span>
                        <span className="normal-case tracking-normal">{article.source}</span>
                        <span className="opacity-40">·</span>
                        <span className="tabular-nums">{formatRelativeTime(article.publishedAt)}</span>
                        {isCseFocused && publishedDate && (
                          <span className="tabular-nums opacity-70">({publishedDate})</span>
                        )}
                      </div>

                      <a
                        href={article.originalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block font-display text-sm font-semibold leading-snug text-foreground transition-colors group-hover:text-primary"
                      >
                        <span className="flex items-start gap-1.5">
                          <span className="min-w-0 flex-1">{article.title}</span>
                          <ExternalLink className="mt-0.5 size-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
                        </span>
                      </a>

                      {(dividendArticle || paymentDateText) && (
                        <div className="flex flex-wrap items-center gap-1.5">
                          {dividendArticle && (
                            <Badge
                              variant="outline"
                              className="border-primary/40 bg-primary/10 px-1.5 py-0 text-[10px] text-primary"
                            >
                              Dividend
                            </Badge>
                          )}
                          {paymentDateText && (
                            <Badge
                              variant="outline"
                              className="gap-1 border-amber-400/40 bg-amber-500/10 px-1.5 py-0 text-[10px] font-semibold text-amber-500"
                            >
                              <CalendarDays className="size-3" /> Payment: {paymentDateText}
                            </Badge>
                          )}
                        </div>
                      )}

                      {article.summary && (
                        <p className="border-l border-hairline pl-2.5 text-xs leading-relaxed text-muted-foreground/90">
                          <span className="mr-1 inline-flex items-center gap-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-primary/90">
                            <Sparkles className="size-3 text-accent" /> Brief
                          </span>
                          {article.summary}
                        </p>
                      )}

                      {tickers.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5">
                          {tickers.map((t) => (
                            <Badge
                              key={t}
                              variant="secondary"
                              className="cursor-pointer border-primary/20 bg-primary/10 font-mono text-[10px] text-primary hover:bg-primary/20"
                            >
                              ${t}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </Cell>
    </Bento>

  );
}
