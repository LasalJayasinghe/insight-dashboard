import { useCallback, useEffect, useState } from "react";
import { algorithmsService } from "@/services/algorithms-service";
import type { Algorithm, AlgorithmDetail } from "@/lib/algorithm-types";

export function useAlgorithms() {
  const [data, setData] = useState<Algorithm[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await algorithmsService.list());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load algorithms");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, loading, error, refresh };
}

export function useAlgorithmDetail(id: string) {
  const [data, setData] = useState<AlgorithmDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await algorithmsService.get(id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load algorithm");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const toggle = useCallback(async () => {
    const updated = await algorithmsService.toggle(id);
    setData((prev) => (prev ? { ...prev, ...updated } : prev));
    return updated;
  }, [id]);

  return { data, loading, error, refresh, toggle };
}
