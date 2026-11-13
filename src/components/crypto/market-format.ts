// Coin metadata and formatting shared by the crypto components.

export const COIN_META: Record<string, { name: string; base: string; color: string }> = {
  BTCUSDT: { name: "Bitcoin", base: "BTC", color: "#f7931a" },
  ETHUSDT: { name: "Ethereum", base: "ETH", color: "#627eea" },
  BNBUSDT: { name: "BNB", base: "BNB", color: "#f3ba2f" },
  SOLUSDT: { name: "Solana", base: "SOL", color: "#9945ff" },
  XRPUSDT: { name: "XRP", base: "XRP", color: "#00aae4" },
  ADAUSDT: { name: "Cardano", base: "ADA", color: "#0033ad" },
  DOGEUSDT: { name: "Dogecoin", base: "DOGE", color: "#c2a633" },
};

export const TRACKED_SYMBOLS = Object.keys(COIN_META);

export function fmtPrice(n: number) {
  if (n >= 1000)
    return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (n >= 1) return "$" + n.toFixed(4);
  return "$" + n.toFixed(6);
}

export function fmtVolume(n: number) {
  if (n >= 1e9) return (n / 1e9).toFixed(2) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(2) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(2) + "K";
  return n.toFixed(2);
}
