import axiosClient from "./apiClient";
import { tokenService } from "./tokenService";

export const login = async (Username: string, Password: string) => {
  const { data } = await axiosClient.post("/auth/login", {
    Username,
    Password,
  });

  if (!data.ok) {
    return { ok: false, error: data.error || "Login failed" };
  }

  tokenService.set(data.token);
  localStorage.setItem("firstName", data.firstName);
  localStorage.setItem("lastName", data.lastName);
  localStorage.setItem("refreshToken", data.refreshToken);

  return data;
};
