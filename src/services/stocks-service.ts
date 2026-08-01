import apiClient from "./apiClient";

export interface LiveStock {
  symbol: string;
  name: string;
  price: number;
  previousClose: number;
  changePct: number;
  volume: number;
}

export interface IntradayPoint {
  symbol: string;
  price: number;
  percentage: number;
}

export interface MarketStatus {
  isTradingDay: boolean;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
  updatedAt: string;
}

interface StockApiResponse {
  symbol?: string;
  Symbol?: string;
  price?: number;
  Price?: number;
  lastTradedPrice?: number;
  LastTradedPrice?: number;
}

function normalizeStock(data: StockApiResponse): LiveStock {
  const symbol = (data.symbol ?? data.Symbol ?? "").toUpperCase();
  const close = Number(data.price ?? data.Price ?? 0);
  const last = Number(data.lastTradedPrice ?? data.LastTradedPrice ?? close);
  const changePct = close > 0 ? ((last - close) / close) * 100 : 0;

  return {
    symbol,
    name: symbol,
    price: last,
    previousClose: close,
    changePct,
    volume: 0,
  };
}

export const stocksService = {
  async getBySymbol(symbol: string): Promise<LiveStock> {
    const clean = symbol.trim().toUpperCase();
    const res = await apiClient.get(`/stocks/details/${clean}`);
    return normalizeStock(res.data as StockApiResponse);
  },

  async getIntraday(): Promise<IntradayPoint[]> {
    const res = await apiClient.get<IntradayPoint[]>("/stocks/intraday");
    return Array.isArray(res.data) ? res.data : [];
  },

  async getMarketStatus(): Promise<MarketStatus | null> {
    try {
      const res = await apiClient.get<MarketStatus>("/stocks/market-status");
      return res.data;
    } catch {
      return null;
    }
  },
};
