import { apiFetch } from "./client";
import type {
  GenerateProposalBody,
  Proposal,
  ProposalSection,
  RegenerateSectionBody,
  UpdateProposalBody,
  UpdateProposalSectionBody,
} from "./types";

function normalizeProposal(p: Proposal & { id?: string }): Proposal {
  return p.proposalId ? p : { ...p, proposalId: p.id ?? "" };
}

export function generateProposal(body: GenerateProposalBody) {
  return apiFetch<{ proposalId: string; jobId?: string; status: string }>("/api/proposals", {
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

export function updateProposalSection(
  proposalId: string,
  sectionId: string,
  body: UpdateProposalSectionBody
) {
  return apiFetch<{ section: ProposalSection }>(
    `/api/proposals/${proposalId}/sections/${sectionId}`,
    { method: "PUT", body }
  );
}

export function updateProposal(proposalId: string, body: UpdateProposalBody) {
  return apiFetch<{ proposalId: string; title: string }>(
    `/api/proposals/${proposalId}`,
    { method: "PATCH", body }
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

export {
  generateComplianceChecklist,
  generateSchedule,
  getLatestCompliance,
  getLatestSchedule,
} from "./commercial";

export function getLatestProposal(companyId: string, projectId: string, includeContent = false) {
  return apiFetch<{ proposal: Proposal & { id?: string }; sections: ProposalSection[] }>(
    "/api/proposals/latest",
    { query: { companyId, projectId, includeContent: includeContent ? "true" : undefined } }
  ).then((d) => ({
    proposal: normalizeProposal(d.proposal),
    sections: (d.sections ?? []).map((s) => ({
      ...s,
      content: s.content ?? (s as ProposalSection & { body?: string }).body,
    })),
  }));
}

export function getProposal(
  proposalId: string,
  companyId: string,
  projectId: string,
  includeContent = false
) {
  return apiFetch<{ proposal: Proposal & { id?: string }; sections: ProposalSection[] }>(
    `/api/proposals/${proposalId}`,
    { query: { companyId, projectId, includeContent: includeContent ? "true" : undefined } }
  ).then((d) => ({
    proposal: normalizeProposal(d.proposal),
    sections: (d.sections ?? []).map((s) => ({
      ...s,
      content: s.content ?? (s as ProposalSection & { body?: string }).body,
    })),
  }));
}

export function reconcileProposal(companyId: string, projectId: string) {
  return apiFetch<{
    reconciliation: Record<string, unknown>;
    proposal: Proposal | null;
  }>("/api/proposals/reconcile", {
    method: "POST",
    body: { companyId, projectId },
  });
}

export function deleteProposal(
  proposalId: string,
  body: { companyId: string; projectId: string }
) {
  return apiFetch<{ proposalId: string; deleted: boolean; sectionsDeleted?: number }>(
    `/api/proposals/${proposalId}`,
    { method: "DELETE", body }
  );
}
