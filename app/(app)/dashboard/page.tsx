"use client";

import Link from "next/link";
import { mockTenders, mockPrices } from "@/data/mock";
import { useProjectStore } from "@/store";
import { useInsightsStore } from "@/store";
import { formatCurrency, cn } from "@/lib/utils";
import { useT, useLocale } from "@/lib/i18n";
import { useLocalizedTenders, useLocalizedWorkspaces, useLocalizedInsights, useLocalizedPrices } from "@/lib/i18n/use-localized-data";
import { ArrowRight, TrendingUp, TrendingDown, Minus, AlertTriangle, FileText, Zap, BarChart2, FolderKanban } from "lucide-react";

const TENDER_STATUS_CLS: Record<string, string> = {
  ready:         "badge-success",
  analyzing:     "badge-ai",
  proposal_sent: "badge-neutral",
  pending:       "badge-neutral",
  won:           "badge-success",
  lost:          "badge-danger",
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
  new:         "badge-neutral",
  uploading:   "badge-ai",
  analyzing:   "badge-ai",
  ready:       "badge-success",
  in_progress: "badge-success",
  completed:   "badge-neutral",
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
  const { workspaces: rawWorkspaces } = useProjectStore();

  // Localized lists for AR display
  const insights    = useLocalizedInsights(rawInsights);
  const workspaces  = useLocalizedWorkspaces(rawWorkspaces);
  const allTenders  = useLocalizedTenders(mockTenders);
  const prices      = useLocalizedPrices(mockPrices);

  const unread         = insights.filter((i) => !i.read);
  const activeTenders  = allTenders.filter((t) => t.status !== "won" && t.status !== "lost");
  const pipeline       = activeTenders.reduce((s, t) => s + (t.value ?? 0), 0);
  const activeWs       = workspaces.filter((w) => w.status === "in_progress" || w.status === "ready");

  return (
    <div className="mx-auto max-w-[1200px] px-8 py-10">

      <div className="mb-10">
        <p className="text-xs font-medium uppercase tracking-widest mb-1" style={{ color: "var(--color-text-3)" }}>{t("dashboard.title")}</p>
        <h1 className="text-3xl font-semibold" style={{ color: "var(--color-text-1)" }}>{t("dashboard.subtitle")}</h1>
        <p className="mt-1 text-base" style={{ color: "var(--color-text-2)" }}>
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
          { label: t("dashboard.kpiProjects"),  value: activeWs.length.toString(),        sub: `${workspaces.length} ${t("dashboard.kpiProjectsSub")}`,                                   href: "/projects" },
          { label: t("dashboard.kpiInsights"),  value: unread.length.toString(),          sub: t("dashboard.kpiInsightsSub"), accent: true,                                               href: "/insights" },
        ].map(({ label, value, sub, accent, href }) => (
          <Link key={label} href={href} className="card px-5 py-5 block transition-all hover:shadow-sm">
            <p className="text-xs font-medium mb-3" style={{ color: "var(--color-text-3)" }}>{label}</p>
            <p className="text-2xl font-semibold mb-1" style={{ color: accent ? "var(--color-accent)" : "var(--color-text-1)" }}>{value}</p>
            <p className="text-xs" style={{ color: "var(--color-text-3)" }}>{sub}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">

        {/* Tender list */}
        <div className="lg:col-span-2 card overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid var(--color-border-sub)" }}>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" strokeWidth={1.5} style={{ color: "var(--color-text-3)" }} />
              <span className="text-sm font-semibold" style={{ color: "var(--color-text-1)" }}>{t("dashboard.activeTenders")}</span>
            </div>
            <Link href="/tender" className="text-xs font-medium flex items-center gap-1" style={{ color: "var(--color-accent)" }}>
              {t("dashboard.viewAll")} <ArrowRight className={cn("h-3 w-3", dir === "rtl" && "rtl-flip")} />
            </Link>
          </div>
          <div className="divide-y" style={{ borderColor: "var(--color-border-sub)" }}>
            {allTenders.slice(0, 4).map((tender) => {
              const cls       = TENDER_STATUS_CLS[tender.status];
              const statusLbl = t(TENDER_STATUS_KEY[tender.status] ?? "common.ready");
              return (
                <Link key={tender.id} href={`/tender/${tender.id}`} className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-sand-50/50">
                  <div className="min-w-0">
                    <p className="text-sm font-medium mb-0.5 truncate" style={{ color: "var(--color-text-1)" }}>{tender.title}</p>
                    <p className="text-xs" style={{ color: "var(--color-text-3)" }}>{tender.client} · {t("dashboard.due")} {tender.deadline}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    {tender.value && <span className="text-sm font-medium" style={{ color: "var(--color-text-2)" }}>{formatCurrency(tender.value, "AED")}</span>}
                    <span className={`badge ${cls}`}>{statusLbl}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-6">
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--color-border-sub)" }}>
              <span className="text-sm font-semibold" style={{ color: "var(--color-text-1)" }}>{t("insights.title")}</span>
              <Link href="/insights" className="text-xs" style={{ color: "var(--color-accent)" }}>{t("dashboard.seeAll")}</Link>
            </div>
            {insights.slice(0, 3).map((ins) => (
              <div key={ins.id} className="px-5 py-3.5 ai-mark" style={{ borderBottom: "1px solid var(--color-border-sub)" }}>
                <div className="flex items-start gap-2">
                  {ins.severity === "critical" || ins.severity === "high"
                    ? <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" strokeWidth={1.5} style={{ color: ins.severity === "critical" ? "var(--color-danger)" : "var(--color-warning)" }} />
                    : <Zap className="h-3.5 w-3.5 mt-0.5 shrink-0" strokeWidth={1.5} style={{ color: "var(--color-ai)" }} />}
                  <div>
                    <p className="text-xs font-medium leading-snug" style={{ color: "var(--color-text-1)" }}>{ins.title}</p>
                    {!ins.read && <span className="badge badge-ai mt-1">{t("dashboard.newBadge")}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Price movers */}
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--color-border-sub)" }}>
              <div className="flex items-center gap-1.5">
                <BarChart2 className="h-3.5 w-3.5" strokeWidth={1.5} style={{ color: "var(--color-text-3)" }} />
                <span className="text-sm font-semibold" style={{ color: "var(--color-text-1)" }}>{t("dashboard.priceMovers")}</span>
              </div>
              <Link href="/pricing" className="text-xs" style={{ color: "var(--color-accent)" }}>{t("nav.dashboard")}</Link>
            </div>
            {prices.filter(p => p.trend !== "stable").slice(0, 4).map((p) => (
              <div key={p.id} className="flex items-center justify-between px-5 py-3" style={{ borderBottom: "1px solid var(--color-border-sub)" }}>
                <div>
                  <p className="text-xs font-medium" style={{ color: "var(--color-text-1)" }}>{p.name}</p>
                  <p className="text-xs" style={{ color: "var(--color-text-3)" }}>{p.unit}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  {p.trend === "up"   && <TrendingUp   className="h-3.5 w-3.5" strokeWidth={1.5} style={{ color: "var(--color-danger)"  }} />}
                  {p.trend === "down" && <TrendingDown className="h-3.5 w-3.5" strokeWidth={1.5} style={{ color: "var(--color-success)"}} />}
                  {p.trend === "stable" && <Minus      className="h-3.5 w-3.5" strokeWidth={1.5} style={{ color: "var(--color-text-3)"}} />}
                  <span className="text-xs font-semibold" style={{ color: p.changePercent > 0 ? "var(--color-danger)" : "var(--color-success)" }}>
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
            <FolderKanban className="h-4 w-4" strokeWidth={1.5} style={{ color: "var(--color-text-3)" }} />
            <p className="text-sm font-semibold" style={{ color: "var(--color-text-1)" }}>{t("dashboard.recentProjects")}</p>
          </div>
          <Link href="/projects" className="text-xs" style={{ color: "var(--color-accent)" }}>{t("dashboard.viewAll")}</Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {workspaces.slice(0, 3).map((ws) => {
            const boqCount    = ws.analysis?.boqItems.length ?? 0;
            const readyProps  = ws.proposals.filter((p) => p.status === "ready").length;
            const totalProps  = 9; // tender doc + 3 analysis + 6 proposals
            const pct         = Math.round((readyProps / totalProps) * 100);
            const cls         = WS_STATUS_CLS[ws.status];
            const statusLbl   = t(WS_STATUS_KEY[ws.status] ?? "common.ready");
            return (
              <Link key={ws.id} href={`/projects/${ws.id}`} className="card p-5 block transition-all hover:shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: "var(--color-text-1)" }}>{ws.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--color-text-3)" }}>{boqCount} BOQ items · {readyProps} docs</p>
                  </div>
                  <span className={`badge ${cls} shrink-0 ml-2`}>{statusLbl}</span>
                </div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span style={{ color: "var(--color-text-3)" }}>{t("dashboard.completion")}</span>
                  <span className="font-semibold" style={{ color: "var(--color-text-1)" }}>{pct}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: "var(--color-border)" }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: "var(--color-accent)" }} />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
