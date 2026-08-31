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

  const getSentimentBadge = (sentiment: string) => {
    const s = sentiment?.toUpperCase();
    if (s === "BULLISH") {
      return (
        <Badge
          variant="outline"
          className="gap-1 border-success/30 bg-success/10 text-success text-[10px] font-medium px-1.5 py-0"
        >
          <TrendingUp className="size-3" /> Bullish
        </Badge>
      );
    }
    if (s === "BEARISH") {
      return (
        <Badge
          variant="outline"
          className="gap-1 border-destructive/30 bg-destructive/10 text-destructive text-[10px] font-medium px-1.5 py-0"
        >
          <TrendingDown className="size-3" /> Bearish
        </Badge>
      );
    }
    return (
      <Badge
        variant="outline"
        className="gap-1 border-border bg-muted/50 text-muted-foreground text-[10px] font-medium px-1.5 py-0"
      >
        <Minus className="size-3" /> Neutral
      </Badge>
    );
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

  return (
    <Bento className={cn("flex min-h-0 flex-col overflow-hidden", maxHeight, className)}>
      <Cell className="shrink-0 p-4">
        <div className="flex items-center justify-between gap-3">
          <CellLabel index="VIII">
            <span className="flex items-center gap-2">
              <Newspaper className="size-4 text-primary" />
              {title}
            </span>
          </CellLabel>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7 shrink-0"
            onClick={handleSync}
            disabled={syncing}
            title="Sync latest market news"
          >
            <RefreshCw className={cn("size-3.5", syncing && "animate-spin")} />
          </Button>
        </div>

        {!symbolFilter && (
          <div className="mt-3 flex items-center gap-1 border border-hairline p-1">
            {CATEGORIES.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveCategory(tab.id)}
                className={cn(
                  "flex-1 px-2 py-1 text-[10px] font-mono font-medium uppercase tracking-wider transition-colors",
                  activeCategory === tab.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
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
          <div className="flex h-full items-center justify-center p-8 text-sm text-muted-foreground gap-2">
            <RefreshCw className="size-4 animate-spin" />
            Loading market news...
          </div>
        ) : articles.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center p-8 text-center text-muted-foreground gap-2">
            <Newspaper className="size-8 opacity-40" />
            <p className="text-sm">No recent news available.</p>
            <Button variant="ghost" size="sm" onClick={handleSync} disabled={syncing}>
              Fetch Latest News
            </Button>
          </div>
        ) : (
          <ScrollArea className="h-full flex-1">
            <div className="divide-y divide-hairline/70">
              {articles.map((article) => {
                const tickers = parseTickers(article.mentionedTickersJson);
                const dividendArticle = isDividendArticle(article);
                const paymentDateText = extractPaymentDateText(article);

                return (
                  <article
                    key={article.id}
                    className="group p-4 transition-colors hover:bg-muted/30"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          {getSentimentBadge(article.sentiment)}
                          {dividendArticle && (
                            <Badge
                              variant="outline"
                              className="text-[10px] border-primary/40 bg-primary/10 text-primary px-1.5 py-0"
                            >
                              Dividend
                            </Badge>
                          )}
                          {paymentDateText && (
                            <Badge
                              variant="outline"
                              className="text-[10px] border-amber-400/40 bg-amber-500/10 text-amber-300 px-1.5 py-0 gap-1"
                            >
                              <CalendarDays className="size-3" /> Payment: {paymentDateText}
                            </Badge>
                          )}
                          <span className="label-caps">{getCategoryLabel(article.marketCategory)}</span>
                          <span className="text-[10px] text-muted-foreground/80">
                            {article.source} · {formatRelativeTime(article.publishedAt)}
                          </span>
                        </div>

                        <a
                          href={article.originalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block font-display text-sm font-semibold leading-snug text-foreground group-hover:text-primary transition-colors"
                        >
                          <span className="flex items-start gap-1.5">
                            <span className="min-w-0 flex-1">{article.title}</span>
                            <ExternalLink className="size-3 shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </span>
                        </a>

                        {article.summary && (
                          <p className="text-xs text-muted-foreground/90 leading-relaxed">
                            <span className="inline-flex items-center gap-1 font-semibold text-primary/90 text-[11px]">
                              <Sparkles className="size-3 text-accent" /> AI Insights:
                            </span>{" "}
                            {article.summary}
                          </p>
                        )}

                        {article.validationReasoning && (
                          <details className="mt-2 text-[11px] border-l-2 border-accent/60 bg-accent/5 p-2 rounded-r">
                            <summary className="font-mono font-medium text-accent hover:underline cursor-pointer select-none flex items-center gap-1 text-[10px]">
                              <Sparkles className="size-3 text-accent" /> AI Decision Reasoning
                            </summary>
                            <p className="mt-1.5 text-muted-foreground leading-relaxed font-sans text-xs">
                              {article.validationReasoning}
                            </p>
                          </details>
                        )}

                        {tickers.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                            {tickers.map((t) => (
                              <Badge
                                key={t}
                                variant="secondary"
                                className="text-[10px] bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 cursor-pointer"
                              >
                                ${t}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
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
