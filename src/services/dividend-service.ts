import apiClient from "./apiClient";

/**
 * Mirrors the API's `DividendDto`. Dates arrive as bare `yyyy-MM-dd` calendar dates - parse them
 * with `parseCalendarDate`/`formatCalendarDate` rather than `new Date(...)`, which would shift
 * them a day for viewers behind UTC.
 */
export interface DividendItem {
  id: number;
  /** Ticker without the CSE class suffix, e.g. `CSLK`. */
  symbol: string;
  /** Full CSE ticker as published, e.g. `CSLK.N0000`. */
  fullSymbol: string;
  companyName: string;
  financialYear?: string | null;
  votingDivPerShare: number;
  nonVotingDivPerShare: number;
  dateOfAnnouncement: string;
  recordDate: string;
  /** Null when CSE has not published a parseable payment date. */
  paymentDate?: string | null;
  /** Raw CSE payment-date text, shown when `paymentDate` is null. */
  paymentDateText?: string | null;
}

export const dividendService = {
  getBySymbol: async (symbol: string, limit = 10): Promise<DividendItem[]> => {
    const res = await apiClient.get<DividendItem[]>(`/dividends/symbol/${symbol}`, {
      params: { limit },
    });

    return Array.isArray(res.data) ? res.data : [];
  },

  getUpcoming: async (limit = 20): Promise<DividendItem[]> => {
    const res = await apiClient.get<DividendItem[]>("/dividends/upcoming", {
      params: { limit },
    });

    return Array.isArray(res.data) ? res.data : [];
  },
};
