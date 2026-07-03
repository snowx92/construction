import { apiFetch } from "./client";
import type {
  CreateExportBody,
  ExportDownloadResponse,
  ExportRecord,
} from "./types";

export function createExport(body: CreateExportBody) {
  return apiFetch<{
    exportId: string;
    jobId?: string;
    status: string;
    exportType: string;
  }>("/api/exports", { method: "POST", body });
}

export function getExport(exportId: string, companyId: string, projectId: string) {
  return apiFetch<ExportRecord>(`/api/exports/${exportId}`, {
    query: { companyId, projectId },
  });
}

export function getExportDownloadUrl(exportId: string, companyId: string, projectId: string) {
  return apiFetch<ExportDownloadResponse>(`/api/exports/${exportId}/download-url`, {
    query: { companyId, projectId },
  });
}

export function deleteExport(
  exportId: string,
  body: { companyId: string; projectId: string }
) {
  return apiFetch<{ exportId: string; deleted: boolean }>(`/api/exports/${exportId}`, {
    method: "DELETE",
    body,
  });
}

export function validateExport(body: {
  companyId: string;
  projectId: string;
  exportType?: string;
  proposalId?: string;
  pricingRunId?: string;
}) {
  return apiFetch<{ warnings: Array<{ code: string; message: string; severity?: string }> }>(
    "/api/exports/validate",
    { method: "POST", body },
  );
}
