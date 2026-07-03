"use client";

import { useEffect, useState } from "react";
import { useAuth } from "./auth-context";
import { listMarketPrices } from "./api/market-prices";
import type { MarketPrice } from "./api/types";

export function useMarketPrices(country = "OM", limit = 8) {
  const { profile } = useAuth();
  const companyId = profile?.activeCompanyId;
  const [prices, setPrices] = useState<MarketPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    listMarketPrices(country, companyId || undefined, limit)
      .then((data) => {
        if (!cancelled) setPrices(data.prices ?? []);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load market prices");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [country, companyId, limit]);

  return { prices, loading, error };
}
