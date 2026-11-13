// Technical indicators computed from real CSE price history (no randomness, no "AI").

export interface PricePoint {
  /** Unix seconds (UTC). */
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/** CSE trades in Asia/Colombo (UTC+05:30); charts render UTC, so shift for local labels. */
export const COLOMBO_OFFSET_SECONDS = 5.5 * 60 * 60;

/** "YYYY-MM-DD" trading date in Colombo time. */
export function colomboDate(time: number): string {
  return new Date((time + COLOMBO_OFFSET_SECONDS) * 1000).toISOString().slice(0, 10);
}

/** EMA seeded with the SMA of the first `period` values; null until seeded. */
export function emaSeries(values: number[], period: number): (number | null)[] {
  const out: (number | null)[] = [];
  const k = 2 / (period + 1);
  let ema: number | null = null;
  let sum = 0;
  values.forEach((v, i) => {
    if (i < period) {
      sum += v;
      if (i === period - 1) ema = sum / period;
    } else if (ema !== null) {
      ema = (v - ema) * k + ema;
    }
    out.push(ema);
  });
  return out;
}

/** Wilder's RSI; null until `period` changes are available. */
export function rsiSeries(values: number[], period = 14): (number | null)[] {
  const out: (number | null)[] = [null];
  let avgGain = 0;
  let avgLoss = 0;
  for (let i = 1; i < values.length; i++) {
    const change = values[i] - values[i - 1];
    const gain = Math.max(change, 0);
    const loss = Math.max(-change, 0);
    if (i <= period) {
      avgGain += gain;
      avgLoss += loss;
      if (i === period) {
        avgGain /= period;
        avgLoss /= period;
      }
    } else {
      avgGain = (avgGain * (period - 1) + gain) / period;
      avgLoss = (avgLoss * (period - 1) + loss) / period;
    }
    if (i < period) out.push(null);
    else out.push(avgLoss === 0 ? (avgGain === 0 ? 50 : 100) : 100 - 100 / (1 + avgGain / avgLoss));
  }
  return out;
}

function sma(values: number[], period: number): number | null {
  if (values.length < period) return null;
  return values.slice(-period).reduce((a, b) => a + b, 0) / period;
}

function returnOver(closes: number[], bars: number): number | null {
  if (closes.length <= bars) return null;
  const past = closes[closes.length - 1 - bars];
  return past > 0 ? (closes[closes.length - 1] / past - 1) * 100 : null;
}

export type Trend = "UPTREND" | "DOWNTREND" | "MIXED" | "INSUFFICIENT_DATA";

export interface TechnicalSummary {
  lastClose: number;
  sma50: number | null;
  sma200: number | null;
  trend: Trend;
  high52w: number;
  low52w: number;
  /** 0 = at the 52-week low, 100 = at the 52-week high. */
  rangePosition: number;
  return1m: number | null;
  return3m: number | null;
  rsi14: number | null;
  /** Latest session volume ÷ the 20 sessions before it. */
  volumeRatio: number | null;
  /** Average absolute daily % move over the last 20 sessions. */
  avgDailyMove: number | null;
  sessions: number;
}

/** Summarises daily history (oldest first). Returns null when there is no data. */
export function summarize(points: PricePoint[]): TechnicalSummary | null {
  if (points.length === 0) return null;
  const closes = points.map((p) => p.close);
  const last = closes[closes.length - 1];
  const sma50 = sma(closes, 50);
  const sma200 = sma(closes, 200);

  // Trend from price vs the 50-day average, confirmed by the 50 vs 200-day averages.
  let trend: Trend = "INSUFFICIENT_DATA";
  if (sma50 !== null) {
    const longRef = sma200 ?? sma50;
    if (last > sma50 && sma50 >= longRef) trend = "UPTREND";
    else if (last < sma50 && sma50 <= longRef) trend = "DOWNTREND";
    else trend = "MIXED";
  }

  const high52w = Math.max(...points.map((p) => p.high));
  const low52w = Math.min(...points.map((p) => p.low));
  const rangePosition = high52w > low52w ? ((last - low52w) / (high52w - low52w)) * 100 : 50;

  const rsi = rsiSeries(closes, 14);
  const vols = points.map((p) => p.volume);
  const avgVol20 = vols.length > 20 ? vols.slice(-21, -1).reduce((a, b) => a + b, 0) / 20 : null;

  const recent = closes.slice(-21);
  const moves: number[] = [];
  for (let i = 1; i < recent.length; i++) {
    if (recent[i - 1] > 0) moves.push(Math.abs(recent[i] / recent[i - 1] - 1) * 100);
  }

  return {
    lastClose: last,
    sma50,
    sma200,
    trend,
    high52w,
    low52w,
    rangePosition,
    return1m: returnOver(closes, 21),
    return3m: returnOver(closes, 63),
    rsi14: rsi[rsi.length - 1],
    volumeRatio: avgVol20 && avgVol20 > 0 ? vols[vols.length - 1] / avgVol20 : null,
    avgDailyMove: moves.length ? moves.reduce((a, b) => a + b, 0) / moves.length : null,
    sessions: points.length,
  };
}
