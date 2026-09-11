# Insight Dashboard

React frontend for the AlertMe trading platform.

## Overview

`insight-dashboard` is the user-facing SPA for stocks, crypto, watchlists, portfolios, alerts, and market news. It connects to the .NET backend in `dot-net-app`.

## Tech Stack

- React 19 + Vite
- TanStack Router
- TailwindCSS + Radix UI
- Recharts + Lightweight Charts
- Axios API client

## Key Features

- Stocks overview and individual stock detail view
- Interactive stock charts and intraday metrics
- Dividend snapshot panel in stock detail view
- Market news feed with dividend payment-date emphasis
- Watchlist and portfolio management
- Authenticated API access with JWT refresh flow

## API Dependencies

This app expects the backend APIs from `dot-net-app`, including:

- `/api/stock/*`
- `/api/watchlist/*`
- `/api/portfolio/*`
- `/api/news/*`
- `/api/dividends/symbol/{symbol}`

## Development

From `insight-dashboard`:

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
```

## Deploying to Cloudflare Workers

The app builds to a Cloudflare Worker (TanStack Start SSR via Nitro's
`cloudflare-module` preset). The API stays on its own VPS — only the frontend
runs on Cloudflare.

### One-time setup

1. **Fill in `.env.production`.** Copy `.env.example` if the file is missing.
   `VITE_API_BASE_URL` must be the public HTTPS URL of the .NET API including
   `/api` — the build refuses to run otherwise (see below).

2. **Authenticate wrangler:**

   ```bash
   npx wrangler login
   ```

3. **Deploy:**

   ```bash
   npm run deploy
   ```

   This builds and uploads, printing the Worker URL
   (`https://insight-dashboard.<account>.workers.dev`).

### Wire up the two sides

The frontend and API each have to know about the other, and each failure is
silent from the other end:

| Where | Setting | Value |
| --- | --- | --- |
| `insight-dashboard/.env.production` | `VITE_API_BASE_URL` | `https://<api-domain>/api` |
| `dot-net-app/deploy/.env` | `FRONTEND_ORIGIN` | the exact Worker URL, no trailing slash |
| Google Cloud console | Authorized JavaScript origins | the exact Worker URL |

Restart the API stack (`docker compose up -d`) after changing `FRONTEND_ORIGIN`;
`Program.cs` only reads it at startup.

### Why the build fails fast

`VITE_*` values are inlined into the JavaScript bundle at build time, so a wrong
API URL cannot be corrected in the Cloudflare dashboard — it ships to every
visitor's browser. A build pointing at `localhost` produces an app that loads
fine and then fails every request, which is slow to diagnose. `vite.config.ts`
therefore rejects a production build whose `VITE_API_BASE_URL` is missing, still
a placeholder, non-HTTPS, `localhost`, or missing the `/api` suffix.

`npm run build:dev` skips these checks, since it deliberately targets a local API.

### Other commands

```bash
npm run preview:cf   # run the built Worker locally under workerd
npm run cf:tail      # stream live logs from the deployed Worker
```

## Notes

- Dividend-related news cards are prioritized when payment date information is available.
- `src/config/env.tsx` is the single place `VITE_*` values are read. It also derives
  `API_ORIGIN` (the API URL without `/api`) for the SignalR hub at `/hubs/crypto`.
- SignalR connects from the browser straight to the API, not through Cloudflare,
  so the Worker imposes no WebSocket limits on it.
