"use client";

import Link from "next/link";
import {
  AlertTriangle, ArrowUpRight, FolderKanban, Loader2,
  TrendingDown, TrendingUp, Minus,
} from "lucide-react";
import { useProjects } from "@/lib/use-projects";
import { useInsights } from "@/lib/use-insights";
import { useMarketPrices } from "@/lib/use-market-prices";
import { STATUS_BADGE, timeAgoFromIso } from "@/lib/project-status";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { CompanyInsight } from "@/lib/api/types";

const INSIGHT_ICON = {
  risk: AlertTriangle,
  opportunity: ArrowUpRight,
  pricing: TrendingUp,
  vendor: ArrowUpRight,
  market: TrendingUp,
} as const;

function severityClass(severity: CompanyInsight["severity"]) {
  switch (severity) {
    case "critical": return "bg-red-100 text-red-700";
    case "high": return "bg-amber-100 text-amber-800";
    case "low": return "bg-emerald-50 text-emerald-700";
    default: return "bg-foreground-subtle/10 text-foreground-muted";
  }
}

export default function DashboardPage() {
  const t = useT();
  const { projects } = useProjects();
  const { insights, unreadCount, loading: insightsLoading, dismiss } = useInsights(12);
  const { prices, loading: pricesLoading } = useMarketPrices("OM", 6);

  const liveProjects = projects.filter((p) => p.status !== "archived");
  const activeWs = liveProjects.filter((p) =>
    ["draft", "uploading", "processing", "needs_review", "ready", "pricing", "generating_proposal"].includes(p.status)
  );
  const awarded = liveProjects.filter((p) => p.status === "awarded").length;
  const submitted = liveProjects.filter((p) => p.status === "submitted").length;

  const previewInsights = insights.filter((i) => !i.read).slice(0, 4);
  const movers = prices.filter((p) => p.trend !== "stable").slice(0, 5);

  return (
    <div className="mx-auto max-w-[1200px] px-8 py-10">
      <div className="mb-10">
        <p className="eyebrow mb-1">{t("dashboard.title")}</p>
        <h1 className="text-3xl font-semibold text-foreground">{t("dashboard.subtitle")}</h1>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Link href="/projects" className="card px-5 py-5 block hover:border-black/[0.10]">
          <p className="text-xs font-medium mb-3 text-foreground-subtle">{t("dashboard.kpiProjects")}</p>
          <p className="text-2xl font-semibold mb-1 text-foreground">{activeWs.length}</p>
          <p className="text-xs text-foreground-subtle">{liveProjects.length} {t("dashboard.kpiProjectsSub")}</p>
        </Link>
        <Link href="/projects" className="card px-5 py-5 block hover:border-black/[0.10]">
          <p className="text-xs font-medium mb-3 text-foreground-subtle">{t("projects.status_submitted")}</p>
          <p className="text-2xl font-semibold mb-1 text-foreground">{submitted}</p>
          <p className="text-xs text-foreground-subtle">—</p>
        </Link>
        <Link href="/projects" className="card px-5 py-5 block hover:border-black/[0.10]">
          <p className="text-xs font-medium mb-3 text-foreground-subtle">{t("projects.status_awarded")}</p>
          <p className="text-2xl font-semibold mb-1 text-primary">{awarded}</p>
          <p className="text-xs text-foreground-subtle">—</p>
        </Link>
        <Link href="/insights" className="card px-5 py-5 block hover:border-black/[0.10]">
          <p className="text-xs font-medium mb-3 text-foreground-subtle">{t("dashboard.kpiInsights")}</p>
          <p className="text-2xl font-semibold mb-1 text-foreground">
            {insightsLoading ? "—" : unreadCount}
          </p>
          <p className="text-xs text-foreground-subtle">{t("dashboard.kpiInsightsSub")}</p>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">{t("insights.title")}</span>
            <Link href="/insights" className="text-xs text-primary">{t("dashboard.viewAll")}</Link>
          </div>
          {insightsLoading ? (
            <div className="flex h-28 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-foreground-subtle" />
            </div>
          ) : previewInsights.length === 0 ? (
            <p className="py-8 text-center text-sm text-foreground-subtle">{t("dashboard.insightsEmpty")}</p>
          ) : (
            <div className="space-y-3">
              {previewInsights.map((insight) => {
                const Icon = INSIGHT_ICON[insight.type] || AlertTriangle;
                return (
                  <div key={insight.insightId} className="rounded-xl border border-black/[0.06] bg-surface-2 p-3">
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium text-foreground">{insight.title}</p>
                          <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium", severityClass(insight.severity))}>
                            {insight.severity}
                          </span>
                        </div>
                        <p className="mt-1 text-xs leading-relaxed text-foreground-subtle line-clamp-2">{insight.body}</p>
                        {insight.projectId && (
                          <Link
                            href={`/projects/${insight.projectId}`}
                            className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
                          >
                            {insight.projectName || insight.projectId}
                            <ArrowUpRight className="h-3 w-3" />
                          </Link>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => dismiss(insight.insightId)}
                        className="shrink-0 text-[10px] text-foreground-subtle hover:text-foreground"
                      >
                        {t("dashboard.dismiss")}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">{t("dashboard.priceMovers")}</span>
            <Link href="/pricing" className="text-xs text-primary">{t("dashboard.viewAll")}</Link>
          </div>
          {pricesLoading ? (
            <div className="flex h-28 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-foreground-subtle" />
            </div>
          ) : movers.length === 0 ? (
            <p className="py-8 text-center text-sm text-foreground-subtle">{t("dashboard.pricesEmpty")}</p>
          ) : (
            <div className="space-y-2">
              {movers.map((price) => {
                const TrendIcon = price.trend === "up" ? TrendingUp : price.trend === "down" ? TrendingDown : Minus;
                const trendColor = price.trend === "up" ? "text-red-600" : price.trend === "down" ? "text-emerald-600" : "text-foreground-subtle";
                return (
                  <div
                    key={price.id}
                    className="flex items-center gap-3 rounded-xl border border-black/[0.06] bg-surface-2 px-3 py-2.5"
                  >
                    <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white", trendColor)}>
                      <TrendIcon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{price.name}</p>
                      <p className="text-[11px] text-foreground-subtle">
                        {price.price} {price.currency}/{price.unit}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={cn("text-sm font-semibold tabular-nums", trendColor)}>
                        {price.changePercent > 0 ? "+" : ""}{price.changePercent}%
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FolderKanban className="h-4 w-4 text-foreground-subtle" strokeWidth={1.5} />
            <p className="text-sm font-semibold text-foreground">{t("dashboard.recentProjects")}</p>
          </div>
          <Link href="/projects" className="text-xs text-primary">{t("dashboard.viewAll")}</Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {liveProjects.slice(0, 3).map((p) => (
            <Link
              key={p.projectId}
              href={`/projects/${p.projectId}`}
              className="card p-5 block hover:border-black/[0.10]"
            >
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
