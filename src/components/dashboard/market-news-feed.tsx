import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ExternalLink, Newspaper, RefreshCw, TrendingUp, TrendingDown, Minus, Sparkles, Filter } from "lucide-react";
import { newsService, type NewsArticle } from "@/services/news-service";
import { cn } from "@/lib/utils";

interface MarketNewsFeedProps {
  defaultCategory?: string;
  symbolFilter?: string;
  title?: string;
  className?: string;
  maxHeight?: string;
}

export function MarketNewsFeed({
  defaultCategory = "ALL",
  symbolFilter,
  title = "Market Intelligence & News",
  className,
  maxHeight = "h-[500px]"
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
        setArticles(data);
      } else {
        const data = await newsService.getNews(activeCategory, undefined, 20, 1);
        setArticles(data.items || []);
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
        <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 gap-1 text-[11px] font-medium px-2 py-0.5">
          <TrendingUp className="size-3" /> Bullish
        </Badge>
      );
    }
    if (s === "BEARISH") {
      return (
        <Badge className="bg-rose-500/15 text-rose-400 border-rose-500/30 gap-1 text-[11px] font-medium px-2 py-0.5">
          <TrendingDown className="size-3" /> Bearish
        </Badge>
      );
    }
    return (
      <Badge className="bg-slate-500/15 text-slate-400 border-slate-500/30 gap-1 text-[11px] font-medium px-2 py-0.5">
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
    <Card className={cn("border-border/60 bg-card/50 backdrop-blur-sm flex flex-col", className)}>
      <CardHeader className="pb-3 border-b border-border/40">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Newspaper className="size-4 text-primary" />
            <CardTitle className="text-base font-semibold">{title}</CardTitle>
          </div>

          <div className="flex items-center gap-2">
            {!symbolFilter && (
              <div className="flex items-center bg-muted/50 p-1 rounded-lg border border-border/40 text-xs">
                {[
                  { id: "ALL", label: "All" },
                  { id: "CSE_STOCKS", label: "CSE Stocks" },
                  { id: "GLOBAL_CRYPTO", label: "Crypto" },
                  { id: "GLOBAL_BUSINESS", label: "Global" }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveCategory(tab.id)}
                    className={cn(
                      "px-2.5 py-1 rounded-md transition-all font-medium",
                      activeCategory === tab.id
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            )}

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={handleSync}
              disabled={syncing}
              title="Sync latest market news"
            >
              <RefreshCw className={cn("size-3.5", syncing && "animate-spin")} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 flex-1 min-h-0">
        {loading ? (
          <div className="flex items-center justify-center p-8 text-sm text-muted-foreground gap-2">
            <RefreshCw className="size-4 animate-spin" />
            Loading market news...
          </div>
        ) : articles.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground gap-2">
            <Newspaper className="size-8 opacity-40" />
            <p className="text-sm">No recent news available.</p>
            <Button variant="ghost" size="sm" onClick={handleSync} disabled={syncing}>
              Fetch Latest News
            </Button>
          </div>
        ) : (
          <ScrollArea className={cn("px-4 py-2", maxHeight)}>
            <div className="space-y-3.5 py-2">
              {articles.map((article) => {
                const tickers = parseTickers(article.mentionedTickersJson);

                return (
                  <div
                    key={article.id}
                    className="p-3.5 rounded-xl border border-border/40 bg-muted/20 hover:bg-muted/40 transition-colors space-y-2 group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {getSentimentBadge(article.sentiment)}
                          <Badge variant="outline" className="text-[10px] text-muted-foreground px-1.5 py-0">
                            {getCategoryLabel(article.marketCategory)}
                          </Badge>
                          <span className="text-[11px] text-muted-foreground/80">
                            {article.source} • {formatRelativeTime(article.publishedAt)}
                          </span>
                        </div>

                        <a
                          href={article.originalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-sm text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5 leading-snug"
                        >
                          {article.title}
                          <ExternalLink className="size-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </a>
                      </div>
                    </div>

                    {article.summary && (
                      <p className="text-xs text-muted-foreground/90 leading-relaxed bg-background/40 p-2.5 rounded-lg border border-border/20">
                        <span className="font-semibold text-primary/90 flex items-center gap-1 mb-0.5 text-[11px]">
                          <Sparkles className="size-3 inline text-amber-400" /> AI Insights:
                        </span>
                        {article.summary}
                      </p>
                    )}

                    {tickers.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap pt-1">
                        <span className="text-[10px] text-muted-foreground uppercase font-semibold">Tickers:</span>
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
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
