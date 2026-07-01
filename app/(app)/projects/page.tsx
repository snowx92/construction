"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useT } from "@/lib/i18n";
import { useProjects } from "@/lib/use-projects";
import { STATUS_BADGE, timeAgoFromIso } from "@/lib/project-status";
import { showToast } from "@/lib/toast";
import { ApiError } from "@/lib/api/client";
import { Plus, FileText, Zap, Loader2, AlertCircle, Archive, RotateCcw } from "lucide-react";

export default function ProjectsPage() {
  const t = useT();
  const { projects, loading, error, reload, archive, restore } = useProjects();
  const [showArchived, setShowArchived] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const visible = useMemo(
    () => projects.filter((p) => (showArchived ? p.status === "archived" : p.status !== "archived")),
    [projects, showArchived]
  );

  async function handleArchive(projectId: string) {
    setBusyId(projectId);
    try {
      await archive(projectId);
      showToast(t("projects.archived"), "success");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Failed", "error");
    } finally {
      setBusyId(null);
    }
  }

  async function handleRestore(projectId: string) {
    setBusyId(projectId);
    try {
      await restore(projectId);
      showToast(t("common.ready"), "success");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Failed", "error");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto max-w-[1000px] px-8 py-10">
      <div className="mb-10 flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-foreground-subtle mb-1">
            {t("projects.eyebrow")}
          </p>
          <h1 className="text-3xl font-semibold text-foreground">{t("projects.title")}</h1>
          <p className="mt-1 text-sm text-foreground-muted">
            {t("projects.subtitle", { count: visible.length })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-xs text-foreground-muted cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              className="rounded"
            />
            {t("projects.archivedFilter")}
          </label>
          <Link href="/projects/new" className="btn-primary">
            <Plus className="h-4 w-4" strokeWidth={1.5} />
            {t("projects.newProject")}
          </Link>
        </div>
      </div>

      {loading && projects.length === 0 ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-foreground-subtle" />
        </div>
      ) : error ? (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="flex-1">
            <p>{t("projects.loadFailed")}: {error}</p>
            <button onClick={reload} className="mt-1 text-xs underline">Retry</button>
          </div>
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-[24px] p-10 text-center bg-surface border border-dashed border-black/[0.06]">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-[16px] bg-primary-soft">
            <Zap className="h-5 w-5 text-primary" strokeWidth={1.5} />
          </div>
          <p className="text-sm font-semibold mb-1 text-foreground">
            {showArchived ? t("projects.archived") : t("projects.empty")}
          </p>
          <p className="text-xs mb-5 text-foreground-subtle">{t("projects.ctaSub")}</p>
          {!showArchived && (
            <Link href="/projects/new" className="btn-primary mx-auto w-fit">
              <Plus className="h-4 w-4" strokeWidth={1.5} />
              {t("projects.createNew")}
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {visible.map((p) => {
            const isArchived = p.status === "archived";
            return (
              <div
                key={p.projectId}
                className="card flex items-center gap-4 px-5 py-4 transition-all hover:shadow-[var(--shadow-sm)]"
              >
                <Link
                  href={`/projects/${p.projectId}`}
                  className="flex flex-1 min-w-0 items-center gap-4"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-surface-2">
                    <FileText className="h-4 w-4 text-foreground-subtle" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate text-foreground">{p.name}</p>
                    <p className="text-xs text-foreground-subtle truncate">
                      {[p.client, p.location].filter(Boolean).join(" · ") || "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-foreground-subtle hidden sm:block">
                      {timeAgoFromIso(p.updatedAt)}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_BADGE[p.status]}`}>
                      {t(`projects.status_${p.status}`)}
                    </span>
                  </div>
                </Link>
                <button
                  onClick={() => (isArchived ? handleRestore(p.projectId) : handleArchive(p.projectId))}
                  disabled={busyId === p.projectId}
                  className="shrink-0 rounded-md p-1.5 text-foreground-subtle transition-colors hover:bg-black/[0.04] hover:text-foreground disabled:opacity-50"
                  title={isArchived ? t("projects.restore") : t("projects.archive")}
                >
                  {busyId === p.projectId ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isArchived ? (
                    <RotateCcw className="h-4 w-4" />
                  ) : (
                    <Archive className="h-4 w-4" />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
