import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Trade } from "@/lib/algorithm-types";
import { formatDuration, formatPct, formatUsd } from "@/lib/format";

interface Props {
  history: Trade[];
}

export function TradeHistory({ history }: Props) {
  return (
    <Card className="gradient-card border-border shadow-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="font-semibold tracking-tight">Trade History</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Last {history.length} closed positions
          </p>
        </div>
      </div>
      {history.length === 0 ? (
        <div className="p-10 text-center text-sm text-muted-foreground">No closed trades yet</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Pair</TableHead>
              <TableHead className="text-right">Entry</TableHead>
              <TableHead className="text-right">Exit</TableHead>
              <TableHead className="text-right">P/L</TableHead>
              <TableHead className="text-right">Duration</TableHead>
              <TableHead className="text-right">Result</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.map((t) => {
              const win = t.result === "WIN";
              return (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.pair}</TableCell>
                  <TableCell className="text-right tabular">{formatUsd(t.entryPrice)}</TableCell>
                  <TableCell className="text-right tabular">{formatUsd(t.exitPrice)}</TableCell>
                  <TableCell
                    className={cn(
                      "text-right tabular font-medium",
                      win ? "text-success" : "text-destructive",
                    )}
                  >
                    {formatUsd(t.pnl)}{" "}
                    <span className="text-xs opacity-80">({formatPct(t.pnlPct)})</span>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground text-xs">
                    {formatDuration(t.durationMinutes)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant="outline"
                      className={cn(
                        "font-semibold",
                        win
                          ? "bg-success/10 text-success border-success/20"
                          : "bg-destructive/10 text-destructive border-destructive/20",
                      )}
                    >
                      {t.result}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </Card>
  );
}
