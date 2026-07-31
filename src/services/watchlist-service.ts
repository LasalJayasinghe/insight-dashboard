import apiClient from "./apiClient";

export interface WatchlistStock {
  symbol: string;
  price: number;
  changePct: number;
  name: string;
  volume: number;
}

export interface StockOption {
  symbol: string;
  name: string;
}

type ApiWatchlistStock = {
  symbol: string;
  price: number;
  changePct: number;
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

  async listStockOptions(): Promise<StockOption[]> {
    const res = await apiClient.get<ApiStockOption[]>("/stocks/names");
    return Array.isArray(res.data) ? res.data : [];
  },
};
