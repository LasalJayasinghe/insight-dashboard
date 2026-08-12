import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  delta?: number;
  hint?: string;
  icon: LucideIcon;
  accent?: "primary" | "success" | "destructive";
}

export function StatCard({
  label,
  value,
  delta,
  hint,
  icon: Icon,
  accent = "primary",
}: StatCardProps) {
  const positive = (delta ?? 0) >= 0;
  const accentBg =
    accent === "success"
      ? "bg-success/10 text-success"
      : accent === "destructive"
        ? "bg-destructive/10 text-destructive"
        : "bg-primary/15 text-primary";

  return (
    <Card className="p-5 gradient-card border-border shadow-card hover:shadow-elegant transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
            {label}
          </p>
          <p className="mt-2 text-2xl md:text-3xl font-semibold tabular tracking-tight">{value}</p>
        </div>
        <div className={cn("size-10 rounded-xl flex items-center justify-center", accentBg)}>
          <Icon className="size-5" />
        </div>
      </div>
      {(delta !== undefined || hint) && (
        <div className="mt-4 flex items-center gap-2 text-sm">
          {delta !== undefined && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md font-medium tabular text-xs",
                positive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive",
              )}
            >
              {positive ? (
                <ArrowUpRight className="size-3" />
              ) : (
                <ArrowDownRight className="size-3" />
              )}
              {Math.abs(delta).toFixed(2)}%
            </span>
          )}
          {hint && <span className="text-muted-foreground text-xs">{hint}</span>}
        </div>
      )}
    </Card>
  );
}
