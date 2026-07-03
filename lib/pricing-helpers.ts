import type { PricingRun, PricingTotals } from "./api/types";

/** Backend totals use grandTotal; older UI types used total. */
export function pricingGrandTotal(totals?: PricingTotals | null): number | null {
  if (!totals) return null;
  if (typeof totals.grandTotal === "number") return totals.grandTotal;
  if (typeof totals.total === "number") return totals.total;
  return null;
}

export function pricingCurrency(run: Pick<PricingRun, "currency" | "totals">): string {
  return run.totals?.currency || run.currency || "";
}

export function formatPricingTotal(run: Pick<PricingRun, "currency" | "totals">): string | null {
  const total = pricingGrandTotal(run.totals);
  if (total == null) return null;
  const currency = pricingCurrency(run);
  return currency ? `${total.toLocaleString()} ${currency}` : total.toLocaleString();
}

export function pricingMarginAmount(totals?: PricingTotals | null): number {
  if (!totals) return 0;
  if (typeof totals.margin === "number") return totals.margin;
  return (totals.profit ?? 0) + (totals.overhead ?? 0);
}
