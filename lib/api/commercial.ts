import { apiFetch } from "./client";
import type { ComplianceRun, ProgrammeActivity, ProgrammeRun } from "./types";

export function getLatestCompliance(companyId: string, projectId: string) {
  return apiFetch<{ compliance: ComplianceRun | null }>("/api/commercial/compliance", {
    query: { companyId, projectId },
  }).then((d) => d.compliance ?? null);
}

export function getLatestSchedule(companyId: string, projectId: string) {
  return apiFetch<{ programme: ProgrammeRun | null; activities: ProgrammeActivity[] }>(
    "/api/commercial/schedule",
    { query: { companyId, projectId } },
  ).then((d) => ({
    programme: d.programme ?? null,
    activities: d.activities ?? [],
  }));
}

export function generateComplianceChecklist(body: { companyId: string; projectId: string }) {
  return apiFetch<{ jobId?: string }>("/api/commercial/compliance/generate", {
    method: "POST",
    body,
  });
}

export function generateSchedule(body: { companyId: string; projectId: string }) {
  return apiFetch<{ jobId?: string }>("/api/commercial/schedule/generate", {
    method: "POST",
    body,
  });
}
