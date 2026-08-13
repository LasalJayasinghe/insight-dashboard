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

export const googleLogin = async (idToken: string) => {
  const { data } = await axiosClient.post("/auth/google-login", {
    idToken,
  });

  tokenService.set(data.token);
  localStorage.setItem("firstName", data.firstName);
  localStorage.setItem("lastName", data.lastName);
  localStorage.setItem("refreshToken", data.refreshToken);

  return { ok: true, ...data };
};

export const sendOtp = async (email: string, purpose: "SignUp" | "ForgotPassword") => {
  const { data } = await axiosClient.post("/auth/send-otp", {
    email,
    purpose,
  });
  return { ok: true, ...data };
};

export const registerWithOtp = async (
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  otpCode: string
) => {
  const { data } = await axiosClient.post("/auth/register", {
    email,
    password,
    firstName,
    lastName,
    otpCode,
  });

  if (data.token) {
    tokenService.set(data.token);
    localStorage.setItem("firstName", data.firstName || "Trader");
    localStorage.setItem("lastName", data.lastName || "");
    if (data.refreshToken) {
      localStorage.setItem("refreshToken", data.refreshToken);
    }
  }

  return { ok: true, ...data };
};

export const resetPasswordWithOtp = async (
  email: string,
  newPassword: string,
  otpCode: string
) => {
  const { data } = await axiosClient.post("/auth/reset-password", {
    email,
    newPassword,
    otpCode,
  });
  return { ok: true, ...data };
};

