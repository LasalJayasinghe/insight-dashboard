import apiClient from "./apiClient";

export interface DividendItem {
  id: number;
  symbol: string;
  companyName: string;
  dateOfAnnouncement: string;
  votingDivPerShare: number;
  nonVotingDivPerShare: number;
  financialYear?: string | null;
  recordDate: string;
  remarks?: string | null;
  paymentDate?: string | null;
  agmDate?: string | null;
  createdAt: string;
}

export const dividendService = {
  getBySymbol: async (symbol: string, limit = 10): Promise<DividendItem[]> => {
    const res = await apiClient.get<DividendItem[]>(`/dividends/symbol/${symbol}`, {
      params: { limit },
    });

    return res.data;
  },
};
