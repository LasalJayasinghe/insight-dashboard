// Encapsulates all alerts state: fetching, optimistic create/update/delete.
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { alertsService } from "@/services/alerts-service";
import type { AlertInput, StockAlert } from "@/lib/types";

export function useAlerts() {
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await alertsService.list();
      setAlerts(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load alerts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const create = useCallback(async (input: AlertInput) => {
    const created = await alertsService.create(input);
    setAlerts((prev) => [created, ...prev]);
    toast.success(`Alert created for ${created.symbol}`);
    return created;
  }, []);

  const update = useCallback(async (id: string, input: AlertInput) => {
    const updated = await alertsService.update(id, input);
    setAlerts((prev) => prev.map((a) => (a.id === id ? updated : a)));
    toast.success(`Alert updated for ${updated.symbol}`);
    return updated;
  }, []);

  const remove = useCallback(
    async (id: string) => {
      const snapshot = alerts;
      setAlerts((prev) => prev.filter((a) => a.id !== id)); // optimistic
      try {
        await alertsService.remove(id);
        toast.success("Alert deleted");
      } catch (e) {
        setAlerts(snapshot); // rollback
        toast.error("Failed to delete alert");
        throw e;
      }
    },
    [alerts],
  );

  return { alerts, loading, error, refresh, create, update, remove };
}
