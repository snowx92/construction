"use client";

import Link from "next/link";
import { useProjectStore } from "@/store";
import { useT } from "@/lib/i18n";
import { useLocalizedWorkspaces } from "@/lib/i18n/use-localized-data";
import { Plus, Pin, FileText, Zap, Clock, CheckCircle, Loader2, Upload } from "lucide-react";

const STATUS_CONFIG = {
  new:         { labelKey: "common.new",        cls: "badge-neutral",  icon: FileText   },
  uploading:   { labelKey: "common.uploading",  cls: "badge-ai",       icon: Upload     },
  analyzing:   { labelKey: "tender.statusAnalyzing", cls: "badge-ai",       icon: Loader2    },
  ready:       { labelKey: "common.ready",      cls: "badge-success",  icon: CheckCircle},
  in_progress: { labelKey: "common.inProgress", cls: "badge-warning",  icon: Clock      },
  completed:   { labelKey: "common.completed",  cls: "badge-neutral",  icon: CheckCircle},
} as const;

function timeAgo(iso: string) {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (d < 60)   return `${d}m ago`;
  if (d < 1440) return `${Math.floor(d / 60)}h ago`;
  return `${Math.floor(d / 1440)}d ago`;
}

export default function ProjectsPage() {
  const t = useT();
  const rawWorkspaces = useProjectStore((s) => s.workspaces);
  const workspaces    = useLocalizedWorkspaces(rawWorkspaces);
  const pinned        = workspaces.filter((w) => w.pinned);
  const recent        = workspaces.filter((w) => !w.pinned);

  return (
    <div className="mx-auto max-w-[1000px] px-8 py-10">

      {/* Header */}
      <div className="mb-10 flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-foreground-subtle mb-1">{t("projects.eyebrow")}</p>
          <h1 className="text-3xl font-semibold text-foreground">{t("projects.title")}</h1>
          <p className="mt-1 text-sm text-foreground-muted">
            {t("projects.subtitle", { count: workspaces.length })}
          </p>
        </div>
        <Link href="/projects/new" className="btn-primary">
          <Plus className="h-4 w-4" strokeWidth={1.5} />
          {t("projects.newProject")}
        </Link>
      </div>

      {/* Pinned */}
      {pinned.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-1.5 mb-3">
            <Pin className="h-3 w-3 text-foreground-subtle" strokeWidth={2} />
            <p className="text-xs font-medium uppercase tracking-widest text-foreground-subtle">{t("projects.pinned")}</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {pinned.map((ws) => {
              const sc = STATUS_CONFIG[ws.status];
              return (
                <Link key={ws.id} href={`/projects/${ws.id}`} className="card p-6 hover:shadow-[var(--shadow-lg)] transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-primary-soft">
                      <FileText className="h-5 w-5 text-primary" strokeWidth={1.5} />
                    </div>
                    <span className={`badge ${sc.cls}`}>{t(sc.labelKey)}</span>
                  </div>
                  <h3 className="text-base font-semibold mb-0.5 text-foreground">{ws.name}</h3>
                  <p className="text-xs mb-4 text-foreground-subtle">{ws.clientName} · {ws.projectType}</p>
                  <div className="flex items-center justify-between text-xs text-foreground-subtle">
                    <span>{t("projects.proposalCount", { count: ws.proposals.length })}</span>
                    <span>{t("projects.updated")} {timeAgo(ws.updatedAt)}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent */}
      {recent.length > 0 && (
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-foreground-subtle mb-3">{t("projects.recent")}</p>
          <div className="space-y-2">
            {recent.map((ws) => {
              const sc   = STATUS_CONFIG[ws.status];
              const Icon = sc.icon;
              return (
                <Link key={ws.id} href={`/projects/${ws.id}`} className="card flex items-center gap-4 px-5 py-4 transition-all hover:shadow-[var(--shadow-sm)]">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-surface-2">
                    <Icon className="h-4 w-4 text-foreground-subtle" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate text-foreground">{ws.name}</p>
                    <p className="text-xs text-foreground-subtle">{ws.clientName} · {ws.projectType}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-foreground-subtle">{timeAgo(ws.updatedAt)}</span>
                    <span className={`badge ${sc.cls}`}>{t(sc.labelKey)}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="mt-10 rounded-[24px] p-10 text-center bg-surface border border-dashed border-black/[0.06]">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-[16px] bg-primary-soft">
          <Zap className="h-5 w-5 text-primary" strokeWidth={1.5} />
        </div>
        <p className="text-sm font-semibold mb-1 text-foreground">{t("projects.ctaTitle")}</p>
        <p className="text-xs mb-5 text-foreground-subtle">{t("projects.ctaSub")}</p>
        <Link href="/projects/new" className="btn-primary mx-auto w-fit">
          <Plus className="h-4 w-4" strokeWidth={1.5} />
          {t("projects.createNew")}
        </Link>
      </div>
    </div>
  );
}
