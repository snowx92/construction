import { apiFetch } from "./client";
import type { MarketPrice } from "./types";

export function listMarketPrices(country = "OM", companyId?: string, limit = 20) {
  return apiFetch<{ prices: MarketPrice[] }>("/api/market-prices", {
    query: { country, companyId, limit },
  });
}
