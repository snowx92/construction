"use client";

import { useEffect, useRef, useState } from "react";
import { collection, doc, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "./firebase";
import { useAuth } from "./auth-context";
import { getLatestPricingRun } from "./api/pricing";
import type { PricingLineItem, PricingRun } from "./api/types";

function mapLineItems(raw: unknown[] | undefined): PricingLineItem[] {
  if (!raw?.length) return [];
  return raw.map((item, index) => {
    const li = item as Record<string, unknown>;
    return {
      itemId: (li.boqItemId ?? li.itemId ?? String(index)) as string,
      boqItemId: (li.boqItemId ?? li.itemId ?? String(index)) as string,
      description: li.description as string | undefined,
      category: li.category as string | undefined,
      quantity: li.quantity as number | undefined,
      unit: li.unit as string | undefined,
      aiRate: (li.suggestedRate ?? li.aiRate) as number | undefined,
      manualRate: li.manualRate as number | undefined,
      finalRate: li.finalRate as number | undefined,
      amount: (li.lineTotal ?? li.amount) as number | undefined,
      material: li.material as number | undefined,
      labor: li.labor as number | undefined,
      equipment: li.equipment as number | undefined,
      subcontract: li.subcontract as number | undefined,
      source: li.source as PricingLineItem["source"],
      notes: (li.manualNotes ?? li.notes) as string | undefined,
    };
  });
}

function mapPricingRun(
  id: string,
  companyId: string,
  projectId: string,
  data: Record<string, unknown>,
): PricingRun {
  return {
    pricingRunId: id,
    companyId,
    projectId,
    ...(data as Omit<PricingRun, "pricingRunId" | "companyId" | "projectId">),
  };
}

/**
 * Real-time listener for all pricing runs of a project.
 * Collection: companies/{cid}/projects/{pid}/pricing
 */
export function usePricingRuns(projectId: string | null | undefined) {
  const { profile } = useAuth();
  const companyId = profile?.activeCompanyId;
  const [runs, setRuns] = useState<PricingRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const apiFetched = useRef(false);

  useEffect(() => {
    apiFetched.current = false;
    if (!companyId || !projectId) { setLoading(false); return; }
    setLoading(true);
    setError(null);

    const ref = collection(db, "companies", companyId, "projects", projectId, "pricing");
    let q;
    try {
      q = query(ref, orderBy("createdAt", "desc"));
    } catch {
      q = ref;
    }

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: PricingRun[] = snap.docs.map((d) =>
          mapPricingRun(d.id, companyId, projectId, d.data() as Record<string, unknown>)
        );
        setRuns(list);
        setLoading(false);

        if (list.length === 0 && !apiFetched.current) {
          apiFetched.current = true;
          getLatestPricingRun(companyId, projectId)
            .then((run) => { if (run) setRuns([run]); })
            .catch(() => { /* no run yet */ });
        }
      },
      (err) => {
        setError(err.message);
        setLoading(false);
        if (!apiFetched.current) {
          apiFetched.current = true;
          getLatestPricingRun(companyId, projectId)
            .then((run) => { if (run) setRuns([run]); })
            .catch((e) => setError(e instanceof Error ? e.message : "Failed to load pricing"));
        }
      }
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
    const ref = doc(db, "companies", companyId, "projects", projectId, "pricing", pricingRunId);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) { setRun(null); return; }
        setRun(mapPricingRun(snap.id, companyId, projectId, snap.data() as Record<string, unknown>));
      },
      (err) => setError(err.message)
    );
    return unsub;
  }, [companyId, projectId, pricingRunId]);

  return { run, error };
}

/**
 * Line items are embedded in the pricing run doc as `lineItems[]`.
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
    const ref = doc(db, "companies", companyId, "projects", projectId, "pricing", pricingRunId);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) {
          setItems([]);
          setLoading(false);
          return;
        }
        const data = snap.data() as { lineItems?: unknown[] };
        setItems(mapLineItems(data.lineItems));
        setLoading(false);
      },
      (err) => { setError(err.message); setLoading(false); }
    );
    return unsub;
  }, [companyId, projectId, pricingRunId]);

  return { items, loading, error };
}
