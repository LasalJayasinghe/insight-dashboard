// Central access point for the VITE_* values Vite inlines at build time.
//
// These are build-time constants, not runtime configuration: `vite build` bakes
// the literal strings into the bundle, so changing one means rebuilding and
// redeploying — setting a Worker secret in the Cloudflare dashboard does not
// affect them. The production build is gated by the validator in
// vite.config.ts, which refuses to emit a bundle still pointing at localhost.

// Trailing slashes are stripped so callers can safely concatenate `/path`.
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api").replace(
  /\/+$/,
  "",
);

export const ENV = {
  /** Base URL of the .NET API, including the `/api` suffix. */
  API_BASE_URL,

  /**
   * Same host without the `/api` suffix. SignalR hubs are mapped at the root
   * (`/hubs/crypto`), so they are not reachable through the `/api` prefix.
   */
  API_ORIGIN: API_BASE_URL.replace(/\/api$/, ""),

  /** Public Google OAuth client ID. Empty disables the Google sign-in button. */
  GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID || "",
};

// Cloudflare serves the dashboard over HTTPS, and browsers block an HTTPS page
// from calling an http:// API — every request fails as mixed content before it
// reaches the network. That failure shows up as an opaque "Network Error" in
// axios, so name it explicitly here.
if (import.meta.env.PROD && typeof window !== "undefined") {
  if (window.location.protocol === "https:" && API_BASE_URL.startsWith("http://")) {
    console.error(
      `[env] Mixed content: this page is HTTPS but VITE_API_BASE_URL is "${API_BASE_URL}". ` +
        `The browser will block every API call. Give the API a domain with TLS ` +
        `(deploy/Caddyfile in dot-net-app does this) and rebuild with an https:// URL.`,
    );
  }
}
