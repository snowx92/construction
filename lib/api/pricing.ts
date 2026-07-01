import { apiFetch } from "./client";
import type {
  OverrideRateBody,
  PricingRun,
  PricingTotals,
  StartPricingRunBody,
} from "./types";

export function startPricingRun(body: StartPricingRunBody) {
  return apiFetch<{ pricingRunId: string; status: string }>("/api/pricing/runs", {
    method: "POST",
    body,
  });
}

export function overrideRate(pricingRunId: string, body: OverrideRateBody) {
  return apiFetch<{
    pricingRunId: string;
    boqItemId: string;
    finalRate: number;
    totals: PricingTotals;
  }>(`/api/pricing/runs/${pricingRunId}/rates`, {
    method: "PUT",
    body,
  });
}

export function approvePricingRun(
  pricingRunId: string,
  body: { companyId: string; projectId: string }
) {
  return apiFetch<{ pricingRunId: string; approving: boolean; jobId?: string }>(
    `/api/pricing/runs/${pricingRunId}/approve`,
    { method: "POST", body }
  );
}

export function listPricingHistory(companyId: string, projectId?: string) {
  return apiFetch<PricingRun[] | { runs: PricingRun[] }>("/api/pricing/history", {
    query: { companyId, projectId },
  }).then((d) => (Array.isArray(d) ? d : d.runs ?? []));
}
