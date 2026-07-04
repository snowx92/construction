"use client";

import { useEffect, useRef, useState } from "react";
import { collection, doc, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { db } from "./firebase";
import { useAuth } from "./auth-context";
import { getLatestProposal, getProposal } from "./api/proposals";
import { proposalSectionText } from "./proposal-section-content";
import type { Proposal, ProposalSection } from "./api/types";

function normalizeSection(data: Record<string, unknown>, sectionId: string): ProposalSection {
  const sectionKey = data.sectionKey as ProposalSection["sectionKey"];
  const raw = data.content ?? data.body;
  return {
    sectionId,
    sectionKey,
    title: data.title as string | undefined,
    content: proposalSectionText(raw, sectionKey) || undefined,
    status: data.status as ProposalSection["status"],
    wordCount: data.wordCount as number | undefined,
    updatedAt: data.updatedAt as ProposalSection["updatedAt"],
  };
}

export function useProposals(projectId: string | null | undefined) {
  const { profile } = useAuth();
  const companyId = profile?.activeCompanyId;
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const apiFetched = useRef(false);

  useEffect(() => {
    apiFetched.current = false;
    if (!companyId || !projectId) { setLoading(false); return; }
    setLoading(true);
    const ref = collection(db, "companies", companyId, "projects", projectId, "proposals");
    let q;
    try { q = query(ref, orderBy("createdAt", "desc")); } catch { q = ref; }
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: Proposal[] = snap.docs.map((d) => ({
          proposalId: d.id,
          companyId,
          projectId,
          ...(d.data() as Omit<Proposal, "proposalId" | "companyId" | "projectId">),
        }));
        setProposals(list);
        setLoading(false);

        if (list.length === 0 && !apiFetched.current) {
          apiFetched.current = true;
          getLatestProposal(companyId, projectId)
            .then(({ proposal }) => { if (proposal) setProposals([proposal]); })
            .catch(() => { /* no proposal yet */ });
        }
      },
      (err) => {
        setError(err.message);
        setLoading(false);
        if (!apiFetched.current) {
          apiFetched.current = true;
          getLatestProposal(companyId, projectId)
            .then(({ proposal }) => { if (proposal) setProposals([proposal]); })
            .catch((e) => setError(e instanceof Error ? e.message : "Failed to load proposals"));
        }
      }
    );
    return unsub;
  }, [companyId, projectId]);

  return { proposals, loading, error };
}

export function useProposal(projectId: string | null | undefined, proposalId: string | null | undefined) {
  const { profile } = useAuth();
  const companyId = profile?.activeCompanyId;
  const [proposal, setProposal] = useState<Proposal | null>(null);

  useEffect(() => {
    if (!companyId || !projectId || !proposalId) return;
    const ref = doc(db, "companies", companyId, "projects", projectId, "proposals", proposalId);
    const unsub = onSnapshot(ref, (snap) => {
      if (!snap.exists()) { setProposal(null); return; }
      setProposal({
        proposalId: snap.id,
        companyId,
        projectId,
        ...(snap.data() as Omit<Proposal, "proposalId" | "companyId" | "projectId">),
      });
    });
    return unsub;
  }, [companyId, projectId, proposalId]);

  return proposal;
}

/**
 * Sections live in `proposalSections` filtered by `proposalId` field.
 */
export function useProposalSections(projectId: string | null | undefined, proposalId: string | null | undefined) {
  const { profile } = useAuth();
  const companyId = profile?.activeCompanyId;
  const [sections, setSections] = useState<ProposalSection[]>([]);
  const [loading, setLoading] = useState(true);
  const apiFetched = useRef(false);

  useEffect(() => {
    apiFetched.current = false;
    if (!companyId || !projectId || !proposalId) { setLoading(false); return; }
    setLoading(true);
    const ref = collection(db, "companies", companyId, "projects", projectId, "proposalSections");
    const q = query(ref, where("proposalId", "==", proposalId));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) =>
          normalizeSection(d.data() as Record<string, unknown>, d.id)
        );
        list.sort((a, b) => String(a.sectionKey).localeCompare(String(b.sectionKey)));
        setSections(list);
        setLoading(false);

        if (list.length === 0 && !apiFetched.current) {
          apiFetched.current = true;
          getProposal(proposalId, companyId, projectId, true)
            .then(({ proposal, sections: apiSections }) => {
              if (proposal.proposalId === proposalId && apiSections.length > 0) {
                setSections(apiSections);
              }
            })
            .catch(() => { /* sections not ready */ });
        }
      },
      () => {
        setLoading(false);
        if (!apiFetched.current && companyId && projectId && proposalId) {
          apiFetched.current = true;
          getProposal(proposalId, companyId, projectId, true)
            .then(({ proposal, sections: apiSections }) => {
              if (proposal.proposalId === proposalId && apiSections.length) {
                setSections(apiSections);
              }
            })
            .catch(() => { /* ignore */ });
        }
      }
    );
    return unsub;
  }, [companyId, projectId, proposalId]);

  return { sections, loading };
}
