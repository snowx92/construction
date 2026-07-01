import { apiFetch } from "./client";
import type {
  OpsAiMetrics, OpsAlert, OpsAnalyticsDashboard, OpsAuditLog, OpsBusinessMetrics,
  OpsHealth, OpsJobsMetrics, OpsKnowledgeItem, OpsQualityMetrics, OpsUsage,
} from "./types";

export function getHealth(companyId: string) {
  return apiFetch<OpsHealth>("/api/operations/health", { query: { companyId } });
}

export function getAlerts(companyId: string) {
  return apiFetch<{ alerts: OpsAlert[] } | OpsAlert[]>("/api/operations/alerts", {
    query: { companyId },
  }).then((d) => (Array.isArray(d) ? d : d.alerts ?? []));
}

export function getUsage(companyId: string) {
  return apiFetch<OpsUsage>("/api/operations/usage", { query: { companyId } });
}

export function getAnalyticsDashboard(companyId: string, days?: number) {
  return apiFetch<OpsAnalyticsDashboard>("/api/operations/analytics/dashboard", {
    query: { companyId, days },
  });
}

export function getDailyAnalytics(companyId: string, date?: string) {
  return apiFetch<{ date: string; calls: number; tokens: number }>(
    "/api/operations/analytics/daily",
    { query: { companyId, date } }
  );
}

export function getJobsMetrics(companyId: string) {
  return apiFetch<OpsJobsMetrics>("/api/operations/metrics/jobs", { query: { companyId } });
}

export function getAiMetrics(companyId: string) {
  return apiFetch<OpsAiMetrics>("/api/operations/metrics/ai", { query: { companyId } });
}

export function getBusinessMetrics(companyId: string, days?: number) {
  return apiFetch<OpsBusinessMetrics>("/api/operations/metrics/business", {
    query: { companyId, days },
  });
}

export function getQualityMetrics(companyId: string, days?: number) {
  return apiFetch<OpsQualityMetrics>("/api/operations/metrics/quality", {
    query: { companyId, days },
  });
}

export function getAuditLogs(companyId: string) {
  return apiFetch<{ logs: OpsAuditLog[] } | OpsAuditLog[]>("/api/operations/audit-logs", {
    query: { companyId },
  }).then((d) => (Array.isArray(d) ? d : d.logs ?? []));
}

export function getKnowledge(companyId: string) {
  return apiFetch<{ items: OpsKnowledgeItem[] } | OpsKnowledgeItem[]>(
    "/api/operations/knowledge",
    { query: { companyId } }
  ).then((d) => (Array.isArray(d) ? d : d.items ?? []));
}
