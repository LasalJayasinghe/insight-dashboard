import { Card } from "@/components/ui/card";

interface Props {
  indicators: Record<string, number>;
}

/** Live indicator values reported by the strategy (EMA, RSI, bands, imbalance, funding…). */
export function IndicatorsPanel({ indicators }: Props) {
  return (
    <Card className="gradient-card border-border shadow-card p-5">
      <h3 className="font-semibold tracking-tight">Live Indicators</h3>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {Object.entries(indicators).map(([name, value]) => (
          <div
            key={name}
            className="flex items-center justify-between gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2"
          >
            <span className="text-xs text-muted-foreground truncate">{name}</span>
            <span className="text-sm font-semibold tabular">
              {value.toLocaleString(undefined, { maximumFractionDigits: 4 })}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
