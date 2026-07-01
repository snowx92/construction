"use client";

import { useEffect, useState } from "react";
import { collection, doc, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "./firebase";
import { useAuth } from "./auth-context";
import type { Proposal, ProposalSection } from "./api/types";

export function useProposals(projectId: string | null | undefined) {
  const { profile } = useAuth();
  const companyId = profile?.activeCompanyId;
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
      },
      (err) => { setError(err.message); setLoading(false); }
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

export function useProposalSections(projectId: string | null | undefined, proposalId: string | null | undefined) {
  const { profile } = useAuth();
  const companyId = profile?.activeCompanyId;
  const [sections, setSections] = useState<ProposalSection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!companyId || !projectId || !proposalId) { setLoading(false); return; }
    setLoading(true);
    const ref = collection(db, "companies", companyId, "projects", projectId, "proposals", proposalId, "sections");
    const unsub = onSnapshot(
      ref,
      (snap) => {
        const list: ProposalSection[] = snap.docs.map((d) => ({
          sectionId: d.id,
          ...(d.data() as Omit<ProposalSection, "sectionId">),
        }));
        setSections(list);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return unsub;
  }, [companyId, projectId, proposalId]);

  return { sections, loading };
}
