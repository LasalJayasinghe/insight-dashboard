// Mock data shaped like the .NET API responses.
// Replace these with fetch() calls to your ASP.NET Core endpoints.
export interface Stock {
  symbol: string;
  name: string;
  price: number;
  changePct: number;
  volume: number;
}

export interface Transaction {
  id: string;
  type: "BUY" | "SELL";
  symbol: string;
  qty: number;
  price: number;
  at: string;
}

export const mockStocks: Stock[] = [
  { symbol: "AAPL", name: "Apple Inc.", price: 234.18, changePct: 1.42, volume: 48_213_000 },
  { symbol: "NVDA", name: "NVIDIA Corp.", price: 882.4, changePct: 3.18, volume: 92_440_000 },
  { symbol: "TSLA", name: "Tesla Inc.", price: 248.75, changePct: -2.41, volume: 71_220_000 },
  { symbol: "MSFT", name: "Microsoft", price: 428.92, changePct: 0.62, volume: 22_140_000 },
  { symbol: "AMZN", name: "Amazon.com", price: 188.3, changePct: -0.85, volume: 33_410_000 },
  { symbol: "META", name: "Meta Platforms", price: 512.04, changePct: 2.07, volume: 18_902_000 },
  { symbol: "GOOGL", name: "Alphabet", price: 174.66, changePct: 0.31, volume: 24_500_000 },
  {
    symbol: "AMD",
    name: "Advanced Micro Devices",
    price: 162.18,
    changePct: -1.18,
    volume: 41_330_000,
  },
];

export const mockTransactions: Transaction[] = [
  { id: "t1", type: "BUY", symbol: "NVDA", qty: 12, price: 868.1, at: "2h ago" },
  { id: "t2", type: "SELL", symbol: "TSLA", qty: 5, price: 252.4, at: "5h ago" },
  { id: "t3", type: "BUY", symbol: "AAPL", qty: 20, price: 230.0, at: "1d ago" },
  { id: "t4", type: "BUY", symbol: "META", qty: 3, price: 504.2, at: "2d ago" },
];

export const mockChart = Array.from({ length: 30 }, (_, i) => ({
  day: i + 1,
  value: 120000 + Math.sin(i / 3) * 4500 + i * 380 + Math.random() * 1200,
}));
