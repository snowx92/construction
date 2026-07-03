"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getJob } from "./api/jobs";
import { useAuth } from "./auth-context";
import type { JobView } from "./api/types";

/**
 * Polls a job until it reaches a terminal state.
 * Returns { job, error, refresh }.
 */
export function useJob(jobId: string | null | undefined, projectId?: string, intervalMs = 2000) {
  const { profile } = useAuth();
  const companyId = profile?.activeCompanyId;
  const [job, setJob] = useState<JobView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const stopped = useRef(false);

  const refresh = useCallback(async () => {
    if (!jobId || !companyId) return null;
    try {
      const j = await getJob(jobId, companyId, projectId);
      setJob(j);
      return j;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch job");
      return null;
    }
  }, [jobId, companyId, projectId]);

  useEffect(() => {
    stopped.current = false;
    if (!jobId || !companyId) {
      setJob(null);
      return;
    }

    let timer: ReturnType<typeof setTimeout> | null = null;

    async function tick() {
      if (stopped.current) return;
      const j = await refresh();
      const status = j?.status ?? "pending";
      const terminal = ["completed", "failed", "cancelled"].includes(status);
      if (!terminal && !stopped.current) {
        timer = setTimeout(tick, intervalMs);
      }
    }

    tick();
    return () => {
      stopped.current = true;
      if (timer) clearTimeout(timer);
    };
  }, [jobId, companyId, projectId, intervalMs, refresh]);

  return { job, error, refresh };
}
