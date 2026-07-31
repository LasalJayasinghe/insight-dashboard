// Renders the alerts as a table with edit/delete actions.
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { formatRs } from "@/lib/format";
import type { StockAlert } from "@/lib/types";

interface Props {
  alerts: StockAlert[];
  onEdit: (alert: StockAlert) => void;
  onDelete: (alert: StockAlert) => void;
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

const formatPrice = (n: number) => formatRs(n);

export function AlertsTable({ alerts, onEdit, onDelete }: Props) {
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead>Symbol</TableHead>
            <TableHead>Alert type</TableHead>
            <TableHead className="text-right">Target price</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {alerts.map((a) => {
            const above = a.type === "ABOVE";
            return (
              <TableRow key={a.id}>
                <TableCell>
                  <span className="font-semibold tracking-wide">{a.symbol}</span>
                </TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center gap-1 text-sm ${above ? "text-success" : "text-destructive"}`}
                  >
                    {above ? <ArrowUp className="size-3.5" /> : <ArrowDown className="size-3.5" />}
                    Price {above ? "above" : "below"}
                  </span>
                </TableCell>
                <TableCell className="text-right font-mono font-semibold">
                  {formatPrice(a.targetPrice)}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={a.status === "ACTIVE" ? "default" : "secondary"}
                    className={a.status === "ACTIVE" ? "bg-success/15 text-success hover:bg-success/20" : ""}
                  >
                    {a.status === "ACTIVE" ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{formatDate(a.createdAt)}</TableCell>
                <TableCell className="text-right">
                  <div className="inline-flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => onEdit(a)} aria-label="Edit alert">
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => onDelete(a)}
                      aria-label="Delete alert"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
