import apiClient from "./apiClient";

export interface NewsArticle {
  id: number;
  externalId: string;
  title: string;
  summary: string;
  originalUrl: string;
  source: string;
  marketCategory: string; // CSE_STOCKS, GLOBAL_BUSINESS, GLOBAL_CRYPTO, MACRO
  sentiment: string; // BULLISH, BEARISH, NEUTRAL
  importanceScore: number;
  mentionedTickersJson: string;
  isModelValidated: boolean;
  isRelevant: boolean;
  publishedAt: string;
  createdAt: string;
}

export interface NewsResponse {
  totalItems: number;
  page: number;
  limit: number;
  items: NewsArticle[];
}

export interface NewsStatus {
  totalArticles: number;
  pendingValidation: number;
  validatedCount: number;
  relevantCount: number;
  isScanning: boolean;
  timestamp: string;
}

export const newsService = {
  getNews: async (category?: string, sentiment?: string, limit = 10, page = 1): Promise<NewsResponse> => {
    const params: Record<string, any> = { limit, page };
    if (category && category !== "ALL") params.category = category;
    if (sentiment && sentiment !== "ALL") params.sentiment = sentiment;

    const res = await apiClient.get<NewsResponse>("/api/news", { params });
    return res.data;
  },

  getNewsBySymbol: async (symbol: string, limit = 10): Promise<NewsArticle[]> => {
    const res = await apiClient.get<NewsArticle[]>(`/api/news/symbol/${symbol}`, { params: { limit } });
    return res.data;
  },

  getNewsStatus: async (): Promise<NewsStatus> => {
    const res = await apiClient.get<NewsStatus>("/api/news/status");
    return res.data;
  },

  syncNews: async (): Promise<{ count: number; message: string }> => {
    const res = await apiClient.post<{ count: number; message: string }>("/api/news/sync");
    return res.data;
  }
};
