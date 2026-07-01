"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Loader2, AlertCircle, AlertTriangle, Activity, Cpu, Sparkles, Briefcase,
  Database, FileText, HardDrive, Users, ThumbsUp, ThumbsDown, Award, TrendingUp,
  BookOpen, ScrollText, CalendarDays, MessageSquare, Hash,
} from "lucide-react";
import { useT } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import { useIsAdmin } from "@/lib/use-role";
import {
  getAiMetrics, getAlerts, getAnalyticsDashboard, getAuditLogs, getBusinessMetrics,
  getDailyAnalytics, getHealth, getJobsMetrics, getKnowledge, getQualityMetrics, getUsage,
} from "@/lib/api/operations";
import { ApiError } from "@/lib/api/client";
import type {
  OpsAiMetrics, OpsAlert, OpsAnalyticsDashboard, OpsAuditLog, OpsBusinessMetrics,
  OpsHealth, OpsJobsMetrics, OpsKnowledgeItem, OpsQualityMetrics, OpsUsage,
} from "@/lib/api/types";

export default function OperationsPage() {
  const t = useT();
  const { profile } = useAuth();
  const isAdmin = useIsAdmin();
  const companyId = profile?.activeCompanyId;
  const [days, setDays] = useState(7);

  const [health, setHealth]       = useState<OpsHealth | null>(null);
  const [alerts, setAlerts]       = useState<OpsAlert[]>([]);
  const [usage, setUsage]         = useState<OpsUsage | null>(null);
  const [dashboard, setDashboard] = useState<OpsAnalyticsDashboard | null>(null);
  const [jobs, setJobs]           = useState<OpsJobsMetrics | null>(null);
  const [ai, setAi]               = useState<OpsAiMetrics | null>(null);
  const [biz, setBiz]             = useState<OpsBusinessMetrics | null>(null);
  const [qual, setQual]           = useState<OpsQualityMetrics | null>(null);
  const [logs, setLogs]           = useState<OpsAuditLog[]>([]);
  const [knowledge, setKnowledge] = useState<OpsKnowledgeItem[]>([]);
  const [dailyDate, setDailyDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [daily, setDaily]         = useState<{ date: string; calls: number; tokens: number } | null>(null);
  const [dailyLoading, setDailyLoading] = useState(false);
  const [dailyError, setDailyError]     = useState<string | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);

  const reload = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    setError(null);
    setForbidden(false);
    try {
      const [h, a, u, d, j, m, b, q, al, kn] = await Promise.allSettled([
        getHealth(companyId),
        getAlerts(companyId),
        getUsage(companyId),
        getAnalyticsDashboard(companyId, days),
        getJobsMetrics(companyId),
        getAiMetrics(companyId),
        getBusinessMetrics(companyId, days),
        getQualityMetrics(companyId, days),
        getAuditLogs(companyId),
        getKnowledge(companyId),
      ]);
      // Detect 403 anywhere
      const results = [h,a,u,d,j,m,b,q,al,kn];
      const allRejected = results.filter(r => r.status === "rejected");
      if (allRejected.length === results.length && (allRejected[0] as PromiseRejectedResult).reason?.status === 403) {
        setForbidden(true);
        return;
      }
      if (h.status === "fulfilled")  setHealth(h.value);
      if (a.status === "fulfilled")  setAlerts(a.value);
      if (u.status === "fulfilled")  setUsage(u.value);
      if (d.status === "fulfilled")  setDashboard(d.value);
      if (j.status === "fulfilled")  setJobs(j.value);
      if (m.status === "fulfilled")  setAi(m.value);
      if (b.status === "fulfilled")  setBiz(b.value);
      if (q.status === "fulfilled")  setQual(q.value);
      if (al.status === "fulfilled") setLogs(al.value);
      if (kn.status === "fulfilled") setKnowledge(kn.value);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }, [companyId, days]);

  useEffect(() => { reload(); }, [reload]);

  useEffect(() => {
    if (!companyId || !isAdmin || !dailyDate) return;
    let cancelled = false;
    setDailyLoading(true);
    setDailyError(null);
    getDailyAnalytics(companyId, dailyDate)
      .then((d) => { if (!cancelled) setDaily(d); })
      .catch((e) => {
        if (cancelled) return;
        if (e instanceof ApiError && e.status === 404) {
          setDaily(null);
        } else {
          setDailyError(e instanceof Error ? e.message : "Failed");
        }
      })
      .finally(() => { if (!cancelled) setDailyLoading(false); });
    return () => { cancelled = true; };
  }, [companyId, isAdmin, dailyDate]);

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-[1100px] px-8 py-10">
        <div className="card p-6 flex items-center gap-2 text-sm text-foreground-muted">
          <AlertCircle className="h-4 w-4" />
          {t("operationsPage.onlyAdmin")}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1200px] px-8 py-10">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-foreground-subtle mb-1">
            {t("operationsPage.eyebrow")}
          </p>
          <h1 className="text-3xl font-semibold text-foreground">{t("operationsPage.title")}</h1>
          <p className="mt-1 text-sm text-foreground-muted">{t("operationsPage.subtitle")}</p>
        </div>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="input w-fit text-sm"
        >
          <option value={7}>{t("operationsPage.period7d")}</option>
          <option value={30}>{t("operationsPage.period30d")}</option>
          <option value={90}>{t("operationsPage.period90d")}</option>
        </select>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-foreground-subtle" />
        </div>
      ) : forbidden ? (
        <div className="card p-6 flex items-center gap-2 text-sm text-foreground-muted">
          <AlertCircle className="h-4 w-4" /> {t("operationsPage.onlyAdmin")}
        </div>
      ) : error ? (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4" /> <span>{error}</span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Alerts */}
          {alerts.length > 0 && (
            <Section title={t("operationsPage.alerts")} icon={AlertTriangle}>
              <div className="space-y-2">
                {alerts.map((a) => (
                  <div key={a.alertId} className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${
                    a.severity === "critical" ? "border-red-200 bg-red-50"
                    : a.severity === "warning" ? "border-amber-200 bg-amber-50"
                    : "border-black/[0.06] bg-card"
                  }`}>
                    <AlertTriangle className={`mt-0.5 h-4 w-4 shrink-0 ${
                      a.severity === "critical" ? "text-red-600"
                      : a.severity === "warning" ? "text-amber-700"
                      : "text-foreground-subtle"
                    }`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">{a.title || a.alertType}</p>
                      <p className="text-xs text-foreground-subtle mt-0.5">{a.message}</p>
                    </div>
                    {a.severity && (
                      <span className="text-[10px] font-medium uppercase tracking-widest text-foreground-subtle">
                        {a.severity}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Health */}
          <Section title={t("operationsPage.systemHealth")} icon={Activity}>
            <div className="grid gap-3 md:grid-cols-4">
              <Stat
                label={t("operationsPage.llmHealthy")}
                value={health?.llmHealthy ? t("operationsPage.healthy") : t("operationsPage.unhealthy")}
                accent={health?.llmHealthy ? "good" : "bad"}
              />
              <Stat
                label={t("operationsPage.llmLatency")}
                value={health?.llmLatencyMs != null ? `${health.llmLatencyMs} ms` : "—"}
              />
              <Stat label={t("operationsPage.embeddingModel")} value={truncateModel(health?.embeddingModel)} />
              <Stat label={t("operationsPage.ocrModel")} value={truncateModel(health?.ocrModel)} />
            </div>
          </Section>

          {/* Business KPIs */}
          <Section title={t("operationsPage.businessKpis")} icon={Award}>
            <div className="grid gap-3 md:grid-cols-5">
              <Stat label={t("operationsPage.totalProjects")} value={fmt(biz?.total ?? dashboard?.projects?.total)} />
              <Stat label={t("operationsPage.submitted")} value={fmt(biz?.submitted)} />
              <Stat label={t("operationsPage.awarded")} value={fmt(biz?.awarded)} accent="good" />
              <Stat label={t("operationsPage.lost")} value={fmt(biz?.lost)} />
              <Stat label={t("operationsPage.winRate")} value={biz?.winRate != null ? `${Math.round(biz.winRate * 100)}%` : "—"} accent="good" />
            </div>
          </Section>

          {/* Jobs */}
          <Section title={t("operationsPage.jobsMetrics")} icon={Briefcase}>
            <div className="grid gap-3 md:grid-cols-5">
              <Stat label={t("operationsPage.jobsTotal")}     value={fmt(jobs?.total)} />
              <Stat label={t("operationsPage.jobsCompleted")} value={fmt(jobs?.completed)} accent="good" />
              <Stat label={t("operationsPage.jobsFailed")}    value={fmt(jobs?.failed)} accent="bad" />
              <Stat label={t("operationsPage.jobsRunning")}   value={fmt(jobs?.running)} />
              <Stat label={t("operationsPage.failureRate")}   value={jobs?.failureRate != null ? `${(jobs.failureRate * 100).toFixed(2)}%` : "—"} />
            </div>
          </Section>

          {/* AI */}
          <Section title={t("operationsPage.aiMetrics")} icon={Cpu}>
            <div className="grid gap-3 md:grid-cols-4">
              <Stat label={t("operationsPage.aiCalls")}   value={fmt(ai?.calls)} />
              <Stat label={t("operationsPage.aiTokens")}  value={fmt(ai?.tokens)} />
              <Stat label={t("operationsPage.aiLatency")} value={ai?.latencyMsAvg != null ? `${ai.latencyMsAvg} ms` : "—"} />
              <Stat label={t("operationsPage.aiCost")}    value={ai?.costEstimateUsd != null ? `$${ai.costEstimateUsd.toFixed(2)}` : "—"} />
            </div>
          </Section>

          {/* Daily analytics */}
          <Section title={t("operationsPage.dailyAnalytics")} icon={CalendarDays}>
            <div className="rounded-xl border border-black/[0.06] bg-card p-4">
              <div className="mb-4 flex items-center gap-3">
                <label className="text-xs font-medium text-foreground-muted">
                  {t("operationsPage.dailyDate")}
                </label>
                <input
                  type="date"
                  value={dailyDate}
                  max={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setDailyDate(e.target.value)}
                  className="input w-fit text-sm"
                />
              </div>

              {dailyLoading ? (
                <div className="flex h-16 items-center gap-2 text-sm text-foreground-subtle">
                  <Loader2 className="h-4 w-4 animate-spin" /> {t("operationsPage.dailyLoading")}
                </div>
              ) : dailyError ? (
                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4" /> <span>{dailyError}</span>
                </div>
              ) : !daily ? (
                <p className="text-sm text-foreground-subtle">{t("operationsPage.dailyEmpty")}</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  <Stat
                    label={t("operationsPage.dailyCalls")}
                    icon={MessageSquare}
                    value={fmt(daily.calls)}
                  />
                  <Stat
                    label={t("operationsPage.dailyTokens")}
                    icon={Hash}
                    value={fmt(daily.tokens)}
                  />
                </div>
              )}
            </div>
          </Section>

          {/* Quality */}
          <Section title={t("operationsPage.qualityMetrics")} icon={Sparkles}>
            <div className="grid gap-3 md:grid-cols-4">
              <Stat label={t("operationsPage.thumbsUp")} icon={ThumbsUp} value={fmt(qual?.copilotRatingsUp)} accent="good" />
              <Stat label={t("operationsPage.thumbsDown")} icon={ThumbsDown} value={fmt(qual?.copilotRatingsDown)} accent="bad" />
              <Stat label={t("operationsPage.lowConfidence")} value={qual?.lowConfidenceRate != null ? `${(qual.lowConfidenceRate * 100).toFixed(1)}%` : "—"} />
              <Stat label={t("operationsPage.citationCov")} value={qual?.citationCoverage != null ? `${Math.round(qual.citationCoverage * 100)}%` : "—"} />
            </div>
          </Section>

          {/* Knowledge */}
          <Section title={t("operationsPage.knowledge")} icon={BookOpen}>
            {knowledge.length === 0 ? (
              <p className="rounded-xl border border-black/[0.06] bg-card p-4 text-sm text-foreground-subtle">
                {t("operationsPage.noKnowledge")}
              </p>
            ) : (
              <div className="rounded-xl border border-black/[0.06] bg-card divide-y divide-black/[0.05]">
                {knowledge.slice(0, 10).map((k) => (
                  <div key={k.itemId} className="flex items-center gap-3 px-4 py-2.5">
                    <BookOpen className="h-3.5 w-3.5 text-foreground-subtle shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{k.title || k.itemId}</p>
                      {k.type && <p className="text-[10px] text-foreground-subtle">{k.type}</p>}
                    </div>
                    {k.status && (
                      <span className="text-[10px] font-medium uppercase tracking-widest text-foreground-subtle">
                        {k.status}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* Audit logs */}
          <Section title={t("operationsPage.auditLogs")} icon={ScrollText}>
            {logs.length === 0 ? (
              <p className="rounded-xl border border-black/[0.06] bg-card p-4 text-sm text-foreground-subtle">
                {t("operationsPage.noLogs")}
              </p>
            ) : (
              <div className="rounded-xl border border-black/[0.06] bg-card divide-y divide-black/[0.05]">
                {logs.slice(0, 15).map((l) => (
                  <div key={l.logId} className="flex items-center gap-3 px-4 py-2.5">
                    <ScrollText className="h-3.5 w-3.5 text-foreground-subtle shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-foreground">
                        <span className="font-medium">{l.action || "action"}</span>
                        {l.resource && <span className="text-foreground-subtle"> · {l.resource}</span>}
                        {l.resourceId && <span className="text-foreground-subtle"> #{l.resourceId.slice(0, 8)}</span>}
                      </p>
                      {l.actorUserId && <p className="text-[10px] text-foreground-subtle">by {l.actorUserId.slice(0, 8)}</p>}
                    </div>
                    {l.createdAt && (
                      <span className="text-[10px] text-foreground-subtle">
                        {new Date(l.createdAt).toLocaleString()}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* Usage */}
          {usage && (
            <Section title={t("operationsPage.usage")} icon={HardDrive}>
              <div className="grid gap-3 md:grid-cols-4">
                <UsageStat label={t("operationsPage.storage")} icon={Database}
                  used={usage.storageBytes} max={usage.maxStorageBytes}
                  fmt={(v) => v != null ? `${(v / 1024 / 1024).toFixed(1)} MB` : "—"} />
                <UsageStat label={t("operationsPage.projects")} icon={FileText}
                  used={usage.projects} max={usage.maxProjects} />
                <UsageStat label={t("operationsPage.users")} icon={Users}
                  used={usage.users} max={usage.maxUsers} />
                <UsageStat label={t("operationsPage.aiRequests")} icon={TrendingUp}
                  used={usage.aiRequestsThisMonth} max={usage.maxAiRequestsPerMonth} />
              </div>
            </Section>
          )}
        </div>
      )}
    </div>
  );
}

function Section({
  title, icon: Icon, children,
}: { title: string; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-foreground-subtle" />
        <p className="text-xs font-medium uppercase tracking-widest text-foreground-subtle">{title}</p>
      </div>
      {children}
    </div>
  );
}

function Stat({
  label, value, accent, icon: Icon,
}: { label: string; value: string | number; accent?: "good" | "bad"; icon?: React.ComponentType<{ className?: string }> }) {
  const color = accent === "good" ? "text-emerald-700" : accent === "bad" ? "text-red-700" : "text-foreground";
  return (
    <div className="card p-4">
      <div className="flex items-center gap-1.5 mb-1.5">
        {Icon && <Icon className="h-3 w-3 text-foreground-subtle" />}
        <p className="text-[10px] font-medium uppercase tracking-widest text-foreground-subtle">{label}</p>
      </div>
      <p className={`text-xl font-semibold truncate ${color}`}>{value}</p>
    </div>
  );
}

function UsageStat({
  label, icon: Icon, used, max, fmt: format,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  used?: number;
  max?: number;
  fmt?: (v?: number) => string;
}) {
  const f = format ?? ((v) => v != null ? v.toLocaleString() : "—");
  const pct = used != null && max != null && max > 0 ? Math.min(100, (used / max) * 100) : 0;
  return (
    <div className="card p-4">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon className="h-3 w-3 text-foreground-subtle" />
        <p className="text-[10px] font-medium uppercase tracking-widest text-foreground-subtle">{label}</p>
      </div>
      <p className="text-sm font-semibold text-foreground">
        {f(used)} <span className="text-xs font-normal text-foreground-subtle">/ {f(max)}</span>
      </p>
      {max != null && max > 0 && (
        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-black/[0.06]">
          <div className={`h-full rounded-full ${pct > 90 ? "bg-red-600" : pct > 70 ? "bg-amber-500" : "bg-primary"}`}
            style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  );
}

function fmt(v?: number): string {
  return v != null ? v.toLocaleString() : "—";
}
function truncateModel(s?: string): string {
  if (!s) return "—";
  return s.length > 24 ? s.slice(0, 24) + "…" : s;
}
