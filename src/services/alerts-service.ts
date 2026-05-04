// API service layer for stock alerts.
// Swap BASE_URL or wire this to your ASP.NET Core Web API.
// All methods return typed promises and throw on non-2xx.

import type { AlertInput, StockAlert } from "@/lib/types";

const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "/api";

// In-memory fallback so the UI works before the .NET backend is wired up.
// Remove this block once the real endpoints are live.
let memory: StockAlert[] = [
  {
    id: "a1",
    symbol: "AAPL",
    type: "ABOVE",
    targetPrice: 240,
    status: "ACTIVE",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
  {
    id: "a2",
    symbol: "NVDA",
    type: "BELOW",
    targetPrice: 850,
    status: "ACTIVE",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
  {
    id: "a3",
    symbol: "TSLA",
    type: "BELOW",
    targetPrice: 230,
    status: "INACTIVE",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
  },
];

const USE_MOCK = true; // flip to false once the .NET API is reachable
const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json() as Promise<T>;
}

export const alertsService = {
  async list(): Promise<StockAlert[]> {
    if (USE_MOCK) {
      await delay();
      return [...memory].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
    return request<StockAlert[]>("/alerts");
  },

  async create(input: AlertInput): Promise<StockAlert> {
    if (USE_MOCK) {
      await delay();
      const created: StockAlert = {
        ...input,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      };
      memory = [created, ...memory];
      return created;
    }
    return request<StockAlert>("/alerts", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  async update(id: string, input: AlertInput): Promise<StockAlert> {
    if (USE_MOCK) {
      await delay();
      memory = memory.map((a) => (a.id === id ? { ...a, ...input } : a));
      const found = memory.find((a) => a.id === id);
      if (!found) throw new Error("Alert not found");
      return found;
    }
    return request<StockAlert>(`/alerts/${id}`, {
      method: "PUT",
      body: JSON.stringify(input),
    });
  },

  async remove(id: string): Promise<void> {
    if (USE_MOCK) {
      await delay();
      memory = memory.filter((a) => a.id !== id);
      return;
    }
    await fetch(`${BASE_URL}/alerts/${id}`, { method: "DELETE" });
  },
};
