import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowDownRight, ArrowUpRight, Trash2 } from "lucide-react";
import { mockStocks, type Stock } from "@/lib/mock-data";
import { formatRs } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SkeletonRows } from "@/components/ui/skeleton";

interface WatchlistTableProps {
  stocks?: Stock[];
  loading?: boolean;
  onSelectStock?: (symbol: string) => void;
  onRemoveStock?: (symbol: string) => void;
}

export function WatchlistTable({
  stocks = mockStocks,
  loading = false,
  onSelectStock,
  onRemoveStock,
}: WatchlistTableProps) {
  if (loading) {
    return (
      <Card className="gradient-card border-border shadow-card h-105">
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-semibold">Watchlist</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <SkeletonRows rows={6} />
        </CardContent>
      </Card>
    );
  }

  if (stocks.length === 0) {
    return (
      <Card className="gradient-card border-border shadow-card h-105">
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-semibold">Watchlist</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No stocks in your watchlist.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="gradient-card border-border shadow-card h-105 flex flex-col">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-base font-semibold">Watchlist</CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">Your saved & tracked stocks</p>
        </div>
        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-muted/80 text-muted-foreground font-medium border border-border/40">
          {stocks.length} Saved
        </span>
      </CardHeader>
      <CardContent className="p-0 flex-1 min-h-0">
        <ScrollArea className="h-85">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-xs uppercase tracking-wider">Symbol</TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-right">Price</TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-right">
                  Change
                </TableHead>
                {onRemoveStock && <TableHead className="w-12"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {stocks.map((s) => {
                const up = s.changePct >= 0;
                return (
                  <TableRow
                    key={s.symbol}
                    onClick={() => onSelectStock?.(s.symbol)}
                    className={cn(
                      "border-border/60 hover:bg-muted/40 transition-colors group",
                      onSelectStock && "cursor-pointer",
                    )}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold tracking-tight shrink-0 font-mono">
                          {s.symbol.slice(0, 2)}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-xs font-mono group-hover:text-primary transition-colors flex items-center gap-1">
                            {s.symbol}
                          </div>
                          <div className="text-[11px] text-muted-foreground truncate max-w-[140px]">
                            {s.name}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular font-mono font-bold text-xs">
                      {formatRs(s.price)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={cn(
                          "inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-xs font-bold font-mono tabular",
                          up ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400",
                        )}
                      >
                        {up ? (
                          <ArrowUpRight className="size-3" />
                        ) : (
                          <ArrowDownRight className="size-3" />
                        )}
                        {s.changePct >= 0 ? "+" : ""}
                        {s.changePct.toFixed(2)}%
                      </span>
                    </TableCell>
                    {onRemoveStock && (
                      <TableCell className="text-right w-12">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveStock(s.symbol);
                          }}
                          className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors inline-flex items-center justify-center"
                          title="Remove from watchlist"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
