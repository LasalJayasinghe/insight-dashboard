import { cn } from "@/lib/utils";
import type { HoldingSignalsDto } from "@/services/portfolio-service";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type Tone = "up" | "down" | "warn" | "info";

const TONE: Record<Tone, string> = {
  up: "bg-emerald-500/10 text-emerald-500 border-emerald-500/25",
  down: "bg-red-500/10 text-red-500 border-red-500/25",
  warn: "bg-amber-500/10 text-amber-500 border-amber-500/25",
  info: "bg-sky-500/10 text-sky-500 border-sky-500/25",
};

interface Badge {
  label: string;
  tone: Tone;
  hint: string;
}

/** Turns server-side signals into short badges. Rule-based, from real CSE daily prices. */
function signalBadges(s: HoldingSignalsDto | undefined): Badge[] {
  if (!s || s.sessions === 0) return [];
  const out: Badge[] = [];

  if (s.trend === "UPTREND")
    out.push({
      label: "Uptrend",
      tone: "up",
      hint: "Price above its 50-day average, 50-day ≥ 200-day.",
    });
  else if (s.trend === "DOWNTREND")
    out.push({
      label: "Downtrend",
      tone: "down",
      hint: "Price below its 50-day average, 50-day ≤ 200-day.",
    });

  if (s.rsiState === "OVERBOUGHT")
    out.push({
      label: `RSI ${s.rsi14?.toFixed(0)}`,
      tone: "warn",
      hint: "RSI(14) ≥ 70: overbought.",
    });
  else if (s.rsiState === "OVERSOLD")
    out.push({
      label: `RSI ${s.rsi14?.toFixed(0)}`,
      tone: "info",
      hint: "RSI(14) ≤ 30: oversold.",
    });

  if (s.nearHigh52w)
    out.push({
      label: "52W high",
      tone: "up",
      hint: `Within 5% of the 52-week high (${s.high52w}).`,
    });
  if (s.nearLow52w)
    out.push({
      label: "52W low",
      tone: "down",
      hint: `Within 5% of the 52-week low (${s.low52w}).`,
    });

  if (s.volumeSpike && s.volumeRatio)
    out.push({
      label: `Vol ${s.volumeRatio.toFixed(1)}×`,
      tone: "info",
      hint: "Last session's volume vs its 20-session average.",
    });

  return out;
}

export function SignalBadges({
  signals,
  className,
}: {
  signals: HoldingSignalsDto | undefined;
  className?: string;
}) {
  const badges = signalBadges(signals);
  if (badges.length === 0) return <span className="text-xs text-muted-foreground">—</span>;

  return (
    <TooltipProvider delayDuration={150}>
      <div className={cn("flex flex-wrap gap-1", className)}>
        {badges.map((b) => (
          <Tooltip key={b.label}>
            <TooltipTrigger asChild>
              <span
                className={cn(
                  "inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-semibold whitespace-nowrap",
                  TONE[b.tone],
                )}
              >
                {b.label}
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs text-xs">
              {b.hint}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}
