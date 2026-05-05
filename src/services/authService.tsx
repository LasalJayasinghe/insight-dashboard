import axiosClient from "./apiClient";

export const login = async (Username: string, Password: string) => {
  const { data } = await axiosClient.post("/auth/login", {
    Username,
    Password,
  });

  return data;
};