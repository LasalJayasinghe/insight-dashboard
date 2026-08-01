import apiClient from "./apiClient";

export interface StockTicker {
  symbol: string;
  name: string;
  price: number;
  previousClose: number;
  high: number;
  low: number;
  percentageChange: number;
  change: number;
}

export interface StockIndices {
  aspi: {
    indexType: number;
    value: number;
    highValue: number;
    lowValue: number;
    change: number;
    percentage: number;
  };
  snp: {
    indexType: number;
    value: number;
    highValue: number;
    lowValue: number;
    change: number;
    percentage: number;
  };
}

export interface MarketStatus {
  isTradingDay: boolean;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
  updatedAt: string;
}

export interface TopMover {
  symbol: string;
  price: number;
  change: number;
  changePercentage: number;
}

export interface StockMovers {
  gainers: TopMover[];
  losers: TopMover[];
}

export const stockService = {
  async getSummary(): Promise<StockTicker[]> {
    const res = await apiClient.get<StockTicker[]>("/stocks/summary");
    return res.data;
  },

  async getIndices(): Promise<StockIndices> {
    const res = await apiClient.get<StockIndices>("/stocks/indices");
    return res.data;
  },

  async getMarketStatus(): Promise<MarketStatus> {
    const res = await apiClient.get<MarketStatus>("/stocks/market-status");
    return res.data;
  },

  async getMovers(): Promise<StockMovers> {
    const res = await apiClient.get<StockMovers>("/stocks/movers");
    return res.data;
  }
};
