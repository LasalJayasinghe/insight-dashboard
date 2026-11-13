import { useEffect, useState } from "react";
import { stockService, type HistoryRange } from "@/services/stock-service";
import type { PricePoint } from "@/lib/technicals";

/** Loads real CSE price history for a symbol (cached server-side). */
export function useStockHistory(symbol: string, range: HistoryRange) {
  const [data, setData] = useState<PricePoint[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    stockService
      .getHistory(symbol, range)
      .then((points) => {
        if (!cancelled) setData(points);
      })
      .catch((e) => {
        if (!cancelled) {
          setData([]);
          setError(e instanceof Error ? e.message : "Failed to load price history");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [symbol, range]);

  return { data, loading, error };
}
