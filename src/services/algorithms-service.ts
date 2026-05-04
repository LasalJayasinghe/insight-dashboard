// API service for Binance trading algorithms.
// Toggle USE_MOCK to false once the .NET backend is wired up.

import type {
  Algorithm,
  AlgorithmDetail,
  Signal,
  Trade,
} from "@/lib/algorithm-types";

const BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "/api";
const USE_MOCK = true;
const delay = (ms = 350) => new Promise((r) => setTimeout(r, ms));

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json() as Promise<T>;
}

// ---------- Mock data ----------
const algos: Algorithm[] = [
  {
    id: "ema",
    name: "EMA Strategy",
    description: "Exponential moving average crossover on 1H candles.",
    status: "RUNNING",
    totalPnl: 4821.34,
    totalPnlPct: 18.7,
    winRate: 64.2,
    activeSignals: 3,
    totalTrades: 142,
    currentSignal: "BUY",
    lastUpdated: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
  },
  {
    id: "rsi",
    name: "RSI Breakout",
    description: "RSI divergence with volume confirmation.",
    status: "RUNNING",
    totalPnl: -612.5,
    totalPnlPct: -2.4,
    winRate: 48.1,
    activeSignals: 1,
    totalTrades: 87,
    currentSignal: "SELL",
    lastUpdated: new Date(Date.now() - 1000 * 60 * 7).toISOString(),
  },
];

function buildSignals(algoId: string): Signal[] {
  const pairs = ["BTC/USDT", "ETH/USDT", "SOL/USDT", "BNB/USDT", "XRP/USDT"];
  const types: Signal["signal"][] = ["BUY", "SELL", "HOLD"];
  return pairs.map((pair, i) => ({
    id: `${algoId}-sig-${i}`,
    pair,
    signal: types[(i + (algoId === "rsi" ? 1 : 0)) % 3],
    price: [67234.12, 3421.55, 162.84, 612.4, 0.5821][i],
    confidence: 60 + ((i * 7 + (algoId === "rsi" ? 3 : 11)) % 35),
    time: new Date(Date.now() - 1000 * 60 * (i * 8 + 3)).toISOString(),
  }));
}

function buildHistory(algoId: string): Trade[] {
  return Array.from({ length: 8 }).map((_, i) => {
    const win = (i + (algoId === "rsi" ? 1 : 0)) % 3 !== 0;
    const entry = 100 + i * 12.4;
    const exit = win ? entry * 1.024 : entry * 0.987;
    const pnl = exit - entry;
    return {
      id: `${algoId}-tr-${i}`,
      pair: ["BTC/USDT", "ETH/USDT", "SOL/USDT", "BNB/USDT"][i % 4],
      entryPrice: entry,
      exitPrice: exit,
      pnl,
      pnlPct: (pnl / entry) * 100,
      durationMinutes: 25 + i * 17,
      result: win ? "WIN" : "LOSS",
      closedAt: new Date(Date.now() - 1000 * 60 * 60 * (i + 1)).toISOString(),
    };
  });
}

function buildDetail(algo: Algorithm): AlgorithmDetail {
  return {
    ...algo,
    signals: buildSignals(algo.id),
    trade: {
      entryPrice: algo.id === "ema" ? 67100.0 : 3450.25,
      stopLoss: algo.id === "ema" ? 66250.0 : 3380.0,
      takeProfit: algo.id === "ema" ? 69000.0 : 3620.0,
      strategy:
        algo.id === "ema"
          ? "Long when 9-EMA crosses above 21-EMA with rising volume. Exit on opposite crossover or stop-loss hit."
          : "Short when RSI(14) breaks below 30 after a bearish divergence. Confirmation requires volume spike > 1.5x average.",
    },
    history: buildHistory(algo.id),
  };
}

// ---------- Service ----------
export const algorithmsService = {
  async list(): Promise<Algorithm[]> {
    if (USE_MOCK) {
      await delay();
      return [...algos];
    }
    return request<Algorithm[]>("/algorithms");
  },

  async get(id: string): Promise<AlgorithmDetail> {
    if (USE_MOCK) {
      await delay();
      const algo = algos.find((a) => a.id === id);
      if (!algo) throw new Error("Algorithm not found");
      return buildDetail(algo);
    }
    return request<AlgorithmDetail>(`/algorithms/${id}`);
  },

  async toggle(id: string): Promise<Algorithm> {
    if (USE_MOCK) {
      await delay(200);
      const algo = algos.find((a) => a.id === id);
      if (!algo) throw new Error("Algorithm not found");
      algo.status = algo.status === "RUNNING" ? "STOPPED" : "RUNNING";
      algo.lastUpdated = new Date().toISOString();
      return { ...algo };
    }
    return request<Algorithm>(`/algorithms/${id}/toggle`, { method: "POST" });
  },
};
