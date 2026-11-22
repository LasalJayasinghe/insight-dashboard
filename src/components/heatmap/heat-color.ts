/** Diverging colour: destructive (≤-5%) → muted (0) → success (≥+5%). Uses theme tokens. */
export const HEAT_CLAMP = 5;
export function heatStyle(pct: number): { background: string } {
  const t = Math.max(-1, Math.min(1, pct / HEAT_CLAMP));
  const mix = Math.round(Math.abs(t) * 100);
  const token = t >= 0 ? "var(--success)" : "var(--destructive)";
  return { background: `color-mix(in oklch, ${token} ${mix}%, var(--muted))` };
}
