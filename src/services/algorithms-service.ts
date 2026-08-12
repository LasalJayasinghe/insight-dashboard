import type { Algorithm, AlgorithmDetail } from "@/lib/algorithm-types";
import apiClient from "./apiClient";

export const algorithmsService = {
  async list(): Promise<Algorithm[]> {
    const res = await apiClient.get<Algorithm[]>("/algorithms");
    return res.data;
  },

  async get(id: string): Promise<AlgorithmDetail> {
    const res = await apiClient.get<AlgorithmDetail>(`/algorithms/${id}`);
    return res.data;
  },

  async toggle(id: string): Promise<Algorithm> {
    const res = await apiClient.post<Algorithm>(`/algorithms/${id}/toggle`);
    return res.data;
  },
};
