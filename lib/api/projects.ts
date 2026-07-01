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
