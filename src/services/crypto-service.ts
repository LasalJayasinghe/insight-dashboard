import apiClient from "./apiClient";
import type { HubConnection } from "@microsoft/signalr";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TickerData {
  symbol: string;
  lastPrice: number;
  priceChangePercent: number;
  high24h: number;
  low24h: number;
  quoteVolume: number;
  updatedAt: string;
}

export interface CandleBar {
  time: number; // Unix seconds — Lightweight Charts format
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface StrategySnapshot {
  symbol: string;
  ema9: number;
  ema21: number;
  rsi: number;
  currentPrice: number;
  signal: "BUY" | "SELL" | "WAIT";
  reason: string;
  marketCondition: "Bullish" | "Bearish" | "Neutral";
  confidence: number;
  evaluatedAt: string;
}

export interface ScannerResult {
  symbol: string;
  signal: "BUY" | "SELL" | "WAIT";
  confidence: number;
  price: number;
  marketCondition: "Bullish" | "Bearish" | "Neutral";
  rsi: number;
  ema9: number;
  ema21: number;
}

export interface WhaleTrade {
  symbol: string;
  side: "BUY" | "SELL";
  amount: number;
  price: number;
  qty: number;
  time: string;
}

export interface AiSummary {
  symbol: string;
  summary: string;
  generatedAt: string;
  indicators: { ema9: number; ema21: number; rsi: number };
}

// ── Service ───────────────────────────────────────────────────────────────────

export const cryptoService = {
  async getTickers(): Promise<TickerData[]> {
    const res = await apiClient.get<TickerData[]>("/crypto/tickers");
    return res.data;
  },

  async getCandles(
    symbol = "BTCUSDT",
    interval = "1m",
    limit = 300,
  ): Promise<CandleBar[]> {
    const res = await apiClient.get<CandleBar[]>("/crypto/candles", {
      params: { symbol, interval, limit },
    });
    return res.data;
  },

  async getStrategy(symbol = "BTCUSDT"): Promise<StrategySnapshot> {
    const res = await apiClient.get<StrategySnapshot>("/crypto/strategy", {
      params: { symbol },
    });
    return res.data;
  },

  async getScanner(): Promise<ScannerResult[]> {
    const res = await apiClient.get<ScannerResult[]>("/crypto/scanner");
    return res.data;
  },

  async getWhales(
    symbol = "BTCUSDT",
    minUsd = 100_000,
  ): Promise<WhaleTrade[]> {
    const res = await apiClient.get<WhaleTrade[]>("/crypto/whales", {
      params: { symbol, minUsd },
    });
    return res.data;
  },

  async getAiSummary(symbol = "BTCUSDT"): Promise<AiSummary> {
    const res = await apiClient.get<AiSummary>("/crypto/ai-summary", {
      params: { symbol },
    });
    return res.data;
  },
};

// ── SignalR connection factory ─────────────────────────────────────────────────
// Imported lazily so the SignalR bundle is only loaded on the /crypto route.

export async function createCryptoHubConnection(): Promise<HubConnection> {
  const { HubConnectionBuilder, LogLevel } = await import(
    "@microsoft/signalr"
  );
  const { tokenService } = await import("./tokenService");
  const { ENV } = await import("@/config/env");

  const baseUrl = ENV.API_BASE_URL.replace(/\/api\/?$/, "");

  return new HubConnectionBuilder()
    .withUrl(`${baseUrl}/hubs/crypto`, {
      accessTokenFactory: () => tokenService.get() ?? "",
    })
    .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
    .configureLogging(LogLevel.Warning)
    .build();
}
