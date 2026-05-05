// Domain types for Binance trading algorithms.
// Mirrors the .NET API contract (rename freely to match backend DTOs).

export type AlgorithmStatus = "RUNNING" | "STOPPED";
export type SignalType = "BUY" | "SELL" | "HOLD";
export type TradeResult = "WIN" | "LOSS";

export interface Algorithm {
  id: string;
  name: string;
  description?: string;
  status: AlgorithmStatus;
  totalPnl: number; // absolute PnL (USDT)
  totalPnlPct: number;
  winRate: number; // 0..100
  activeSignals: number;
  totalTrades: number;
  currentSignal: SignalType;
  lastUpdated: string; // ISO
}

export interface Signal {
  id: string;
  pair: string;
  signal: SignalType;
  price: number;
  confidence: number; // 0..100
  time: string; // ISO
}

export interface TradeDetails {
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  strategy: string;
}

export interface Trade {
  id: string;
  pair: string;
  entryPrice: number;
  exitPrice: number;
  pnl: number; // absolute
  pnlPct: number;
  durationMinutes: number;
  result: TradeResult;
  closedAt: string;
}

export interface AlgorithmDetail extends Algorithm {
  signals: Signal[];
  trade: TradeDetails;
  history: Trade[];
}
