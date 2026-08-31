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

## Notes

- Dividend-related news cards are prioritized when payment date information is available.
- If API base URL needs to change, update environment files (`.env`, `.env.development`, `.env.production`).
