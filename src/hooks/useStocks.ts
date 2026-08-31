import { useState, useEffect, useCallback, useRef } from "react";
import {
  stockService,
  type StockTicker,
  type StockIndices,
  type MarketStatus,
  type StockMovers,
} from "../services/stock-service";

export function useStocks() {
  const [tickers, setTickers] = useState<StockTicker[]>([]);
  const [indices, setIndices] = useState<StockIndices | null>(null);
  const [status, setStatus] = useState<MarketStatus | null>(null);
  const [movers, setMovers] = useState<StockMovers | null>(null);

  const [loadingTickers, setLoadingTickers] = useState(true);
  const [loadingIndices, setLoadingIndices] = useState(true);
  const [loadingMovers, setLoadingMovers] = useState(true);

  const intervalsRef = useRef<ReturnType<typeof setInterval>[]>([]);

  const fetchTickers = useCallback(async () => {
    try {
      const data = await stockService.getSummary();
      setTickers(data);
    } catch (e) {
      console.error("Failed to fetch stock tickers", e);
    } finally {
      setLoadingTickers(false);
    }
  }, []);

  const fetchIndicesAndStatus = useCallback(async () => {
    try {
      const [ind, stat] = await Promise.all([
        stockService.getIndices(),
        stockService.getMarketStatus(),
      ]);
      setIndices(ind);
      setStatus(stat);
    } catch (e) {
      console.error("Failed to fetch market indices", e);
    } finally {
      setLoadingIndices(false);
    }
  }, []);

  const fetchMovers = useCallback(async () => {
    try {
      const data = await stockService.getMovers();
      setMovers(data);
    } catch (e) {
      console.error("Failed to fetch stock movers", e);
    } finally {
      setLoadingMovers(false);
    }
  }, []);

  useEffect(() => {
    void fetchTickers();
    void fetchIndicesAndStatus();
    void fetchMovers();

    // Indices are refreshed by backend jobs, so poll less aggressively from the UI.
    intervalsRef.current = [
      setInterval(() => void fetchTickers(), 30_000),
      setInterval(() => void fetchIndicesAndStatus(), 300_000),
      setInterval(() => void fetchMovers(), 60_000),
    ];

    return () => intervalsRef.current.forEach(clearInterval);
  }, [fetchTickers, fetchIndicesAndStatus, fetchMovers]);

  return {
    tickers,
    indices,
    status,
    movers,
    loadingTickers,
    loadingIndices,
    loadingMovers,
    refresh: () => {
      setLoadingTickers(true);
      setLoadingIndices(true);
      setLoadingMovers(true);
      void fetchTickers();
      void fetchIndicesAndStatus();
      void fetchMovers();
    },
  };
}
