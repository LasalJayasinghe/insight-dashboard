import apiClient from "./apiClient";
import { apiErrorMessage } from "@/lib/api-error";

export async function getProfile() {
  const res = await apiClient.get("/profile");
  return res.data;
}

export interface ProfileUpdate {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar: string;
}

export async function updateProfile(profileData: ProfileUpdate) {
  const res = await apiClient.put("/profile", profileData);
  return res.data;
}

export async function updateTelegramId(telegramId: string): Promise<unknown> {
  const res = await apiClient.put("/profile/telegram", { telegramId });
  return res.data;
}

export async function changePassword(pwd: {
  current: string;
  next: string;
}): Promise<{ success: boolean; message?: string }> {
  try {
    await apiClient.post("/auth/change-password", {
      CurrentPassword: pwd.current,
      NewPassword: pwd.next,
    });
    ["token", "firstName", "lastName", "refreshToken"].forEach((key) =>
      localStorage.removeItem(key),
    );
    return { success: true };
  } catch (error) {
    return { success: false, message: apiErrorMessage(error, "Failed to change password.") };
  }
}
