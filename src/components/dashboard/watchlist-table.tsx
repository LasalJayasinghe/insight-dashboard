import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { mockStocks, type Stock } from "@/lib/mock-data";
import { formatRs } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

export function WatchlistTable({ stocks = mockStocks, loading = false }: { stocks?: Stock[]; loading?: boolean }) {
  if (loading) {
    return (
      <Card className="gradient-card border-border shadow-card h-105">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base font-semibold">Watchlist</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading watchlist...</p>
        </CardContent>
      </Card>
    );
  }

  if (stocks.length === 0) {
    return (
      <Card className="gradient-card border-border shadow-card h-105">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base font-semibold">Watchlist</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No stocks in your watchlist.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="gradient-card border-border shadow-card h-105">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base font-semibold">Watchlist</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-85">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-xs uppercase tracking-wider">Symbol</TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-right">Price</TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-right">Change</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stocks.map((s) => {
              const up = s.changePct >= 0;
              return (
                <TableRow key={s.symbol} className="border-border/60 hover:bg-muted/30 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="size-9 rounded-lg bg-muted/60 flex items-center justify-center text-xs font-bold tracking-tight">
                        {s.symbol.slice(0, 2)}
                      </div>
                      <div>
                        <div className="font-semibold text-sm">{s.symbol}</div>
                        <div className="text-xs text-muted-foreground">{s.name}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular font-medium">{formatRs(s.price)}</TableCell>
                  <TableCell className="text-right">
                    <span
                      className={cn(
                        "inline-flex items-center gap-0.5 px-2 py-1 rounded-md text-xs font-semibold tabular",
                        up ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive",
                      )}
                    >
                      {up ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                      {Math.abs(s.changePct).toFixed(2)}%
                    </span>
                  </TableCell>
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
