// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { loadEnv, type Plugin } from "vite";

/**
 * Fails a production build when VITE_API_BASE_URL is missing, still pointing at
 * localhost, or served over plain HTTP.
 *
 * Vite inlines VITE_* values into the bundle at build time, so a wrong value is
 * not something you can correct in the Cloudflare dashboard afterwards — it is
 * baked into the JavaScript you just deployed. The failure mode is quiet: the
 * app loads, renders, and every API call dies in the browser. Catching it here
 * costs a rebuild; catching it after `wrangler deploy` costs a debugging
 * session.
 */
function validateProductionEnv(): Plugin {
  return {
    name: "alertme:validate-production-env",
    // `config` runs before the build starts, so a throw here stops it.
    config(_config, { command, mode }) {
      // `build:dev` builds with --mode development against a local API; only
      // gate the real production build.
      if (command !== "build" || mode !== "production") return;

      const env = loadEnv(mode, process.cwd(), "VITE_");
      const apiBaseUrl = env.VITE_API_BASE_URL?.trim();
      const hint = "Set it in .env.production (see .env.example).";

      if (!apiBaseUrl) {
        throw new Error(`[env] VITE_API_BASE_URL is not set. ${hint}`);
      }

      let url: URL;
      try {
        url = new URL(apiBaseUrl);
      } catch {
        throw new Error(
          `[env] VITE_API_BASE_URL must be an absolute URL, got "${apiBaseUrl}". ${hint}`,
        );
      }

      if (/REPLACE|YOUR[-_]/i.test(apiBaseUrl)) {
        throw new Error(
          `[env] VITE_API_BASE_URL is still the placeholder from .env.example ` +
            `("${apiBaseUrl}"). ${hint}`,
        );
      }

      if (["localhost", "127.0.0.1", "[::1]", "0.0.0.0"].includes(url.hostname)) {
        throw new Error(
          `[env] VITE_API_BASE_URL points at "${url.hostname}". A production build ships ` +
            `this value to every visitor's browser, where it resolves to their own ` +
            `machine, not your server. ${hint}`,
        );
      }

      if (url.protocol !== "https:") {
        throw new Error(
          `[env] VITE_API_BASE_URL must use https, got "${url.protocol}//". Cloudflare ` +
            `serves this app over HTTPS and browsers block mixed-content requests to an ` +
            `http:// API. Give the API a domain with TLS first — dot-net-app/deploy/Caddyfile ` +
            `issues the certificate automatically. ${hint}`,
        );
      }

      if (!url.pathname.replace(/\/+$/, "").endsWith("/api")) {
        throw new Error(
          `[env] VITE_API_BASE_URL must include the /api suffix, got "${apiBaseUrl}". ` +
            `src/config/env.tsx strips it back off to build the SignalR hub URL. ${hint}`,
        );
      }
    },
  };
}

export default defineConfig({
  plugins: [validateProductionEnv()],
  // Pin the deployment target. Nitro otherwise auto-detects the platform from
  // CI environment variables, which is convenient until a build runs somewhere
  // that looks like Vercel or Netlify and quietly emits the wrong output shape.
  nitro: { preset: "cloudflare-module" },
});
