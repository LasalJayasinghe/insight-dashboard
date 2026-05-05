import apiClient from "./apiClient";

export async function getProfile() {
  const res = await apiClient.get("/profile");
  return res.data;
}


export async function updateProfile(profileData: any) {
  const res = await apiClient.put("/profile", profileData);
  return res.data;
}

export async function updateTelegramId(telegramId: string): Promise<any> {
  const res = await apiClient.put("/profile/telegram", { telegramId });
  return res.data;
}


export async function changePassword(pwd: { current: string; next: string }): Promise<{ success: boolean; message?: string }> {
  try {
    await apiClient.post("/auth/change-password", {
      CurrentPassword: pwd.current,
      NewPassword: pwd.next,
    });
    ["token", "firstName", "lastName", "refreshToken"].forEach(key => localStorage.removeItem(key));
    return { success: true };
  } catch (error: any) {
    ["token", "firstName", "lastName", "refreshToken"].forEach(key => localStorage.removeItem(key));
    const message = error?.response?.data?.message || "Failed to change password.";
    return { success: false, message };
  }
}

