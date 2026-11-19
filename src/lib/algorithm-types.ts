// Domain types for Binance trading algorithms.
// Mirrors the .NET API contract (AlgorithmsApiController). All PnL values are
// NET of Binance trading fees (entry + exit).

export type AlgorithmStatus = "RUNNING" | "STOPPED";
export type SignalType = "BUY" | "SELL" | "HOLD";
export type TradeResult = "WIN" | "LOSS";

export interface Algorithm {
  id: string;
  name: string;
  description?: string;
  category?: string; // Trend, Mean reversion, Volatility breakout, Multi-asset, Systematic, Order flow
  pair?: string; // e.g. "BTC/USDT", "ETH/BTC", "7 coins"
  timeframe?: string; // candle interval, e.g. "1h"
  status: AlgorithmStatus;
  totalPnl: number; // absolute PnL (USDT), net of fees
  totalPnlPct: number;
  winRate: number; // 0..100
  activeSignals: number;
  totalTrades: number;
  currentSignal: SignalType;
  lastUpdated: string; // ISO
  totalFees?: number; // USDT paid in Binance trading fees
  feeRate?: number; // per side, e.g. 0.001 = 0.10%
  realizedPnl?: number;
  unrealizedPnl?: number;
  equity?: number; // cash + open positions valued after the exit fee
  cash?: number;
  initialBalance?: number;
  // Benchmark: the starting balance bought into BTC when the bot started and simply held
  // (buy + exit fee included, like equity). Null until the server has the BTC start price.
  startedAt?: string; // ISO, when the bot started
  btcStartPrice?: number | null; // BTC/USDT at the start
  btcPrice?: number | null; // BTC/USDT now
  btcHoldValue?: number | null; // USDT value now if the balance had been held in BTC
  btcHoldPnlPct?: number | null; // return of holding BTC, %
  vsBtc?: number | null; // equity − btcHoldValue (USDT); > 0 = the algorithm beat holding BTC
  vsBtcPct?: number | null; // same, in percentage points of the starting balance
}

export interface Signal {
  id: string;
  pair: string;
  signal: SignalType;
  price: number;
  confidence?: number | null; // 0..100
  reason?: string | null;
  time: string; // ISO
}

export interface TradeDetails {
  symbol?: string;
  pair?: string;
  entryPrice: number;
  breakEvenPrice?: number; // exit price that covers entry + both fees
  currentPrice?: number;
  quantity?: number;
  entryFee?: number;
  entryTime?: string | null;
  stopLoss: number | null;
  takeProfit: number | null;
  unrealizedPnl?: number;
  strategy?: string;
}

export interface Trade {
  id: string;
  pair: string;
  entryPrice: number;
  exitPrice: number;
  quantity?: number;
  pnl: number; // absolute, net of fees
  pnlPct: number;
  fees?: number; // entry + exit fee (USDT)
  durationMinutes: number;
  result: TradeResult;
  closedAt: string;
  reason?: string;
}

export interface AlgorithmDetail extends Algorithm {
  signals: Signal[];
  trade: TradeDetails | null; // largest open position, null when flat
  positions?: TradeDetails[]; // all open positions
  indicators?: Record<string, number>; // live indicator values
  history: Trade[];
}
