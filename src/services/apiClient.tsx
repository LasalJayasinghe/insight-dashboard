import { ENV } from "@/config/env";
import axios from "axios";
import { tokenService } from "./tokenService";

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

/**
 * RESPONSE INTERCEPTOR
 * - Handle global errors
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;

    if (status) {
      console.error(`API Error [${status}]`, error.response?.data);

      switch (status) {
        case 401:
          // Unauthorized → clear session
          localStorage.removeItem("token");

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
