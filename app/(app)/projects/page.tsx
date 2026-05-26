"use client";

import Link from "next/link";
import { useProjectStore } from "@/store";
import { useLocalizedWorkspaces } from "@/lib/i18n/use-localized-data";
import { Plus, Pin, FileText, Zap, Clock, CheckCircle, Loader2, Upload } from "lucide-react";

const STATUS_CONFIG = {
  new:         { label: "New",          cls: "badge-neutral",  icon: FileText   },
  uploading:   { label: "Uploading…",   cls: "badge-ai",       icon: Upload     },
  analyzing:   { label: "Analyzing…",   cls: "badge-ai",       icon: Loader2    },
  ready:       { label: "Ready",        cls: "badge-success",  icon: CheckCircle},
  in_progress: { label: "In Progress",  cls: "badge-warning",  icon: Clock      },
  completed:   { label: "Completed",    cls: "badge-neutral",  icon: CheckCircle},
} as const;

function timeAgo(iso: string) {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (d < 60)   return `${d}m ago`;
  if (d < 1440) return `${Math.floor(d / 60)}h ago`;
  return `${Math.floor(d / 1440)}d ago`;
}

export default function ProjectsPage() {
  const rawWorkspaces = useProjectStore((s) => s.workspaces);
  const workspaces    = useLocalizedWorkspaces(rawWorkspaces);
  const pinned        = workspaces.filter((w) => w.pinned);
  const recent        = workspaces.filter((w) => !w.pinned);

  return (
    <div className="mx-auto max-w-[1000px] px-8 py-10">

      {/* Header */}
      <div className="mb-10 flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest mb-1" style={{ color: "var(--color-text-3)" }}>Workspace</p>
          <h1 className="text-3xl font-semibold" style={{ color: "var(--color-text-1)" }}>Projects</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--color-text-2)" }}>
            {workspaces.length} projects · Each project holds all tender files, proposals, and analysis
          </p>
        </div>
        <Link href="/projects/new" className="btn-primary">
          <Plus className="h-4 w-4" strokeWidth={1.5} />
          New project
        </Link>
      </div>

      {/* Pinned */}
      {pinned.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-1.5 mb-3">
            <Pin className="h-3 w-3" strokeWidth={2} style={{ color: "var(--color-text-3)" }} />
            <p className="text-xs font-medium uppercase tracking-widest" style={{ color: "var(--color-text-3)" }}>Pinned</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {pinned.map((ws) => {
              const sc = STATUS_CONFIG[ws.status];
              return (
                <Link key={ws.id} href={`/projects/${ws.id}`} className="card p-6 hover:shadow-[0_2px_16px_oklch(18%_0.008_75/0.07)] transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-[14px]" style={{ background: "var(--color-accent-muted)" }}>
                      <FileText className="h-5 w-5" strokeWidth={1.5} style={{ color: "var(--color-accent)" }} />
                    </div>
                    <span className={`badge ${sc.cls}`}>{sc.label}</span>
                  </div>
                  <h3 className="text-base font-semibold mb-0.5" style={{ color: "var(--color-text-1)" }}>{ws.name}</h3>
                  <p className="text-xs mb-4" style={{ color: "var(--color-text-3)" }}>{ws.clientName} · {ws.projectType}</p>
                  <div className="flex items-center justify-between text-xs" style={{ color: "var(--color-text-3)" }}>
                    <span>{ws.proposals.length} proposals</span>
                    <span>Updated {timeAgo(ws.updatedAt)}</span>
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
          <p className="text-xs font-medium uppercase tracking-widest mb-3" style={{ color: "var(--color-text-3)" }}>Recent</p>
          <div className="space-y-2">
            {recent.map((ws) => {
              const sc   = STATUS_CONFIG[ws.status];
              const Icon = sc.icon;
              return (
                <Link key={ws.id} href={`/projects/${ws.id}`} className="card flex items-center gap-4 px-5 py-4 transition-all hover:shadow-[0_1px_8px_oklch(18%_0.008_75/0.05)]">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px]" style={{ background: "var(--color-panel)" }}>
                    <Icon className="h-4 w-4" strokeWidth={1.5} style={{ color: "var(--color-text-3)" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: "var(--color-text-1)" }}>{ws.name}</p>
                    <p className="text-xs" style={{ color: "var(--color-text-3)" }}>{ws.clientName} · {ws.projectType}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs" style={{ color: "var(--color-text-3)" }}>{timeAgo(ws.updatedAt)}</span>
                    <span className={`badge ${sc.cls}`}>{sc.label}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="mt-10 rounded-[24px] p-10 text-center" style={{ background: "var(--color-surface)", border: "1px dashed var(--color-border)" }}>
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-[16px]" style={{ background: "var(--color-accent-muted)" }}>
          <Zap className="h-5 w-5" strokeWidth={1.5} style={{ color: "var(--color-accent)" }} />
        </div>
        <p className="text-sm font-semibold mb-1" style={{ color: "var(--color-text-1)" }}>Start with a tender file</p>
        <p className="text-xs mb-5" style={{ color: "var(--color-text-3)" }}>Upload a PDF, BOQ, or drawing — AI builds the entire project workspace automatically</p>
        <Link href="/projects/new" className="btn-primary mx-auto w-fit">
          <Plus className="h-4 w-4" strokeWidth={1.5} />
          Create new project
        </Link>
      </div>
    </div>
  );
}
