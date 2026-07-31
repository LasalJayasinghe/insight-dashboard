import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { formatRs } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { IntradayPoint } from "@/services/stocks-service";
import { ScrollArea } from "@/components/ui/scroll-area";

export function IntradayStocks({ items, loading = false }: { items: IntradayPoint[]; loading?: boolean }) {
  if (loading) {
    return (
      <Card className="gradient-card border-border shadow-card h-105">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Intraday Stocks</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading intraday stocks...</p>
        </CardContent>
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <Card className="gradient-card border-border shadow-card h-105">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Intraday Stocks</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No intraday stock data available.</p>
        </CardContent>
      </Card>
    );
  }

  const sortedItems = [...items].sort((a, b) => Math.abs(b.percentage) - Math.abs(a.percentage));

  return (
    <Card className="gradient-card border-border shadow-card h-105">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Intraday Stocks</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-85 px-6 pb-6">
          <div className="space-y-3">
            {sortedItems.map((s) => {
              const up = s.percentage >= 0;
              return (
                <div key={s.symbol} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={cn(
                        "size-8 rounded-md flex items-center justify-center shrink-0",
                        up ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive",
                      )}
                    >
                      {up ? <ArrowUpRight className="size-4" /> : <ArrowDownRight className="size-4" />}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold truncate">{s.symbol}</div>
                      <div className="text-xs text-muted-foreground">{formatRs(s.price)}</div>
                    </div>
                  </div>
                  <div
                    className={cn(
                      "text-sm font-semibold tabular",
                      up ? "text-success" : "text-destructive",
                    )}
                  >
                    {s.percentage >= 0 ? "+" : ""}
                    {s.percentage.toFixed(2)}%
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
