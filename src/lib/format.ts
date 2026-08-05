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
