"use client";

import Link from "next/link";
import { useProjects } from "@/lib/use-projects";
import { STATUS_BADGE, timeAgoFromIso } from "@/lib/project-status";
import { useT } from "@/lib/i18n";
import { NeedsBackend } from "@/components/shared/needs-backend";
import { FolderKanban } from "lucide-react";

export default function DashboardPage() {
  const t = useT();
  const { projects } = useProjects();

  const liveProjects = projects.filter((p) => p.status !== "archived");
  const activeWs = liveProjects.filter((p) =>
    ["draft", "uploading", "processing", "needs_review", "ready", "pricing", "generating_proposal"].includes(p.status)
  );
  const awarded = liveProjects.filter((p) => p.status === "awarded").length;
  const submitted = liveProjects.filter((p) => p.status === "submitted").length;

  return (
    <div className="mx-auto max-w-[1200px] px-8 py-10">
      <div className="mb-10">
        <p className="eyebrow mb-1">{t("dashboard.title")}</p>
        <h1 className="text-3xl font-semibold text-foreground">{t("dashboard.subtitle")}</h1>
      </div>

      {/* KPI row — all derived from real projects */}
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
        <div className="card px-5 py-5 block opacity-70">
          <p className="text-xs font-medium mb-3 text-foreground-subtle">{t("dashboard.kpiInsights")}</p>
          <NeedsBackend
            variant="inline"
            endpoint="GET /api/insights"
            what="Unread insight count"
          />
        </div>
      </div>

      {/* Side by side: insights + price movers (both need backend) */}
      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        <div className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">{t("insights.title")}</span>
          </div>
          <NeedsBackend
            endpoint="GET /api/insights?companyId={cid}"
            what="AI-generated insights feed (risks detected, deadlines approaching, price alerts, tender findings)"
            details={`Response: { insights: [{ insightId, severity: "critical"|"high"|"medium"|"low", type, title, body, projectId?, read, createdAt }] }\nAlso: POST /api/insights/{id}/read`}
          />
        </div>

        <div className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">{t("dashboard.priceMovers")}</span>
          </div>
          <NeedsBackend
            endpoint="GET /api/market-prices?country=OM"
            what="Live commodity/material prices with trend deltas"
            details={`Response: { prices: [{ id, name, unit, currency, price, trend: "up"|"down"|"stable", changePercent, updatedAt }] }`}
          />
        </div>
      </div>

      {/* Recent projects — real data */}
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
