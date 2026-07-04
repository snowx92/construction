"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, Loader2, RotateCcw, X } from "lucide-react";
import { useT } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import { listJobs, retryJob, cancelJob } from "@/lib/api/jobs";
import { showToast } from "@/lib/toast";
import { ApiError } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import type { JobView } from "@/lib/api/types";

interface Props {
  projectId: string;
}

const ACTIVE = new Set(["pending", "ready", "running", "retry"]);

function jobLabelKey(jobType: string): string {
  const normalized = jobType.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
  return `jobsBanner.type_${normalized}`;
}

export function ProjectJobsBanner({ projectId }: Props) {
  const t = useT();
  const { profile } = useAuth();
  const companyId = profile?.activeCompanyId;
  const [jobs, setJobs] = useState<JobView[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!companyId) return;
    try {
      const all = await listJobs(companyId, projectId);
      setJobs(all.filter((j) => ACTIVE.has(j.status) || j.status === "failed"));
    } catch {
      setJobs([]);
    }
  }, [companyId, projectId]);

  useEffect(() => {
    load();
    const timer = setInterval(load, 5000);
    return () => clearInterval(timer);
  }, [load]);

  if (!jobs.length) return null;

  function labelForJob(job: JobView) {
    const key = jobLabelKey(job.jobType);
    const translated = t(key);
    return translated !== key ? translated : job.jobType.replace(/_/g, " ");
  }

  async function handleRetry(job: JobView) {
    if (!companyId) return;
    setBusy(job.jobId);
    try {
      await retryJob(job.jobId, { companyId, projectId });
      showToast(t("jobsBanner.retried"), "success");
      load();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Failed", "error");
    } finally {
      setBusy(null);
    }
  }

  async function handleCancel(job: JobView) {
    if (!companyId) return;
    setBusy(job.jobId);
    try {
      await cancelJob(job.jobId, { companyId, projectId });
      showToast(t("jobsBanner.cancelled"), "success");
      load();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Failed", "error");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mb-4 space-y-2" role="status" aria-live="polite">
      {jobs.map((job) => {
        const failed = job.status === "failed";
        const active = ACTIVE.has(job.status);
        return (
          <div
            key={job.jobId}
            className={cn(
              "flex flex-wrap items-start gap-2 rounded-lg border px-3 py-2.5 text-xs",
              failed ? "border-red-200 bg-red-50" : "border-black/[0.06] bg-surface-2",
            )}
          >
            {failed ? (
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-600" />
            ) : active ? (
              <Loader2 className="mt-0.5 h-3.5 w-3.5 shrink-0 animate-spin text-primary" />
            ) : null}
            <div className="min-w-0 flex-1">
              <p className="font-medium text-foreground">{labelForJob(job)}</p>
              {job.currentStep && (
                <p className="mt-0.5 text-[10px] text-foreground-subtle">{job.currentStep}</p>
              )}
              {failed && job.error?.message && (
                <p className="mt-1 text-[10px] text-red-700 line-clamp-2">{job.error.message}</p>
              )}
            </div>
            <span className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-medium",
              failed ? "bg-red-100 text-red-700" : "bg-black/[0.05] text-foreground-muted",
            )}>
              {t(`jobsBanner.status_${job.status}`) !== `jobsBanner.status_${job.status}`
                ? t(`jobsBanner.status_${job.status}`)
                : job.status}
            </span>
            <div className="ms-auto flex gap-1">
              {failed && (
                <button
                  type="button"
                  onClick={() => handleRetry(job)}
                  disabled={busy === job.jobId}
                  className="inline-flex items-center gap-1 rounded-md border border-black/[0.08] bg-white px-2 py-1 hover:bg-black/[0.03] disabled:opacity-50"
                >
                  <RotateCcw className="h-3 w-3" /> {t("jobsBanner.retry")}
                </button>
              )}
              {active && (
                <button
                  type="button"
                  onClick={() => handleCancel(job)}
                  disabled={busy === job.jobId}
                  className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-white px-2 py-1 text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  <X className="h-3 w-3" /> {t("jobsBanner.cancel")}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
