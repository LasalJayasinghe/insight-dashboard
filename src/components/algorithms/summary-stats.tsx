import { type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface SummaryStat {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  tone?: "success" | "destructive" | "warning" | "primary";
}

const toneStyles = {
  success: "bg-success/10 text-success",
  destructive: "bg-destructive/10 text-destructive",
  warning: "bg-warning/10 text-warning",
  primary: "bg-primary/15 text-primary",
} as const;

export function SummaryStats({ stats }: { stats: SummaryStat[] }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((s) => (
        <Card key={s.label} className="p-4 gradient-card border-border shadow-card">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                {s.label}
              </p>
              <p className="mt-1.5 text-xl font-semibold tabular tracking-tight truncate">
                {s.value}
              </p>
              {s.hint && <p className="mt-0.5 text-[11px] text-muted-foreground">{s.hint}</p>}
            </div>
            <div
              className={cn(
                "size-9 rounded-lg flex items-center justify-center shrink-0",
                toneStyles[s.tone ?? "primary"],
              )}
            >
              <s.icon className="size-4" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
