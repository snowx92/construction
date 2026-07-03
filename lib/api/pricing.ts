import { apiFetch } from "./client";
import type {
  OverrideRateBody,
  PricingRun,
  PricingTotals,
  StartPricingRunBody,
  UpdatePricingRunBody,
} from "./types";

export function startPricingRun(body: StartPricingRunBody) {
  return apiFetch<{ pricingRunId: string; status: string }>("/api/pricing/runs", {
    method: "POST",
    body,
  });
}

export function updatePricingLineItem(pricingRunId: string, body: OverrideRateBody) {
  return apiFetch<{
    pricingRunId: string;
    boqItemId: string;
    lineItem: Record<string, unknown>;
    totals: PricingTotals;
  }>(`/api/pricing/runs/${pricingRunId}/rates`, {
    method: "PUT",
    body,
  });
}

/** @deprecated use updatePricingLineItem */
export const overrideRate = updatePricingLineItem;

export function updatePricingRun(pricingRunId: string, body: UpdatePricingRunBody) {
  return apiFetch<{
    pricingRunId: string;
    marginPolicy: UpdatePricingRunBody["marginPolicy"];
    totals: PricingTotals;
    currency?: string;
  }>(`/api/pricing/runs/${pricingRunId}`, {
    method: "PATCH",
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

function normalizePricingRun(run: PricingRun & { id?: string; lineItems?: unknown[] }): PricingRun {
  const pricingRunId = run.pricingRunId ?? run.id ?? "";
  return pricingRunId ? { ...run, pricingRunId } : run;
}

export function getLatestPricingRun(companyId: string, projectId: string) {
  return apiFetch<{ pricingRun: PricingRun & { id?: string } }>("/api/pricing/runs/latest", {
    query: { companyId, projectId },
  }).then((d) => normalizePricingRun(d.pricingRun));
}

export function getPricingRun(pricingRunId: string, companyId: string, projectId: string) {
  return apiFetch<{ pricingRun: PricingRun & { id?: string } }>(
    `/api/pricing/runs/${pricingRunId}`,
    { query: { companyId, projectId } }
  ).then((d) => normalizePricingRun(d.pricingRun));
}

export function deletePricingRun(
  pricingRunId: string,
  body: { companyId: string; projectId: string }
) {
  return apiFetch<{ pricingRunId: string; deleted: boolean }>(
    `/api/pricing/runs/${pricingRunId}`,
    { method: "DELETE", body }
  );
}
