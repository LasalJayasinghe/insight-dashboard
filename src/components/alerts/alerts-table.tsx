// Renders the alerts as a table with interactive column sorting and edit/delete actions.
import { useState, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { formatRs } from "@/lib/format";
import type { StockAlert } from "@/lib/types";

interface Props {
  alerts: StockAlert[];
  onEdit: (alert: StockAlert) => void;
  onDelete: (alert: StockAlert) => void;
}

type SortField = "symbol" | "type" | "targetPrice";
type SortOrder = "asc" | "desc";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

const formatPrice = (n: number) => formatRs(n);

export function AlertsTable({ alerts, onEdit, onDelete }: Props) {
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const sortedAlerts = useMemo(() => {
    if (!sortField) return alerts;

    return [...alerts].sort((a, b) => {
      let comparison = 0;
      if (sortField === "symbol") {
        comparison = a.symbol.localeCompare(b.symbol);
      } else if (sortField === "type") {
        comparison = a.type.localeCompare(b.type);
      } else if (sortField === "targetPrice") {
        comparison = a.targetPrice - b.targetPrice;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });
  }, [alerts, sortField, sortOrder]);

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="size-3 text-muted-foreground/50 ml-1.5 shrink-0" />;
    }
    return sortOrder === "asc" ? (
      <ArrowUp className="size-3.5 text-primary ml-1.5 shrink-0" />
    ) : (
      <ArrowDown className="size-3.5 text-primary ml-1.5 shrink-0" />
    );
  };

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead>
              <button
                type="button"
                onClick={() => handleSort("symbol")}
                className="flex items-center font-semibold text-foreground hover:text-primary transition-colors cursor-pointer select-none"
              >
                Symbol
                {renderSortIcon("symbol")}
              </button>
            </TableHead>

            <TableHead>
              <button
                type="button"
                onClick={() => handleSort("type")}
                className="flex items-center font-semibold text-foreground hover:text-primary transition-colors cursor-pointer select-none"
              >
                Alert type
                {renderSortIcon("type")}
              </button>
            </TableHead>

            <TableHead className="text-right">
              <button
                type="button"
                onClick={() => handleSort("targetPrice")}
                className="flex items-center justify-end font-semibold text-foreground hover:text-primary transition-colors cursor-pointer select-none ml-auto"
              >
                Target price
                {renderSortIcon("targetPrice")}
              </button>
            </TableHead>

            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedAlerts.map((a) => {
            const above = a.type === "ABOVE";
            return (
              <TableRow key={a.id}>
                <TableCell>
                  <span className="font-semibold tracking-wide font-mono">{a.symbol}</span>
                </TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center gap-1 text-sm ${above ? "text-success font-medium" : "text-destructive font-medium"}`}
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
