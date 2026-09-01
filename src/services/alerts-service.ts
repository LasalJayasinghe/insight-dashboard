import type { AlertInput, StockAlert } from "@/lib/types";
import apiClient from "./apiClient";

type ApiAlert = {
  id: number;
  symbol: string;
  targetPrice: number;
  currentPrice: number | null;
  isAbove: boolean;
  isActive: boolean;
  createdAt: string;
};

function toAlert(a: ApiAlert): StockAlert {
  return {
    id: String(a.id),
    symbol: a.symbol,
    type: a.isAbove ? "ABOVE" : "BELOW",
    targetPrice: Number(a.targetPrice),
    currentPrice: a.currentPrice == null ? null : Number(a.currentPrice),
    status: a.isActive ? "ACTIVE" : "INACTIVE",
    createdAt: a.createdAt,
  };
}

export const alertsService = {
  async list(): Promise<StockAlert[]> {
    const res = await apiClient.get<ApiAlert[]>("/alerts");
    return res.data.map(toAlert);
  },

  async create(input: AlertInput): Promise<StockAlert> {
    const res = await apiClient.post<ApiAlert>("/alerts", {
      symbol: input.symbol,
      targetPrice: input.targetPrice,
      isAbove: input.type === "ABOVE",
      isActive: input.status === "ACTIVE",
    });
    return toAlert(res.data);
  },

  async update(id: string, input: AlertInput): Promise<StockAlert> {
    const res = await apiClient.put<ApiAlert>(`/alerts/${id}`, {
      targetPrice: input.targetPrice,
      isAbove: input.type === "ABOVE",
      isActive: input.status === "ACTIVE",
    });
    return toAlert(res.data);
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/alerts/${id}`);
  },
};
