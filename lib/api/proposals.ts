import { apiFetch } from "./client";
import type {
  GenerateProposalBody,
  RegenerateSectionBody,
} from "./types";

export function generateProposal(body: GenerateProposalBody) {
  return apiFetch<{ proposalId: string; status: string }>("/api/proposals", {
    method: "POST",
    body,
  });
}

export function regenerateSection(proposalId: string, body: RegenerateSectionBody) {
  return apiFetch<{ proposalId: string; sectionId?: string; jobId?: string }>(
    `/api/proposals/${proposalId}/sections/regenerate`,
    { method: "POST", body }
  );
}

export function approveProposal(
  proposalId: string,
  body: { companyId: string; projectId: string }
) {
  return apiFetch<{ proposalId: string; status: string }>(
    `/api/proposals/${proposalId}/approve`,
    { method: "POST", body }
  );
}

export function lockProposal(
  proposalId: string,
  body: { companyId: string; projectId: string }
) {
  return apiFetch<{ proposalId: string; status: string }>(
    `/api/proposals/${proposalId}/lock`,
    { method: "POST", body }
  );
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
