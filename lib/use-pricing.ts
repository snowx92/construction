"use client";

import { useEffect, useState } from "react";
import { collection, doc, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "./firebase";
import { useAuth } from "./auth-context";
import type { PricingLineItem, PricingRun } from "./api/types";

/**
 * Real-time listener for all pricing runs of a project.
 */
export function usePricingRuns(projectId: string | null | undefined) {
  const { profile } = useAuth();
  const companyId = profile?.activeCompanyId;
  const [runs, setRuns] = useState<PricingRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!companyId || !projectId) { setLoading(false); return; }
    setLoading(true);
    setError(null);

    const ref = collection(db, "companies", companyId, "projects", projectId, "pricingRuns");
    let q;
    try {
      q = query(ref, orderBy("createdAt", "desc"));
    } catch {
      q = ref;
    }

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: PricingRun[] = snap.docs.map((d) => ({
          pricingRunId: d.id,
          companyId,
          projectId,
          ...(d.data() as Omit<PricingRun, "pricingRunId" | "companyId" | "projectId">),
        }));
        setRuns(list);
        setLoading(false);
      },
      (err) => { setError(err.message); setLoading(false); }
    );
    return unsub;
  }, [companyId, projectId]);

  return { runs, loading, error };
}

/**
 * Real-time listener for a single pricing run document.
 */
export function usePricingRun(projectId: string | null | undefined, pricingRunId: string | null | undefined) {
  const { profile } = useAuth();
  const companyId = profile?.activeCompanyId;
  const [run, setRun] = useState<PricingRun | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!companyId || !projectId || !pricingRunId) return;
    const ref = doc(db, "companies", companyId, "projects", projectId, "pricingRuns", pricingRunId);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) { setRun(null); return; }
        setRun({
          pricingRunId: snap.id,
          companyId,
          projectId,
          ...(snap.data() as Omit<PricingRun, "pricingRunId" | "companyId" | "projectId">),
        });
      },
      (err) => setError(err.message)
    );
    return unsub;
  }, [companyId, projectId, pricingRunId]);

  return { run, error };
}

/**
 * Real-time listener for line items of a pricing run.
 */
export function usePricingItems(projectId: string | null | undefined, pricingRunId: string | null | undefined) {
  const { profile } = useAuth();
  const companyId = profile?.activeCompanyId;
  const [items, setItems] = useState<PricingLineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!companyId || !projectId || !pricingRunId) { setLoading(false); return; }
    setLoading(true);
    const ref = collection(db, "companies", companyId, "projects", projectId, "pricingRuns", pricingRunId, "items");
    const unsub = onSnapshot(
      ref,
      (snap) => {
        const list: PricingLineItem[] = snap.docs.map((d) => ({
          itemId: d.id,
          ...(d.data() as Omit<PricingLineItem, "itemId">),
        }));
        setItems(list);
        setLoading(false);
      },
      (err) => { setError(err.message); setLoading(false); }
    );
    return unsub;
  }, [companyId, projectId, pricingRunId]);

  return { items, loading, error };
}
