import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mockTransactions } from "@/lib/mock-data";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { formatRs } from "@/lib/format";
import { cn } from "@/lib/utils";

type ActivityItem = {
  id: string;
  type: "BUY" | "SELL";
  symbol: string;
  qty: number;
  price: number;
  at: string;
};

export function RecentActivity({ items = mockTransactions }: { items?: ActivityItem[] }) {
  return (
    <Card className="gradient-card border-border shadow-card h-full">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Recent activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((t) => {
          const buy = t.type === "BUY";
          return (
            <div key={t.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition">
              <div
                className={cn(
                  "size-9 rounded-lg flex items-center justify-center shrink-0",
                  buy ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive",
                )}
              >
                {buy ? <ArrowDownLeft className="size-4" /> : <ArrowUpRight className="size-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold">
                  {t.type} {t.symbol}
                </div>
                <div className="text-xs text-muted-foreground">
                  {t.qty} shares · {t.at}
                </div>
              </div>
              <div className="text-sm font-medium tabular">{formatRs(t.qty * t.price)}</div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
