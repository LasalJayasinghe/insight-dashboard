import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Coins } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SkeletonRows } from "@/components/ui/skeleton";
import { formatRs } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { DividendItem } from "@/services/dividend-service";

interface UpcomingDividendsProps {
  items: DividendItem[];
  loading?: boolean;
  onSelectStock?: (symbol: string) => void;
}

/** CSE symbols arrive as `ABAN.N0000` – the base ticker is what the rest of the app uses. */
function baseSymbol(symbol: string): string {
  return (symbol || "").split(".")[0].toUpperCase();
}

function formatDate(value?: string | null): string {
  if (!value) return "-";

  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return value;

  return dt.toLocaleDateString(undefined, { day: "2-digit", month: "short" });
}

function daysUntil(value?: string | null): number | null {
  if (!value) return null;

  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return null;

  const start = new Date();
  start.setHours(0, 0, 0, 0);
  dt.setHours(0, 0, 0, 0);

  return Math.round((dt.getTime() - start.getTime()) / 86_400_000);
}

function CountdownBadge({ recordDate }: { recordDate: string }) {
  const days = daysUntil(recordDate);
  if (days === null) return null;

  const urgent = days <= 3;
  const label = days <= 0 ? "Today" : days === 1 ? "1d" : `${days}d`;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[11px] font-bold font-mono tabular",
        urgent ? "bg-amber-500/10 text-amber-400" : "bg-primary/10 text-primary",
      )}
    >
      <CalendarDays className="size-3" />
      {formatDate(recordDate)} · {label}
    </span>
  );
}

function UpcomingDividendsHeader({ count }: { count?: number }) {
  return (
    <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
      <div>
        <CardTitle className="text-base font-semibold flex items-center gap-1.5">
          <Coins className="size-4 text-primary" />
          Upcoming Dividends
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-0.5">Announced payouts by record date</p>
      </div>
      {count !== undefined && count > 0 && (
        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-muted/80 text-muted-foreground font-medium border border-border/40">
          {count} Upcoming
        </span>
      )}
    </CardHeader>
  );
}

export function UpcomingDividends({
  items,
  loading = false,
  onSelectStock,
}: UpcomingDividendsProps) {
  if (loading) {
    return (
      <Card className="gradient-card border-border shadow-card h-105">
        <UpcomingDividendsHeader />
        <CardContent className="p-0">
          <SkeletonRows rows={6} />
        </CardContent>
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <Card className="gradient-card border-border shadow-card h-105">
        <UpcomingDividendsHeader />
        <CardContent>
          <p className="text-sm text-muted-foreground">No upcoming dividends announced.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="gradient-card border-border shadow-card h-105 flex flex-col">
      <UpcomingDividendsHeader count={items.length} />
      <CardContent className="p-0 flex-1 min-h-0">
        <ScrollArea className="h-85 px-6 pb-6">
          <div className="space-y-2.5">
            {items.map((d) => {
              const symbol = baseSymbol(d.symbol);
              const dps = d.votingDivPerShare || d.nonVotingDivPerShare;

              return (
                <div
                  key={d.id}
                  onClick={() => onSelectStock?.(symbol)}
                  className={cn(
                    "p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-all duration-200 flex items-center justify-between gap-3 border border-border/20 group",
                    onSelectStock && "cursor-pointer hover:border-primary/40",
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold tracking-tight shrink-0 font-mono">
                      {symbol.slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-xs font-mono group-hover:text-primary transition-colors">
                        {symbol}
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate max-w-[140px]">
                        {d.companyName}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-xs font-bold font-mono tabular text-foreground">
                      {formatRs(dps, dps > 0 && dps < 1 ? 4 : 2)}
                    </span>
                    <CountdownBadge recordDate={d.recordDate} />
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
