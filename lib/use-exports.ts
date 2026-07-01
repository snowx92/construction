"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "./firebase";
import { useAuth } from "./auth-context";
import type { ExportRecord } from "./api/types";

export function useExports(projectId: string | null | undefined) {
  const { profile } = useAuth();
  const companyId = profile?.activeCompanyId;
  const [exports, setExports] = useState<ExportRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!companyId || !projectId) { setLoading(false); return; }
    setLoading(true);
    const ref = collection(db, "companies", companyId, "projects", projectId, "exports");
    let q;
    try { q = query(ref, orderBy("createdAt", "desc")); } catch { q = ref; }

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: ExportRecord[] = snap.docs.map((d) => ({
          exportId: d.id,
          companyId,
          projectId,
          ...(d.data() as Omit<ExportRecord, "exportId" | "companyId" | "projectId">),
        }));
        setExports(list);
        setLoading(false);
      },
      (err) => { setError(err.message); setLoading(false); }
    );
    return unsub;
  }, [companyId, projectId]);

  return { exports, loading, error };
}
