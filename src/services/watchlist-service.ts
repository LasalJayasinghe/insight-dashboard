import apiClient from "./apiClient";

export interface WatchlistStock {
  symbol: string;
  price: number;
  changePct: number;
  name: string;
  volume: number;
  /** Today's high / low (0 or undefined when the stock hasn't traded yet). */
  high?: number;
  low?: number;
}

export interface StockOption {
  symbol: string;
  name: string;
}

type ApiWatchlistStock = {
  symbol: string;
  price: number;
  changePct: number;
  high?: number;
  low?: number;
};

type ApiStockOption = {
  symbol: string;
  name: string;
};

function toStock(item: ApiWatchlistStock): WatchlistStock {
  return {
    symbol: item.symbol,
    name: item.symbol,
    price: Number(item.price),
    changePct: Number(item.changePct),
    volume: 0,
    high: item.high != null ? Number(item.high) : undefined,
    low: item.low != null ? Number(item.low) : undefined,
  };
}

export const watchlistService = {
  async list(): Promise<WatchlistStock[]> {
    const res = await apiClient.get<ApiWatchlistStock[]>("/watchlist");
    return Array.isArray(res.data) ? res.data.map(toStock) : [];
  },

  async add(symbol: string): Promise<WatchlistStock> {
    const res = await apiClient.post<ApiWatchlistStock>("/watchlist", {
      symbol,
    });
    return toStock(res.data);
  },

  async remove(symbol: string): Promise<void> {
    await apiClient.delete(`/watchlist/${encodeURIComponent(symbol)}`);
  },

  async listStockOptions(): Promise<StockOption[]> {
    const res = await apiClient.get<ApiStockOption[]>("/stocks/names");
    return Array.isArray(res.data) ? res.data : [];
  },
};
