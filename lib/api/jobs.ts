import { apiFetch } from "./client";
import type { JobView } from "./types";

export function getJob(jobId: string, companyId: string, projectId?: string) {
  return apiFetch<JobView>(`/api/jobs/${jobId}`, {
    query: { companyId, projectId },
  });
}

export function retryJob(jobId: string, body: { companyId: string; projectId: string }) {
  return apiFetch<{ jobId: string; retried: boolean }>(`/api/jobs/${jobId}/retry`, {
    method: "POST",
    body,
  });
}

export function cancelJob(jobId: string, body: { companyId: string; projectId: string }) {
  return apiFetch<{ jobId: string; cancelled: boolean }>(`/api/jobs/${jobId}/cancel`, {
    method: "POST",
    body,
  });
}
