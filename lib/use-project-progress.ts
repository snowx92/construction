"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";
import { useAuth } from "./auth-context";
import type { Project, ProjectProgressSummary, ProjectStatus } from "./api/types";

export function useProjectProgress(projectId: string | null | undefined) {
  const { profile } = useAuth();
  const companyId = profile?.activeCompanyId;
  const [status, setStatus] = useState<ProjectStatus | null>(null);
  const [progressSummary, setProgressSummary] = useState<ProjectProgressSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!companyId || !projectId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const ref = doc(db, "companies", companyId, "projects", projectId);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) {
          setStatus(null);
          setProgressSummary(null);
          setLoading(false);
          return;
        }
        const data = snap.data() as Project;
        setStatus(data.status ?? null);
        setProgressSummary(data.progressSummary ?? null);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return unsub;
  }, [companyId, projectId]);

  return { status, progressSummary, loading };
}
