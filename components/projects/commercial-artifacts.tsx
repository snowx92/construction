"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle, Calendar, CheckCircle2, Circle, CircleDashed, Loader2,
  ShieldCheck, XCircle,
} from "lucide-react";
import { useT } from "@/lib/i18n";
import { getLatestCompliance, getLatestSchedule, updateCompliance, updateProgrammeActivity } from "@/lib/api/commercial";
import { ApiError } from "@/lib/api/client";
import { showToast } from "@/lib/toast";
import { timeAgoFromIso } from "@/lib/project-status";
import { cn } from "@/lib/utils";
import type { ComplianceRun, ProgrammeActivity, ProgrammeRun } from "@/lib/api/types";

interface Props {
  projectId: string;
  companyId: string;
  refreshKey?: number;
}

function isoTime(value: ComplianceRun["createdAt"]): string | null {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (typeof value === "object" && "_seconds" in value) {
    return new Date(value._seconds * 1000).toISOString();
  }
  return null;
}

function readinessClass(score: number): string {
  if (score >= 80) return "text-emerald-700 bg-emerald-50 border-emerald-200";
  if (score >= 50) return "text-amber-700 bg-amber-50 border-amber-200";
  return "text-red-700 bg-red-50 border-red-200";
}

function ChecklistStatusIcon({ status }: { status?: string }) {
  const s = (status || "").toLowerCase();
  if (s === "complete" || s === "completed") {
    return <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />;
  }
  if (s === "partial" || s === "in_progress") {
    return <CircleDashed className="h-3.5 w-3.5 shrink-0 text-amber-600" />;
  }
  if (s === "missing" || s === "failed") {
    return <XCircle className="h-3.5 w-3.5 shrink-0 text-red-500" />;
  }
  return <Circle className="h-3.5 w-3.5 shrink-0 text-foreground-subtle" />;
}

function asText(item: unknown): string {
  if (!item) return "";
  if (typeof item === "string") return item;
  if (typeof item === "object") {
    const o = item as Record<string, unknown>;
    return String(o.title || o.name || o.description || o.label || "");
  }
  return String(item);
}

function StringList({ title, items }: { title: string; items: unknown[] }) {
  const lines = items.map(asText).filter(Boolean);
  if (!lines.length) return null;
  return (
    <div className="mt-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-foreground-subtle">{title}</p>
      <ul className="mt-1.5 space-y-1">
        {lines.map((item, i) => (
          <li key={`${item}-${i}`} className="text-xs text-foreground-muted">• {item}</li>
        ))}
      </ul>
    </div>
  );
}

export function CommercialArtifactsPanel({ projectId, companyId, refreshKey = 0 }: Props) {
  const t = useT();
  const [compliance, setCompliance] = useState<ComplianceRun | null>(null);
  const [programme, setProgramme] = useState<ProgrammeRun | null>(null);
  const [activities, setActivities] = useState<ProgrammeActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [comp, sched] = await Promise.all([
        getLatestCompliance(companyId, projectId),
        getLatestSchedule(companyId, projectId),
      ]);
      setCompliance(comp);
      setProgramme(sched.programme);
      setActivities(sched.activities);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [companyId, projectId]);

  async function toggleChecklistItem(index: number) {
    if (!compliance?.id) return;
    const checklist = [...(compliance.checklist ?? [])];
    const item = checklist[index];
    if (!item) return;
    const nextStatus = (item.status || "").toLowerCase() === "complete" ? "missing" : "complete";
    checklist[index] = { ...item, status: nextStatus };
    try {
      await updateCompliance(compliance.id, { companyId, projectId, checklist });
      setCompliance((c) => c ? { ...c, checklist } : c);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : t("proposalsCommercial.saveFailed"), "error");
    }
  }

  async function saveActivityDuration(act: ProgrammeActivity, durationDays: number) {
    if (!programme?.id || !act.id) return;
    try {
      await updateProgrammeActivity(programme.id, act.id, { companyId, projectId, durationDays });
      setActivities((prev) => prev.map((a) => a.id === act.id ? { ...a, durationDays } : a));
      showToast(t("proposalsCommercial.saved"), "success");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : t("proposalsCommercial.saveFailed"), "error");
    }
  }

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  if (loading) {
    return (
      <div className="flex h-20 items-center justify-center rounded-xl border border-black/[0.06] bg-card">
        <Loader2 className="h-5 w-5 animate-spin text-foreground-subtle" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        <span>{error}</span>
      </div>
    );
  }

  const score = compliance?.readinessScore ?? 0;
  const checklist = compliance?.checklist ?? [];
  const completed = checklist.filter((c) => (c.status || "").toLowerCase() === "complete").length;
  const compTime = isoTime(compliance?.createdAt);
  const schedTime = isoTime(programme?.createdAt);
  const milestones = programme?.milestones ?? [];
  const criticalPath = programme?.criticalPath ?? [];

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Compliance */}
      <section className="rounded-xl border border-black/[0.06] bg-card p-4">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">{t("proposalsCommercial.complianceTitle")}</h3>
              {compTime && (
                <p className="text-[10px] text-foreground-subtle">{timeAgoFromIso(compTime)}</p>
              )}
            </div>
          </div>
          {compliance ? (
            <div className={cn("rounded-lg border px-2.5 py-1 text-center", readinessClass(score))}>
              <p className="text-lg font-bold leading-none">{score}%</p>
              <p className="mt-0.5 text-[9px] font-medium uppercase">{t("proposalsCommercial.readiness")}</p>
            </div>
          ) : null}
        </div>

        {!compliance ? (
          <p className="py-6 text-center text-xs text-foreground-subtle">{t("proposalsCommercial.complianceEmpty")}</p>
        ) : compliance.status === "generating" ? (
          <div className="flex items-center justify-center gap-2 py-6 text-xs text-foreground-muted">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("proposalsCommercial.generating")}
          </div>
        ) : (
          <>
            <p className="mb-2 text-xs text-foreground-muted">
              {t("proposalsCommercial.checklistProgress", { completed, total: checklist.length })}
              <span className="text-foreground-subtle"> · {t("proposalsCommercial.clickToToggle")}</span>
            </p>
            <ul className="max-h-52 divide-y divide-black/[0.04] overflow-y-auto rounded-lg border border-black/[0.06]">
              {checklist.map((item, i) => (
                <li
                  key={item.requirementId ?? `${item.title}-${i}`}
                  className="flex items-start gap-2 px-3 py-2 cursor-pointer hover:bg-black/[0.02]"
                  onClick={() => toggleChecklistItem(i)}
                >
                  <ChecklistStatusIcon status={item.status} />
                  <span className="text-xs text-foreground-muted">{item.title || "—"}</span>
                </li>
              ))}
            </ul>
            <StringList
              title={t("proposalsCommercial.requiredDocuments")}
              items={compliance.requiredDocuments ?? []}
            />
            <StringList
              title={t("proposalsCommercial.requiredCertificates")}
              items={compliance.requiredCertificates ?? []}
            />
            <StringList
              title={t("proposalsCommercial.requiredStaff")}
              items={compliance.requiredStaff ?? []}
            />
          </>
        )}
      </section>

      {/* Schedule */}
      <section className="rounded-xl border border-black/[0.06] bg-card p-4">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 text-violet-700">
            <Calendar className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">{t("proposalsCommercial.scheduleTitle")}</h3>
            {schedTime && (
              <p className="text-[10px] text-foreground-subtle">{timeAgoFromIso(schedTime)}</p>
            )}
          </div>
        </div>

        {!programme ? (
          <p className="py-6 text-center text-xs text-foreground-subtle">{t("proposalsCommercial.scheduleEmpty")}</p>
        ) : programme.status === "generating" ? (
          <div className="flex items-center justify-center gap-2 py-6 text-xs text-foreground-muted">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("proposalsCommercial.generating")}
          </div>
        ) : (
          <>
            {milestones.length > 0 && (
              <div className="mb-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-foreground-subtle">
                  {t("proposalsCommercial.milestones")}
                </p>
                <ul className="mt-1.5 flex flex-wrap gap-1.5">
                  {milestones.map((m, i) => (
                    <li
                      key={`${m.name}-${i}`}
                      className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-medium text-violet-800"
                    >
                      {m.name}{m.week != null ? ` · W${m.week}` : ""}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {criticalPath.length > 0 && (
              <p className="mb-3 text-xs text-foreground-muted">
                <span className="font-medium text-foreground">{t("proposalsCommercial.criticalPath")}: </span>
                {criticalPath.join(" → ")}
              </p>
            )}

            {activities.length > 0 ? (
              <div className="overflow-x-auto rounded-lg border border-black/[0.06]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-black/[0.02] text-[10px] uppercase text-foreground-subtle">
                    <tr>
                      <th className="px-3 py-2 font-medium">{t("proposalsCommercial.activity")}</th>
                      <th className="px-3 py-2 font-medium">{t("proposalsCommercial.duration")}</th>
                      <th className="px-3 py-2 font-medium">{t("proposalsCommercial.dependencies")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/[0.04]">
                    {activities.map((act) => (
                      <tr key={act.id}>
                        <td className="px-3 py-2 text-foreground-muted">
                          {act.isMilestone && (
                            <span className="me-1 rounded bg-violet-100 px-1 text-[9px] font-medium text-violet-700">M</span>
                          )}
                          {act.name || "—"}
                        </td>
                        <td className="px-3 py-2 text-foreground-subtle">
                          <input
                            type="number"
                            min={0}
                            className="w-16 rounded border border-black/[0.08] bg-white px-1.5 py-0.5 text-xs"
                            defaultValue={act.durationDays ?? ""}
                            onBlur={(e) => {
                              const v = parseInt(e.target.value, 10);
                              if (!Number.isNaN(v) && v !== act.durationDays) {
                                saveActivityDuration(act, v);
                              }
                            }}
                          />
                          <span className="ms-0.5">d</span>
                        </td>
                        <td className="px-3 py-2 text-foreground-subtle">
                          {(act.dependencies ?? []).length ? act.dependencies!.join(", ") : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="py-4 text-center text-xs text-foreground-subtle">
                {t("proposalsCommercial.noActivities")}
              </p>
            )}
          </>
        )}
      </section>
    </div>
  );
}
