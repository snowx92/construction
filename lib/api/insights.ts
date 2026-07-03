import { apiFetch } from "./client";
import type { CompanyInsight } from "./types";

export function listInsights(companyId: string, limit = 50) {
  return apiFetch<{ insights: CompanyInsight[]; unreadCount: number }>("/api/insights", {
    query: { companyId, limit },
  });
}

export function markInsightRead(insightId: string, companyId: string) {
  return apiFetch<{ insightId: string; read: boolean }>(`/api/insights/${insightId}/read`, {
    method: "POST",
    body: { companyId },
  });
}

export function markAllInsightsRead(companyId: string) {
  return apiFetch<{ marked: number }>("/api/insights/read-all", {
    method: "POST",
    body: { companyId },
  });
}
