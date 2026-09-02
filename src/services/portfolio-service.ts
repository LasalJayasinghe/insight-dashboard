import apiClient from "./apiClient";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type PortfolioType = "Stocks" | "Crypto";

export interface HoldingDto {
  id: number;
  symbol: string;
  assetType: string;
  quantity: number;
  averageBuyPrice: number;
  currentPrice: number;
  currentValue: number;
  profitLoss: number;
  profitLossPercent: number;
  notes?: string;
}

export interface PortfolioSummaryDto {
  id: number;
  name: string;
  type: PortfolioType;
  baseCurrency: string;
  description?: string;
  totalValue: number;
  totalProfitLoss: number;
  totalProfitLossPercent: number;
  holdingCount: number;
  createdAt: string;
}

export interface PortfolioDetailDto {
  id: number;
  name: string;
  type: PortfolioType;
  baseCurrency: string;
  description?: string;
  totalValue: number;
  totalCost: number;
  totalProfitLoss: number;
  totalProfitLossPercent: number;
  createdAt: string;
  holdings: HoldingDto[];
}

export interface NetWorthOverviewDto {
  totalNetWorthLkr: number;
  totalNetWorthUsdt: number;
  totalProfitLossLkr: number;
  totalProfitLossUsdt: number;
  usdtToLkrRate: number;
  lkrToUsdtRate: number;
  portfolios: PortfolioSummaryDto[];
}

/** One hourly snapshot of portfolio value, written server-side by PortfolioSnapshotJob. */
export interface PortfolioHistoryPointDto {
  capturedAt: string; // ISO-8601 UTC, top of the hour
  valueLkr: number;
  valueUsdt: number;
  profitLossLkr: number;
  profitLossUsdt: number;
}

export type HistoryRange = "1D" | "1W" | "1M" | "3M" | "1Y" | "ALL";

export interface PortfolioHistoryDto {
  range: HistoryRange;
  portfolioId: number | null; // null = aggregated net worth
  interval: "hour" | "day";
  startValueLkr: number;
  endValueLkr: number;
  changeLkr: number;
  changePercent: number;
  points: PortfolioHistoryPointDto[];
}

export interface CreatePortfolioRequest {
  name: string;
  type: number; // 1 = Stocks, 2 = Crypto
  baseCurrency: string; // "LKR" or "USDT"
  description?: string;
}

export interface UpdatePortfolioRequest {
  name?: string;
  description?: string;
}

export interface AddHoldingRequest {
  symbol: string;
  quantity: number;
  averageBuyPrice: number;
  notes?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────────────────────────────────────

export const portfolioService = {
  /** List all user portfolios. Optionally filter by type: "Stocks" or "Crypto" */
  async list(type?: PortfolioType): Promise<PortfolioSummaryDto[]> {
    const params = type ? { type } : {};
    const res = await apiClient.get<PortfolioSummaryDto[]>("/portfolios", { params });
    return Array.isArray(res.data) ? res.data : [];
  },

  /** Get aggregated net worth across all portfolios in a display currency */
  async getNetWorth(currency: string = "LKR"): Promise<NetWorthOverviewDto> {
    const res = await apiClient.get<NetWorthOverviewDto>("/portfolios/net-worth", {
      params: { currency },
    });
    return res.data;
  },

  /**
   * Portfolio value over time from the hourly snapshots.
   * Omit `portfolioId` for aggregated net worth; 3M and longer come back as daily points.
   */
  async getHistory(
    range: HistoryRange = "1M",
    portfolioId?: number,
  ): Promise<PortfolioHistoryDto> {
    const res = await apiClient.get<PortfolioHistoryDto>("/portfolios/history", {
      params: portfolioId ? { range, portfolioId } : { range },
    });
    return res.data;
  },

  /** Get a single portfolio with full holdings and live valuations */
  async getById(id: number): Promise<PortfolioDetailDto> {
    const res = await apiClient.get<PortfolioDetailDto>(`/portfolios/${id}`);
    return res.data;
  },

  /** Create a new portfolio */
  async create(req: CreatePortfolioRequest): Promise<PortfolioDetailDto> {
    const res = await apiClient.post<PortfolioDetailDto>("/portfolios", req);
    return res.data;
  },

  /** Update portfolio name or description */
  async update(id: number, req: UpdatePortfolioRequest): Promise<void> {
    await apiClient.put(`/portfolios/${id}`, req);
  },

  /** Delete a portfolio (and all its holdings) */
  async delete(id: number): Promise<void> {
    await apiClient.delete(`/portfolios/${id}`);
  },

  /** Add or update a holding inside a portfolio */
  async addHolding(portfolioId: number, req: AddHoldingRequest): Promise<HoldingDto> {
    const res = await apiClient.post<HoldingDto>(`/portfolios/${portfolioId}/holdings`, req);
    return res.data;
  },

  /** Remove a specific holding from a portfolio */
  async deleteHolding(portfolioId: number, holdingId: number): Promise<void> {
    await apiClient.delete(`/portfolios/${portfolioId}/holdings/${holdingId}`);
  },
  // ─── Sync ─────────────────────────────────────────────────────────────────

  async syncFromFile(portfolioId: number, file: File): Promise<{ count: number }> {
    const formData = new FormData();
    formData.append("file", file);

    const res = await apiClient.post(`/portfolios/${portfolioId}/sync-file`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data;
  },
};
