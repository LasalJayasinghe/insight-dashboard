import apiClient from "./apiClient";

/** How far a figure can be trusted. */
export type FundamentalStatus = "verified" | "unverified" | "manual" | "partial" | "missing";

export interface FundamentalValue {
  value: number | null;
  status: FundamentalStatus;
  /** Why it's missing, or how it was derived. */
  note: string | null;
}

export interface StockFundamentals {
  symbol: string;
  price: number | null;

  navPerShare: FundamentalValue;
  priceToBook: FundamentalValue;
  epsTtm: FundamentalValue;
  priceToEarnings: FundamentalValue;
  dividendYield: FundamentalValue;
  roe: FundamentalValue;
  publicFloatPercent: FundamentalValue;

  marketCap: number | null;
  sharesInIssue: number | null;
  betaAspi: number | null;
  betaSl20: number | null;
  high52Week: number | null;
  low52Week: number | null;

  reportTitle: string | null;
  reportPeriodEnd: string | null;
  reportUrl: string | null;
  /** False until the company's latest report has been read (backfill still running). */
  hasReports: boolean;
}

export const fundamentalsService = {
  async get(symbol: string): Promise<StockFundamentals> {
    const clean = symbol.trim().toUpperCase();
    const res = await apiClient.get<StockFundamentals>(
      `/stocks/${encodeURIComponent(clean)}/fundamentals`,
    );
    return res.data;
  },
};
