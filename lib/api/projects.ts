import { apiFetch } from "./client";
import type {
  ChangeStatusBody,
  CreateProjectBody,
  Project,
  UpdateProjectBody,
} from "./types";

function normalize(p: Project & { id?: string }): Project {
  return p.projectId ? p : { ...p, projectId: p.id ?? "" };
}

function unwrapList(data: Project[] | { projects: Project[] }): Project[] {
  const list = Array.isArray(data) ? data : data.projects ?? [];
  return (list as (Project & { id?: string })[]).map(normalize).filter((p) => !!p.projectId);
}

export function listProjects(companyId: string) {
  return apiFetch<Project[] | { projects: Project[] }>("/api/projects", {
    query: { companyId },
  }).then(unwrapList);
}

export function getProject(projectId: string, companyId: string) {
  return apiFetch<Project | { project: Project }>(`/api/projects/${projectId}`, {
    query: { companyId },
  }).then((d) => ("project" in (d as object) ? (d as { project: Project }).project : (d as Project)));
}

export function createProject(body: CreateProjectBody) {
  return apiFetch<{ projectId: string; status: string }>("/api/projects", { method: "POST", body });
}

export function updateProject(projectId: string, body: UpdateProjectBody) {
  return apiFetch<{ projectId: string; updated: boolean }>(`/api/projects/${projectId}`, {
    method: "PUT",
    body,
  });
}

export function changeProjectStatus(projectId: string, body: ChangeStatusBody) {
  return apiFetch<{ projectId: string; status: string }>(`/api/projects/${projectId}/status`, {
    method: "POST",
    body,
  });
}

export function archiveProject(projectId: string, companyId: string) {
  return apiFetch<{ projectId: string; status: string }>(`/api/projects/${projectId}/archive`, {
    method: "POST",
    body: { companyId },
  });
}

export function restoreProject(projectId: string, companyId: string) {
  return apiFetch<{ projectId: string; status: string }>(`/api/projects/${projectId}/restore`, {
    method: "POST",
    body: { companyId },
  });
}

export function reconcileProject(projectId: string, companyId: string) {
  return apiFetch<{
    projectId: string;
    status?: string;
    reconciliation?: Record<string, unknown>;
    proposalReconciliation?: Record<string, unknown>;
  }>(`/api/projects/${projectId}/reconcile`, {
    method: "POST",
    body: { companyId },
  });
}

export interface BoqItem {
  boqItemId?: string;
  id?: string;
  description?: string;
  quantity?: number;
  unit?: string;
  unitRate?: number;
  status?: string;
  category?: string;
  notes?: string;
}

export function listBoqItems(projectId: string, companyId: string) {
  return apiFetch<{ items: BoqItem[] }>(`/api/projects/${projectId}/boq`, {
    query: { companyId },
  }).then((d) =>
    (d.items ?? []).map((item) => ({
      ...item,
      boqItemId: item.boqItemId ?? item.id ?? "",
    }))
  );
}

export function extractBoq(projectId: string, companyId: string) {
  return apiFetch<{ started: boolean; runId?: string; reason?: string }>(
    `/api/projects/${projectId}/boq/extract`,
    { method: "POST", body: { companyId } }
  );
}

export function updateBoqItem(
  projectId: string,
  boqItemId: string,
  body: {
    companyId: string;
    description?: string;
    quantity?: number;
    unit?: string;
    unitRate?: number;
    status?: string;
    notes?: string;
  }
) {
  return apiFetch<{ boqItemId: string; updated: boolean }>(
    `/api/projects/${projectId}/boq/${boqItemId}`,
    { method: "PUT", body }
  );
}

export interface RequirementItem {
  requirementId?: string;
  id?: string;
  type?: string;
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  sourceClause?: string;
}

export function listRequirements(projectId: string, companyId: string) {
  return apiFetch<{ requirements: RequirementItem[] }>(`/api/projects/${projectId}/requirements`, {
    query: { companyId },
  }).then((d) =>
    (d.requirements ?? []).map((req) => ({
      ...req,
      requirementId: req.requirementId ?? req.id ?? "",
    }))
  );
}

export interface RiskItem {
  riskId?: string;
  id?: string;
  title?: string;
  description?: string;
  level?: string;
  severity?: string;
  category?: string;
  status?: string;
  clause?: string;
  sourceCitation?: string;
}

export function listRisks(projectId: string, companyId: string) {
  return apiFetch<{ risks: RiskItem[] }>(`/api/projects/${projectId}/risks`, {
    query: { companyId },
  }).then((d) =>
    (d.risks ?? []).map((risk) => ({
      ...risk,
      riskId: risk.riskId ?? risk.id ?? "",
    }))
  );
}
