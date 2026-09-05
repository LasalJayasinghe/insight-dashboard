export const formatUsd = (n: number, fractionDigits = 2) =>
  `${n < 0 ? "-" : ""}$${Math.abs(n).toLocaleString(undefined, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })}`;

export const formatRs = (n: number, fractionDigits = 2) =>
  `${n < 0 ? "-" : ""}Rs. ${Math.abs(n).toLocaleString(undefined, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })}`;

export const formatChange = (n: number, fractionDigits = 2) =>
  `${n >= 0 ? "+" : ""}${formatRs(n, fractionDigits)}`;

export const formatPct = (n: number, fractionDigits = 2) =>
  `${n >= 0 ? "+" : ""}${n.toFixed(fractionDigits)}%`;

export const formatUtcToLocalTime = (iso: string | undefined | null) => {
  if (!iso) return "";
  const utcIso = iso.endsWith("Z") || iso.includes("+") ? iso : `${iso}Z`;
  const date = new Date(utcIso);
  if (isNaN(date.getTime())) return iso;

  return date.toLocaleTimeString("en-US", {
    timeZone: "Asia/Colombo",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatRelative = (iso: string) => {
  if (!iso) return "";
  const utcIso = iso.endsWith("Z") || iso.includes("+") ? iso : `${iso}Z`;
  const diff = Date.now() - new Date(utcIso).getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return `${d}d ago`;
};

export const formatDuration = (mins: number) => {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
};

/**
 * Parses a bare `yyyy-MM-dd` calendar date into a local Date at midnight.
 *
 * `new Date("2026-09-09")` is parsed by the browser as UTC midnight, which renders as the
 * previous day for any viewer behind UTC. Building the Date from its parts keeps a calendar
 * date on the calendar day it names, in every time zone.
 */
export const parseCalendarDate = (value?: string | null): Date | null => {
  if (!value) return null;

  const parts = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (parts) {
    return new Date(Number(parts[1]), Number(parts[2]) - 1, Number(parts[3]));
  }

  const fallback = new Date(value);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
};

/** Formats a `yyyy-MM-dd` calendar date, falling back to the raw text when unparseable. */
export const formatCalendarDate = (
  value?: string | null,
  options: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short" },
): string => {
  const date = parseCalendarDate(value);
  if (!date) return value?.trim() || "-";

  return date.toLocaleDateString(undefined, options);
};

/** Whole days from today to the given calendar date; negative once it has passed. */
export const daysUntilCalendarDate = (value?: string | null): number | null => {
  const date = parseCalendarDate(value);
  if (!date) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return Math.round((date.getTime() - today.getTime()) / 86_400_000);
};

/** Strips the CSE class suffix: `CSLK.N0000` becomes `CSLK`. */
export const baseSymbol = (symbol?: string | null): string =>
  (symbol ?? "").split(".")[0].toUpperCase();
