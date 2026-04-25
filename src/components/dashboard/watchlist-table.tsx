import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { mockStocks, type Stock } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

function fmtVol(v: number) {
  if (v >= 1e9) return (v / 1e9).toFixed(2) + "B";
  if (v >= 1e6) return (v / 1e6).toFixed(2) + "M";
  if (v >= 1e3) return (v / 1e3).toFixed(1) + "K";
  return v.toString();
}

export function WatchlistTable({ stocks = mockStocks }: { stocks?: Stock[] }) {
  return (
    <Card className="gradient-card border-border shadow-card">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base font-semibold">Watchlist</CardTitle>
        <Button size="sm" variant="ghost" className="text-xs text-muted-foreground hover:text-foreground">
          View all
        </Button>
      </CardHeader>
      <CardContent className="px-0 pb-2">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-xs uppercase tracking-wider">Symbol</TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-right">Price</TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-right">Change</TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-right hidden md:table-cell">Volume</TableHead>
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
                  <TableCell className="text-right tabular font-medium">${s.price.toFixed(2)}</TableCell>
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
                  <TableCell className="text-right tabular text-muted-foreground hidden md:table-cell">
                    {fmtVol(s.volume)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
