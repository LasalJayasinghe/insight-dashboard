import apiClient from "./apiClient";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type PortfolioType = "Stocks" | "Crypto";

export interface HoldingDto {
  id: number;
  symbol: string;
  /** Company name (CSE stocks). */
  name?: string | null;
  assetType: string;
  quantity: number;
  averageBuyPrice: number;
  /** Cost per share incl. the 1.12% buy fee: avg × 1.0112 (stocks only). */
  costPerShare?: number | null;
  /** Break-even selling price after CSE selling charges (stocks only). */
  breakEvenPrice?: number | null;
  currentPrice: number;
  /** Previous session close (CSE) or 24h open (crypto). */
  previousClose: number;
  dayChange: number;
  dayChangePercent: number;
  /** quantity × dayChange */
  dayProfitLoss: number;
  currentValue: number;
  /** Share of the portfolio's value, 0–100. */
  weightPercent: number;
  /** Net of CSE selling charges for stocks. */
  profitLoss: number;
  profitLossPercent: number;
  /** Today's market activity for the security (CSE only; null before the first poll). */
  shareVolume?: number | null;
  tradeVolume?: number | null;
  turnover?: number | null;
  notes?: string;
}

export interface PortfolioSummaryDto {
  id: number;
  name: string;
  type: PortfolioType;
  baseCurrency: string;
  description?: string;
  /** Holdings + cash, in the base currency. */
  totalValue: number;
  holdingsValue: number;
  /** Uninvested cash: CSE buying power (LKR) or idle USDT. */
  cashBalance: number;
  totalProfitLoss: number;
  totalProfitLossPercent: number;
  todayProfitLoss: number;
  todayProfitLossPercent: number;
  holdingCount: number;
  createdAt: string;
}

export interface PortfolioDetailDto {
  id: number;
  name: string;
  type: PortfolioType;
  baseCurrency: string;
  description?: string;
  /** Holdings + cash. */
  totalValue: number;
  holdingsValue: number;
  cashBalance: number;
  /** Sum of realised P/L from recorded sells. */
  realizedProfitLoss: number;
  totalCost: number;
  totalProfitLoss: number;
  totalProfitLossPercent: number;
  todayProfitLoss: number;
  todayProfitLossPercent: number;
  createdAt: string;
  holdings: HoldingDto[];
}

export type Trend = "UPTREND" | "DOWNTREND" | "MIXED" | "INSUFFICIENT_DATA";

/** Rule-based signals for one holding, computed server-side from ~1 year of CSE daily prices. */
export interface HoldingSignalsDto {
  symbol: string;
  sessions: number;
  trend: Trend;
  sma50: number | null;
  sma200: number | null;
  rsi14: number | null;
  rsiState: "OVERBOUGHT" | "OVERSOLD" | null;
  high52w: number | null;
  low52w: number | null;
  /** 0 = at the 52-week low, 100 = at the 52-week high. */
  rangePosition: number | null;
  nearHigh52w: boolean;
  nearLow52w: boolean;
  volumeRatio: number | null;
  volumeSpike: boolean;
}

export interface HoldingDividendDto {
  symbol: string;
  companyName?: string | null;
  dividendPerShare: number;
  quantity: number;
  expectedPayout: number;
  recordDate: string;
  paymentDate?: string | null;
  paymentDateRaw?: string | null;
  financialYear?: string | null;
}

export interface PortfolioInsightsDto {
  portfolioId: number;
  generatedAt: string;
  signals: HoldingSignalsDto[];
  upcomingDividends: HoldingDividendDto[];
  expectedDividendIncome: number;
}

export interface NetWorthOverviewDto {
  totalNetWorthLkr: number;
  totalNetWorthUsdt: number;
  totalProfitLossLkr: number;
  totalProfitLossUsdt: number;
  /** Uninvested cash across all portfolios, in LKR. */
  totalCashLkr: number;
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

export type TradeSide = "Buy" | "Sell";

export interface TradeRequest {
  side: TradeSide;
  symbol: string;
  quantity: number;
  /** Per unit, before fees. */
  price: number;
  /** Crypto only (USDT); defaults to 0.1% server-side. CSE always uses the 1.12% charges. */
  fees?: number;
  /** Buy: pay from cash (false = record a position you already had). Sell: add proceeds to cash. */
  useCash: boolean;
  notes?: string;
}

export type CashAction = "Deposit" | "Withdraw" | "Set";

export interface CashRequest {
  action: CashAction;
  amount: number;
  notes?: string;
}

export interface UpdateHoldingRequest {
  quantity: number;
  averageBuyPrice: number;
  notes?: string;
}

export type TransactionType =
  | "Opening"
  | "Buy"
  | "Sell"
  | "Deposit"
  | "Withdrawal"
  | "CashAdjustment"
  | "HoldingAdjustment";

export interface PortfolioTransactionDto {
  id: number;
  type: TransactionType;
  symbol?: string | null;
  quantity?: number | null;
  price?: number | null;
  fees: number;
  /** Signed effect on cash. */
  cashChange: number;
  cashBalanceAfter: number;
  realizedProfitLoss?: number | null;
  notes?: string | null;
  executedAt: string;
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
  async getHistory(range: HistoryRange = "1M", portfolioId?: number): Promise<PortfolioHistoryDto> {
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

  /** Signals per holding + upcoming dividends (stocks). Slower than getById: loads price history. */
  async getInsights(id: number): Promise<PortfolioInsightsDto> {
    const res = await apiClient.get<PortfolioInsightsDto>(`/portfolios/${id}/insights`);
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
  /** Buy or sell; returns the updated portfolio. */
  async trade(portfolioId: number, req: TradeRequest): Promise<PortfolioDetailDto> {
    const res = await apiClient.post<PortfolioDetailDto>(`/portfolios/${portfolioId}/trades`, req);
    return res.data;
  },

  /** Deposit / withdraw / set the cash balance; returns the updated portfolio. */
  async changeCash(portfolioId: number, req: CashRequest): Promise<PortfolioDetailDto> {
    const res = await apiClient.post<PortfolioDetailDto>(`/portfolios/${portfolioId}/cash`, req);
    return res.data;
  },

  /** Correct a holding's quantity / average price (no cash moves). */
  async updateHolding(
    portfolioId: number,
    holdingId: number,
    req: UpdateHoldingRequest,
  ): Promise<PortfolioDetailDto> {
    const res = await apiClient.put<PortfolioDetailDto>(
      `/portfolios/${portfolioId}/holdings/${holdingId}`,
      req,
    );
    return res.data;
  },

  /** The portfolio's ledger, newest first. */
  async getTransactions(portfolioId: number, limit = 100): Promise<PortfolioTransactionDto[]> {
    const res = await apiClient.get<PortfolioTransactionDto[]>(
      `/portfolios/${portfolioId}/transactions`,
      { params: { limit } },
    );
    return res.data;
  },

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
