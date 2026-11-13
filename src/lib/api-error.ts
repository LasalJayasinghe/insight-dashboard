import { isAxiosError } from "axios";

/**
 * Best user-facing message from an API error. Handles the backend's two shapes —
 * `{ message: "..." }` and a plain-string body — and falls back otherwise, so a
 * response object is never rendered as "[object Object]".
 */
export function apiErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError(error)) {
    const data: unknown = error.response?.data;
    if (typeof data === "string" && data.trim()) return data;
    if (data && typeof data === "object" && "message" in data) {
      const message = (data as { message?: unknown }).message;
      if (typeof message === "string" && message.trim()) return message;
    }
  }
  return fallback;
}
