import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Editorial "Paper & Ink" primitives.
 * Panels are grid cells sharing hairline edges — not floating cards.
 */

export function Bento({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("bento", className)}>{children}</div>;
}

export function Cell({
  className,
  children,
  ink = false,
  as: As = "div",
  ...props
}: {
  className?: string;
  children: ReactNode;
  ink?: boolean;
  as?: any;
  [key: string]: any;
}) {
  return (
    <As className={cn(ink ? "bento-cell-ink" : "bento-cell", "p-5", className)} {...props}>
      {children}
    </As>
  );
}

export function CellLabel({
  children,
  index,
  className,
}: {
  children: ReactNode;
  index?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-baseline justify-between gap-3", className)}>
      <span className="label-caps">{children}</span>
      {index && <span className="label-caps opacity-50">{index}</span>}
    </div>
  );
}

export function Figure({
  value,
  className,
  size = "lg",
}: {
  value: ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const sizes = {
    sm: "text-xl",
    md: "text-3xl",
    lg: "text-4xl",
    xl: "text-5xl md:text-6xl",
  };
  return <div className={cn("figure-xl", sizes[size], className)}>{value}</div>;
}

export function Delta({ value, suffix = "%" }: { value: number; suffix?: string }) {
  const up = value >= 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-mono text-xs font-semibold tabular-nums",
        up ? "text-success" : "text-destructive",
      )}
    >
      <span aria-hidden>{up ? "▲" : "▼"}</span>
      {up ? "+" : ""}
      {value.toFixed(2)}
      {suffix}
    </span>
  );
}

/** Page masthead — newspaper-style title block with a rule under it. */
export function Masthead({
  eyebrow,
  title,
  meta,
  actions,
}: {
  eyebrow: string;
  title: string;
  meta?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4 border-b border-hairline pb-5">
      <div className="min-w-0">
        <span className="label-caps">{eyebrow}</span>
        <h1 className="mt-2 truncate font-display text-3xl font-bold md:text-[2.6rem]">{title}</h1>
        {meta && <div className="mt-2 text-sm text-muted-foreground">{meta}</div>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}
