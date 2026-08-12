import apiClient from "./apiClient";

export interface UserSettings {
  emailNotifications: boolean;
  priceAlerts: boolean;
  twoFactorAuthentication: boolean;
  usdtToLkrRate: number;
  lkrToUsdtRate: number;
}

type ApiSettings = {
  emailNotifications: boolean;
  priceAlerts: boolean;
  twoFactorAuthentication: boolean;
  usdtToLkrRate: number;
  lkrToUsdtRate: number;
};

export const settingsService = {
  async get(): Promise<UserSettings> {
    const res = await apiClient.get<ApiSettings>("/settings");
    return res.data;
  },

  async update(input: UserSettings): Promise<UserSettings> {
    const res = await apiClient.put<ApiSettings>("/settings", input);
    return res.data;
  },
};
