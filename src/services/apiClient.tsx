import { ENV } from "@/config/env";
import axios from "axios";
import { tokenService } from "./tokenService";

const REFRESH_ENDPOINT = `${ENV.API_BASE_URL}/auth/refresh`;

function clearSession() {
  ["token", "refreshToken", "firstName", "lastName"].forEach((key) => localStorage.removeItem(key));
}

/**
 * Create Axios instance
 */
const apiClient = axios.create({
  baseURL: ENV.API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000, // prevent hanging requests
});

/**
 * REQUEST INTERCEPTOR
 * - Attach JWT token if available
 */
apiClient.interceptors.request.use(
  (config) => {
    const token = tokenService.get();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

async function executeRefresh(): Promise<string | null> {
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) return null;

  try {
    const refreshResponse = await axios.post(REFRESH_ENDPOINT, { refreshToken });
    const nextToken = refreshResponse.data?.token ?? refreshResponse.data?.accessToken;
    const nextRefreshToken = refreshResponse.data?.refreshToken;

    if (nextToken) {
      tokenService.set(nextToken);
      if (nextRefreshToken) {
        localStorage.setItem("refreshToken", nextRefreshToken);
      }
      return nextToken;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * RESPONSE INTERCEPTOR
 * - Handle global errors
 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    const originalRequest = error?.config as {
      _retry?: boolean;
      headers?: Record<string, string>;
      url?: string;
    };

    if (status) {
      console.error(`API Error [${status}]`, error.response?.data);

      switch (status) {
        case 401:
          // Try refresh flow once before forcing logout.
          if (
            originalRequest &&
            !originalRequest._retry &&
            !String(originalRequest.url ?? "").includes("/auth/refresh")
          ) {
            originalRequest._retry = true;

            if (!isRefreshing) {
              isRefreshing = true;
              refreshPromise = executeRefresh().finally(() => {
                isRefreshing = false;
                refreshPromise = null;
              });
            }

            const nextToken = await refreshPromise;
            if (nextToken) {
              originalRequest.headers = originalRequest.headers ?? {};
              originalRequest.headers.Authorization = `Bearer ${nextToken}`;
              return apiClient(originalRequest);
            }
          }

          clearSession();

          if (window.location.pathname !== "/login") {
            window.location.href = "/login";
          }
          break;

        case 403:
          console.error("Forbidden: You don’t have access");
          break;

        case 404:
          console.error("Endpoint not found");
          break;

        case 500:
          console.error("Server error");
          break;

        default:
          console.error("Unhandled API error");
      }
    } else {
      console.error("Network error:", error.message);
    }

    return Promise.reject(error);
  },
);

export default apiClient;
