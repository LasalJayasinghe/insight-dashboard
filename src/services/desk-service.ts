import apiClient from "./apiClient";
import type { StockFundamentals } from "./fundamentals-service";

export type DeskMarket = "cse" | "crypto";

export interface DeskSession {
  isOpen: boolean;
  isTradingDay: boolean;
  /** Colombo "HH:mm" (CSE only). */
  openTime: string | null;
  closeTime: string | null;
  alwaysOpen: boolean;
}

export interface DeskIndex {
  value: number;
  high: number;
  low: number;
  change: number;
  changePercent: number;
}

export interface DeskIndexPoint {
  at: string;
  aspi: number;
  spSl20: number;
}

export interface DeskCseMarket {
  aspi: DeskIndex;
  spSl20: DeskIndex;
  aspiIntraday: DeskIndexPoint[];
  advancers: number;
  decliners: number;
  unchanged: number;
  traded: number;
  turnover: number;
  turnoverAvg20d: number | null;
  trades: number;
  marketCap: number;
  /** Session the daily figures below come from. */
  dailyDate: string | null;
  foreignPurchase: number | null;
  foreignSales: number | null;
  marketPer: number | null;
  marketPbv: number | null;
  marketDividendYield: number | null;
}

export interface DeskCryptoMarket {
  quoteVolume24h: number;
  advancers: number;
  decliners: number;
  btcPrice: number | null;
  btcChangePercent: number | null;
}

export interface DeskBoardRow {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  /** Previous close (CSE) or 24h open (crypto). */
  previousClose: number;
  volume: number;
  /** CSE only. */
  trades: number | null;
  /** LKR turnover (CSE) or 24h USDT volume (crypto). */
  turnover: number;
  marketCap: number | null;
}

export interface DeskPosition {
  symbol: string;
  name: string;
  quantity: number;
  averageBuyPrice: number;
  price: number;
  dayChangePercent: number;
  dayProfitLoss: number;
  value: number;
  cost: number;
  /** After fees — 0 at the break-even price. */
  profitLoss: number;
  profitLossPercent: number;
  breakEvenPrice: number;
  weightPercent: number;
  volume: number;
  turnover: number;
  trend: string | null;
  rsi14: number | null;
  priceToEarnings: number | null;
  priceToBook: number | null;
  nextDividendRecordDate: string | null;
  nextDividendPerShare: number | null;
  alertCount: number;
  portfolios: string[];
}

export interface DeskPortfolioTotals {
  currency: string;
  holdingsValue: number;
  dayProfitLoss: number;
  profitLoss: number;
  cash: number;
}

export interface DeskAlert {
  id: number;
  symbol: string;
  label: string;
  targetPrice: number;
  isAbove: boolean;
  isActive: boolean;
  fireOnce: boolean;
  currentPrice: number | null;
  /** Move still needed to trigger, in % of price (negative = already past). */
  distancePercent: number | null;
  lastTriggeredAt: string | null;
}

export interface DeskTrade {
  at: string;
  portfolio: string;
  side: "Buy" | "Sell";
  symbol: string;
  quantity: number;
  price: number;
  realizedProfitLoss: number | null;
}

export interface DeskToday {
  trades: DeskTrade[];
  realizedProfitLoss: number;
  alertsFired: DeskAlert[];
}

export interface DeskOverview {
  market: DeskMarket;
  currency: string;
  pricesAsOf: string | null;
  session: DeskSession;
  cse: DeskCseMarket | null;
  crypto: DeskCryptoMarket | null;
  board: DeskBoardRow[];
  portfolio: DeskPosition[];
  portfolioTotals: DeskPortfolioTotals;
  watchlist: DeskBoardRow[];
  nearAlerts: DeskAlert[];
  alertCounts: Record<string, number>;
  today: DeskToday;
}

export interface DeskPortfolioOption {
  id: number;
  name: string;
  cash: number;
  quantity: number;
}

export interface DeskSymbol {
  market: DeskMarket;
  symbol: string;
  currency: string;
  quote: DeskBoardRow | null;
  position: DeskPosition | null;
  portfolios: DeskPortfolioOption[];
  alerts: DeskAlert[];
  fundamentals: StockFundamentals | null;
}

export interface QuickAlertInput {
  symbol: string;
  targetPrice: number;
  isAbove: boolean;
  fireOnce: boolean;
}

export const deskService = {
  async overview(market: DeskMarket): Promise<DeskOverview> {
    const res = await apiClient.get<DeskOverview>("/desk/overview", { params: { market } });
    return res.data;
  },

  async symbol(symbol: string, market: DeskMarket): Promise<DeskSymbol> {
    const res = await apiClient.get<DeskSymbol>(`/desk/symbol/${encodeURIComponent(symbol)}`, {
      params: { market },
    });
    return res.data;
  },

  /** Alerts on one symbol (for the quick-alert popover). */
  async alertsFor(symbol: string): Promise<DeskAlert[]> {
    const res = await apiClient.get<DeskAlert[]>("/alerts", { params: { symbol } });
    return res.data;
  },

  async createAlert(input: QuickAlertInput): Promise<void> {
    await apiClient.post("/alerts", { ...input, isActive: true });
  },

  async deleteAlert(id: number): Promise<void> {
    await apiClient.delete(`/alerts/${id}`);
  },

  async watch(symbol: string, market: DeskMarket): Promise<void> {
    await apiClient.post("/watchlist", { symbol, market: market === "crypto" ? "Crypto" : "Cse" });
  },

  async unwatch(symbol: string): Promise<void> {
    await apiClient.delete(`/watchlist/${encodeURIComponent(symbol)}`);
  },
};
