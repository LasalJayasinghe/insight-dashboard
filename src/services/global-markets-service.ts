import apiClient from "./apiClient";

export interface GlobalMarketQuote {
  symbol: string;
  name: string;
  region: string;
  currency: string;
  price: number;
  previousClose: number;
  change: number;
  changePercent: number;
  isOpen: boolean;
  marketTime: string | null;
}

export interface GlobalMarketGroup {
  /** "us" | "asia" | "commodities" | "risk" */
  key: string;
  title: string;
  quotes: GlobalMarketQuote[];
}

export interface GlobalMarketMood {
  /** "Risk-on" | "Mixed" | "Risk-off" | "Unknown" */
  label: string;
  tone: "positive" | "negative" | "neutral";
  summary: string;
  asiaAverageChangePercent: number | null;
  usFuturesChangePercent: number | null;
}

export interface GlobalMarketOverview {
  groups: GlobalMarketGroup[];
  mood: GlobalMarketMood;
  updatedAt: string | null;
}

export const globalMarketsService = {
  /** US close + futures, Asian indices, gold/silver/oil, VIX/DXY — cached server-side (5 min). */
  async getOverview(): Promise<GlobalMarketOverview> {
    const res = await apiClient.get<GlobalMarketOverview>("/markets/global");
    return res.data;
  },
};
