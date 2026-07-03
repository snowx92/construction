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

export function updateCompliance(
  complianceId: string,
  body: { companyId: string; projectId: string; checklist?: unknown[]; status?: string },
) {
  return apiFetch<{ complianceId: string; updated: boolean }>(
    `/api/commercial/compliance/${complianceId}`,
    { method: "PATCH", body },
  );
}

export function updateProgramme(
  programmeId: string,
  body: { companyId: string; projectId: string; milestones?: unknown[]; criticalPath?: string[]; status?: string },
) {
  return apiFetch<{ programmeId: string; updated: boolean }>(
    `/api/commercial/schedule/${programmeId}`,
    { method: "PATCH", body },
  );
}

export function updateProgrammeActivity(
  programmeId: string,
  activityId: string,
  body: { companyId: string; projectId: string; name?: string; durationDays?: number; dependencies?: string[] },
) {
  return apiFetch<{ activityId: string; updated: boolean }>(
    `/api/commercial/schedule/${programmeId}/activities/${activityId}`,
    { method: "PATCH", body },
  );
}
