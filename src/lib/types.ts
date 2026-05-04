// Domain types shared across the alerts module.
// Mirrors the .NET API contract.

export type AlertType = "ABOVE" | "BELOW";
export type AlertStatus = "ACTIVE" | "INACTIVE";

export interface StockAlert {
  id: string;
  symbol: string;
  type: AlertType;
  targetPrice: number;
  status: AlertStatus;
  createdAt: string; // ISO date
}

export interface AlertInput {
  symbol: string;
  type: AlertType;
  targetPrice: number;
  status: AlertStatus;
}
