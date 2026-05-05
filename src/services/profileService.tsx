import apiClient from "./apiClient";

export async function getProfile() {
  const res = await apiClient.get("/profile");
  return res.data;
}