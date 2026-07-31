import axiosClient from "./apiClient";
import { tokenService } from "./tokenService";

export const login = async (Username: string, Password: string) => {
  const { data } = await axiosClient.post("/auth/login", {
    Username,
    Password,
  });

  tokenService.set(data.token);
  localStorage.setItem("firstName", data.firstName);
  localStorage.setItem("lastName", data.lastName);
  localStorage.setItem("refreshToken", data.refreshToken);

  return { ok: true, ...data };
};
