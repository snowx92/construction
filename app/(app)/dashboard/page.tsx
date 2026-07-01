"use client";

import Link from "next/link";
import { mockTenders, mockPrices } from "@/data/mock";
import { useInsightsStore } from "@/store";
import { useProjects } from "@/lib/use-projects";
import { STATUS_BADGE, timeAgoFromIso } from "@/lib/project-status";
import { formatCurrency, cn } from "@/lib/utils";
import { useT, useLocale } from "@/lib/i18n";
import { useLocalizedTenders, useLocalizedInsights, useLocalizedPrices } from "@/lib/i18n/use-localized-data";
import { ArrowRight, TrendingUp, TrendingDown, Minus, AlertTriangle, FileText, Zap, BarChart2, FolderKanban } from "lucide-react";

const TENDER_STATUS_CLS: Record<string, string> = {
  ready:         "bg-success-soft text-success",
  analyzing:     "bg-primary-soft text-primary",
  proposal_sent: "bg-surface-2 text-foreground-muted border border-black/[0.06]",
  pending:       "bg-surface-2 text-foreground-muted border border-black/[0.06]",
  won:           "bg-success-soft text-success",
  lost:          "bg-danger-soft text-danger",
};

const TENDER_STATUS_KEY: Record<string, string> = {
  ready:         "tender.statusReady",
  analyzing:     "tender.statusAnalyzing",
  proposal_sent: "tender.statusSent",
  pending:       "tender.statusPending",
  won:           "tender.statusWon",
  lost:          "tender.statusLost",
};

const WS_STATUS_CLS: Record<string, string> = {
  new:         "bg-surface-2 text-foreground-muted border border-black/[0.06]",
  uploading:   "bg-primary-soft text-primary",
  analyzing:   "bg-primary-soft text-primary",
  ready:       "bg-success-soft text-success",
  in_progress: "bg-success-soft text-success",
  completed:   "bg-surface-2 text-foreground-muted border border-black/[0.06]",
};

const WS_STATUS_KEY: Record<string, string> = {
  new:         "common.new",
  uploading:   "tender.statusAnalyzing",
  analyzing:   "tender.statusAnalyzing",
  ready:       "common.ready",
  in_progress: "common.inProgress",
  completed:   "common.completed",
};

export default function DashboardPage() {
  const t = useT();
  const { dir } = useLocale();
  const { insights: rawInsights } = useInsightsStore();
  const { projects } = useProjects();

  // Localized lists for AR display
  const insights    = useLocalizedInsights(rawInsights);
  const allTenders  = useLocalizedTenders(mockTenders);
  const prices      = useLocalizedPrices(mockPrices);

  const unread         = insights.filter((i) => !i.read);
  const activeTenders  = allTenders.filter((t) => t.status !== "won" && t.status !== "lost");
  const pipeline       = activeTenders.reduce((s, t) => s + (t.value ?? 0), 0);
  const liveProjects   = projects.filter((p) => p.status !== "archived");
  const activeWs       = liveProjects.filter((p) =>
    ["draft","uploading","processing","needs_review","ready","pricing","generating_proposal"].includes(p.status)
  );

  return (
    <div className="mx-auto max-w-[1200px] px-8 py-10">

      <div className="mb-10">
        <p className="eyebrow mb-1">{t("dashboard.title")}</p>
        <h1 className="text-3xl font-semibold text-foreground">{t("dashboard.subtitle")}</h1>
        <p className="mt-1 text-base text-foreground-muted">
          {unread.length > 0
            ? <>{unread.length} {t("insights.unread")} · {t("insights.title")}</>
            : <>{t("insights.allCaughtUp")}</>}
        </p>
      </div>

      {/* KPI row */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: t("dashboard.kpiActive"),    value: activeTenders.length.toString(),  sub: `${allTenders.filter(x => x.status === "ready").length} ${t("dashboard.kpiActiveSub")}`,  href: "/tender" },
          { label: t("dashboard.kpiValue"),     value: formatCurrency(pipeline, "AED"),   sub: t("dashboard.kpiValueSub"),                                                                href: "/tender" },
          { label: t("dashboard.kpiProjects"),  value: activeWs.length.toString(),        sub: `${liveProjects.length} ${t("dashboard.kpiProjectsSub")}`,                                 href: "/projects" },
          { label: t("dashboard.kpiInsights"),  value: unread.length.toString(),          sub: t("dashboard.kpiInsightsSub"), accent: true,                                               href: "/insights" },
        ].map(({ label, value, sub, accent, href }) => (
          <Link key={label} href={href} className="card px-5 py-5 block transition-all duration-500 ease-out hover:border-black/[0.10]">
            <p className="text-xs font-medium mb-3 text-foreground-subtle">{label}</p>
            <p className={cn("text-2xl font-semibold mb-1", accent ? "text-primary" : "text-foreground")}>{value}</p>
            <p className="text-xs text-foreground-subtle">{sub}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">

        {/* Tender list */}
        <div className="lg:col-span-2 card overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-black/[0.05]">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-foreground-subtle" strokeWidth={1.5} />
              <span className="text-sm font-semibold text-foreground">{t("dashboard.activeTenders")}</span>
            </div>
            <Link href="/tender" className="text-xs font-medium flex items-center gap-1 text-primary">
              {t("dashboard.viewAll")} <ArrowRight className={cn("h-3 w-3", dir === "rtl" && "rtl-flip")} />
            </Link>
          </div>
          <div className="divide-y divide-black/[0.05]">
            {allTenders.slice(0, 4).map((tender) => {
              const cls       = TENDER_STATUS_CLS[tender.status];
              const statusLbl = t(TENDER_STATUS_KEY[tender.status] ?? "common.ready");
              return (
                <Link key={tender.id} href={`/tender/${tender.id}`} className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-black/[0.025]">
                  <div className="min-w-0">
                    <p className="text-sm font-medium mb-0.5 truncate text-foreground">{tender.title}</p>
                    <p className="text-xs text-foreground-subtle">{tender.client} · {t("dashboard.due")} {tender.deadline}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    {tender.value && <span className="text-sm font-medium text-foreground-muted">{formatCurrency(tender.value, "AED")}</span>}
                    <span className={cn("inline-flex items-center gap-1 rounded-[var(--radius-pill)] px-2.5 py-0.5 text-xs font-medium", cls)}>{statusLbl}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-6">
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-black/[0.05]">
              <span className="text-sm font-semibold text-foreground">{t("insights.title")}</span>
              <Link href="/insights" className="text-xs text-primary">{t("dashboard.seeAll")}</Link>
            </div>
            {insights.slice(0, 3).map((ins) => (
              <div key={ins.id} className="px-5 py-3.5 ai-mark border-b border-black/[0.05]">
                <div className="flex items-start gap-2">
                  {ins.severity === "critical" || ins.severity === "high"
                    ? <AlertTriangle className={cn("h-3.5 w-3.5 mt-0.5 shrink-0", ins.severity === "critical" ? "text-danger" : "text-warning")} strokeWidth={1.5} />
                    : <Zap className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary" strokeWidth={1.5} />}
                  <div>
                    <p className="text-xs font-medium leading-snug text-foreground">{ins.title}</p>
                    {!ins.read && <span className="inline-flex items-center gap-1 rounded-[var(--radius-pill)] px-2.5 py-0.5 text-xs font-medium bg-primary-soft text-primary mt-1">{t("dashboard.newBadge")}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Price movers */}
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-black/[0.05]">
              <div className="flex items-center gap-1.5">
                <BarChart2 className="h-3.5 w-3.5 text-foreground-subtle" strokeWidth={1.5} />
                <span className="text-sm font-semibold text-foreground">{t("dashboard.priceMovers")}</span>
              </div>
              <Link href="/pricing" className="text-xs text-primary">{t("nav.dashboard")}</Link>
            </div>
            {prices.filter(p => p.trend !== "stable").slice(0, 4).map((p) => (
              <div key={p.id} className="flex items-center justify-between px-5 py-3 border-b border-black/[0.05]">
                <div>
                  <p className="text-xs font-medium text-foreground">{p.name}</p>
                  <p className="text-xs text-foreground-subtle">{p.unit}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  {p.trend === "up"   && <TrendingUp   className="h-3.5 w-3.5 text-danger" strokeWidth={1.5} />}
                  {p.trend === "down" && <TrendingDown className="h-3.5 w-3.5 text-success" strokeWidth={1.5} />}
                  {p.trend === "stable" && <Minus      className="h-3.5 w-3.5 text-foreground-subtle" strokeWidth={1.5} />}
                  <span className={cn("text-xs font-semibold", p.changePercent > 0 ? "text-danger" : "text-success")}>
                    {p.changePercent > 0 ? "+" : ""}{p.changePercent.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Live Workspaces */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FolderKanban className="h-4 w-4 text-foreground-subtle" strokeWidth={1.5} />
            <p className="text-sm font-semibold text-foreground">{t("dashboard.recentProjects")}</p>
          </div>
          <Link href="/projects" className="text-xs text-primary">{t("dashboard.viewAll")}</Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {liveProjects.slice(0, 3).map((p) => (
            <Link key={p.projectId} href={`/projects/${p.projectId}`} className="card p-5 block transition-all duration-500 ease-out hover:border-black/[0.10]">
              <div className="flex items-start justify-between mb-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate text-foreground">{p.name}</p>
                  <p className="text-xs mt-0.5 text-foreground-subtle truncate">
                    {[p.client, p.location].filter(Boolean).join(" · ") || "—"}
                  </p>
                </div>
                <span className={`shrink-0 ml-2 rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_BADGE[p.status]}`}>
                  {t(`projects.status_${p.status}`)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-foreground-subtle">
                <span>{t("projects.updated")} {timeAgoFromIso(p.updatedAt)}</span>
                {p.submissionDeadline && typeof p.submissionDeadline === "string" && (
                  <span>{t("dashboard.due")} {new Date(p.submissionDeadline).toLocaleDateString()}</span>
                )}
              </div>
            </Link>
          ))}
          {liveProjects.length === 0 && (
            <div className="col-span-full card p-8 text-center text-sm text-foreground-subtle">
              {t("projects.empty")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
