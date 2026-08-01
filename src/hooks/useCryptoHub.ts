/**
 * useCryptoHub.ts
 *
 * React hook that manages the SignalR connection lifecycle for the Crypto
 * Trading Dashboard. Connects on mount, reconnects automatically, and
 * disconnects on unmount. Fires callbacks for TickerUpdate and CandleUpdate.
 */

import { useEffect, useRef, useState } from "react";
import type { HubConnection } from "@microsoft/signalr";
import { createCryptoHubConnection } from "@/services/crypto-service";
import type { TickerData, CandleBar } from "@/services/crypto-service";

export type HubStatus = "connecting" | "connected" | "reconnecting" | "disconnected";

interface UseCryptoHubOptions {
  onTickerUpdate?: (tickers: TickerData[]) => void;
  onCandleUpdate?: (candle: CandleBar & { symbol: string }) => void;
}

export function useCryptoHub({ onTickerUpdate, onCandleUpdate }: UseCryptoHubOptions = {}) {
  const [status, setStatus] = useState<HubStatus>("connecting");
  const connectionRef = useRef<HubConnection | null>(null);

  // Keep callbacks in refs so we never need to re-register hub listeners
  const onTickerRef = useRef(onTickerUpdate);
  const onCandleRef = useRef(onCandleUpdate);
  onTickerRef.current = onTickerUpdate;
  onCandleRef.current = onCandleUpdate;

  useEffect(() => {
    let cancelled = false;

    const start = async () => {
      const connection = await createCryptoHubConnection();
      if (cancelled) return;

      connectionRef.current = connection;

      connection.on("TickerUpdate", (tickers: TickerData[]) => {
        onTickerRef.current?.(tickers);
      });

      connection.on("CandleUpdate", (candle: CandleBar & { symbol: string }) => {
        onCandleRef.current?.(candle);
      });

      connection.onreconnecting(() => setStatus("reconnecting"));
      connection.onreconnected(() => setStatus("connected"));
      connection.onclose(() => setStatus("disconnected"));

      try {
        await connection.start();
        if (!cancelled) setStatus("connected");
      } catch {
        if (!cancelled) setStatus("disconnected");
      }
    };

    void start();

    return () => {
      cancelled = true;
      connectionRef.current?.stop();
    };
  }, []); // intentionally empty — only run once

  return { status };
}
