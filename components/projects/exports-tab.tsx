"use client";

import { useState, useEffect } from "react";
import {
  Loader2, AlertCircle, Plus, X, Download, Package, FileText, FileSpreadsheet,
  FileArchive, RotateCcw, CheckCircle2, Clock, Trash2,
} from "lucide-react";
import { useT } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import { usePermission } from "@/lib/use-role";
import { showToast } from "@/lib/toast";
import { ApiError } from "@/lib/api/client";
import { createExport, deleteExport, getExportDownloadUrl, validateExport } from "@/lib/api/exports";
import { useExports } from "@/lib/use-exports";
import { useProposals } from "@/lib/use-proposals";
import { usePricingRuns } from "@/lib/use-pricing";
import { formatPricingTotal } from "@/lib/pricing-helpers";
import { timeAgoFromIso } from "@/lib/project-status";
import { cn } from "@/lib/utils";
import {
  EXPORT_ARTIFACTS, EXPORT_TYPES,
  type ExportArtifact, type ExportRecord, type ExportStatus, type ExportType,
} from "@/lib/api/types";

const STATUS_BADGE: Record<ExportStatus, string> = {
  queued:     "bg-foreground-subtle/10 text-foreground-muted",
  processing: "bg-primary-soft text-primary",
  ready:      "bg-emerald-50 text-emerald-700",
  failed:     "bg-red-50 text-red-700",
};

const TYPE_ICON: Record<ExportType, typeof FileText> = {
  submission_package: Package,
  pdf:                FileText,
  word:               FileText,
  excel:              FileSpreadsheet,
  zip:                FileArchive,
};

export function ExportsTab({ projectId }: { projectId: string }) {
  const t = useT();
  const { exports, loading, error } = useExports(projectId);
  const canCreate = usePermission("exportPackage");
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">{t("exportsTab.title")}</h2>
          <p className="mt-0.5 text-xs text-foreground-subtle">{t("exportsTab.subtitle")}</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          disabled={!canCreate}
          title={!canCreate ? t("exportsTab.noPerm") : undefined}
          className="inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] bg-primary px-4 py-2 text-xs font-medium text-white hover:bg-primary-hover disabled:opacity-50"
        >
          <Plus className="h-3.5 w-3.5" /> {t("exportsTab.createCta")}
        </button>
      </div>

      {loading ? (
        <div className="flex h-24 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-foreground-subtle" />
        </div>
      ) : error ? (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4" /> <span>{error}</span>
        </div>
      ) : exports.length === 0 ? (
        <p className="py-8 text-center text-sm text-foreground-subtle">{t("exportsTab.noExports")}</p>
      ) : (
        <div className="space-y-2">
          {exports.map((e) => (
            <ExportRow key={e.exportId} record={e} projectId={projectId} />
          ))}
        </div>
      )}

      {showCreate && (
        <CreateExportModal
          projectId={projectId}
          onClose={() => setShowCreate(false)}
          onCreated={() => setShowCreate(false)}
        />
      )}
    </div>
  );
}

function ExportRow({ record, projectId }: { record: ExportRecord; projectId: string }) {
  const t = useT();
  const { profile } = useAuth();
  const companyId = profile?.activeCompanyId;
  const canDelete = usePermission("exportPackage");
  const [downloading, setDownloading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const Icon = TYPE_ICON[record.exportType] ?? FileText;
  const status = record.status ?? "queued";
  const StatusIcon = status === "ready" ? CheckCircle2
    : status === "processing" || status === "queued" ? (status === "processing" ? Loader2 : Clock)
    : AlertCircle;

  async function handleDownload() {
    if (!companyId) return;
    setDownloading(true);
    try {
      const { downloadUrl } = await getExportDownloadUrl(record.exportId, companyId, projectId);
      window.open(downloadUrl, "_blank");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Download failed", "error");
    } finally {
      setDownloading(false);
    }
  }

  async function handleDelete() {
    if (!companyId) return;
    if (status === "processing") {
      showToast(t("exportsTab.cannotDeleteWhileProcessing"), "error");
      return;
    }
    if (!confirm(t("exportsTab.deleteConfirm"))) return;
    setDeleting(true);
    try {
      await deleteExport(record.exportId, { companyId, projectId });
      showToast(t("exportsTab.deleted"), "success");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Delete failed", "error");
    } finally {
      setDeleting(false);
    }
  }

  const sizeLabel = record.sizeBytes
    ? t("exportsTab.size", { mb: (record.sizeBytes / 1024 / 1024).toFixed(2) })
    : null;

  return (
    <div className="flex items-center gap-4 rounded-xl border border-black/[0.06] bg-card px-4 py-3">
      <Icon className="h-5 w-5 shrink-0 text-foreground-subtle" strokeWidth={1.5} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium text-foreground">
            {record.filename || t(`exportsTab.type_${record.exportType}`)}
          </p>
          <span className={`inline-flex items-center gap-1 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_BADGE[status]}`}>
            <StatusIcon className={cn("h-2.5 w-2.5", status === "processing" && "animate-spin")} />
            {t(`exportsTab.status_${status}`)}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-foreground-subtle">
          {t(`exportsTab.type_${record.exportType}`)}
          {sizeLabel && <> · {sizeLabel}</>}
          {" · "}{timeAgoFromIso(record.createdAt)}
          {record.error?.message && <span className="text-red-600"> · {record.error.message}</span>}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {status === "ready" && (
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="inline-flex items-center gap-1 rounded-md border border-black/[0.08] bg-white px-2.5 py-1.5 text-xs font-medium hover:bg-black/[0.03] disabled:opacity-50"
          >
            {downloading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
            {t("exportsTab.download")}
          </button>
        )}
        {canDelete && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting || status === "processing"}
            title={status === "processing" ? t("exportsTab.cannotDeleteWhileProcessing") : t("exportsTab.delete")}
            className="rounded-md p-1.5 text-foreground-subtle hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
          >
            {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
          </button>
        )}
      </div>
    </div>
  );
}

function CreateExportModal({
  projectId, onClose, onCreated,
}: { projectId: string; onClose: () => void; onCreated: () => void }) {
  const t = useT();
  const { profile } = useAuth();
  const companyId = profile?.activeCompanyId;
  const { proposals } = useProposals(projectId);
  const { runs } = usePricingRuns(projectId);

  const approvedProposals = proposals.filter((p) =>
    p.status === "approved" || p.status === "locked" || p.status === "exported"
  );
  const lockedRuns = runs.filter((r) => r.status === "locked");

  const [exportType, setExportType] = useState<ExportType>("submission_package");
  const [proposalId, setProposalId] = useState<string>(approvedProposals[0]?.proposalId ?? "");
  const [pricingRunId, setPRun]     = useState<string>(lockedRuns[0]?.pricingRunId ?? "");
  const [artifacts, setArtifacts]   = useState<Set<ExportArtifact>>(new Set(EXPORT_ARTIFACTS));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState("");
  const [warnings, setWarnings]     = useState<Array<{ code: string; message: string }>>([]);

  useEffect(() => {
    if (!companyId) return;
    validateExport({
      companyId,
      projectId,
      exportType,
      proposalId: proposalId || undefined,
      pricingRunId: pricingRunId || undefined,
    })
      .then((d) => setWarnings(d.warnings ?? []))
      .catch(() => setWarnings([]));
  }, [companyId, projectId, exportType, proposalId, pricingRunId]);

  function toggleArtifact(a: ExportArtifact) {
    setArtifacts((prev) => {
      const next = new Set(prev);
      if (next.has(a)) next.delete(a); else next.add(a);
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!companyId) return;
    setError("");
    setSubmitting(true);
    try {
      await createExport({
        companyId,
        projectId,
        exportType,
        proposalId: proposalId || undefined,
        pricingRunId: pricingRunId || undefined,
        selectedArtifacts: Array.from(artifacts),
      });
      showToast(t("exportsTab.status_queued"), "success");
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create export");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg rounded-2xl bg-card p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="mb-4 flex items-start justify-between">
          <h3 className="text-base font-semibold text-foreground">{t("exportsTab.createCta")}</h3>
          <button onClick={onClose} className="rounded-md p-1 text-foreground-subtle hover:bg-black/[0.05]">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Export type cards */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-foreground-muted">{t("exportsTab.exportType")}</label>
            <div className="grid grid-cols-1 gap-2">
              {EXPORT_TYPES.map((typ) => {
                const Icon = TYPE_ICON[typ];
                const active = exportType === typ;
                return (
                  <button
                    key={typ}
                    type="button"
                    onClick={() => setExportType(typ)}
                    className={cn(
                      "flex items-start gap-3 rounded-xl border p-3 text-left transition",
                      active
                        ? "border-primary bg-primary-soft"
                        : "border-black/[0.08] bg-white hover:border-primary/40"
                    )}
                  >
                    <Icon className={cn("h-4 w-4 mt-0.5 shrink-0", active ? "text-primary" : "text-foreground-subtle")} />
                    <div className="min-w-0 flex-1">
                      <p className={cn("text-sm font-medium", active ? "text-primary" : "text-foreground")}>
                        {t(`exportsTab.type_${typ}`)}
                      </p>
                      <p className="text-xs text-foreground-subtle">
                        {t(`exportsTab.type_${typ}_hint`)}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sources */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground-muted">{t("exportsTab.proposal")}</label>
              {approvedProposals.length === 0 ? (
                <p className="text-xs text-foreground-subtle">{t("exportsTab.proposalNone")}</p>
              ) : (
                <select
                  value={proposalId}
                  onChange={(e) => setProposalId(e.target.value)}
                  className="w-full rounded-xl border border-black/[0.08] bg-white px-3 py-2 text-sm"
                >
                  <option value="">{t("exportsTab.proposalLatest")}</option>
                  {approvedProposals.map((p) => (
                    <option key={p.proposalId} value={p.proposalId}>
                      {p.title || p.proposalId.slice(0, 8)}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground-muted">{t("exportsTab.pricingRun")}</label>
              {lockedRuns.length === 0 ? (
                <p className="text-xs text-foreground-subtle">{t("exportsTab.pricingRunNone")}</p>
              ) : (
                <select
                  value={pricingRunId}
                  onChange={(e) => setPRun(e.target.value)}
                  className="w-full rounded-xl border border-black/[0.08] bg-white px-3 py-2 text-sm"
                >
                  <option value="">{t("exportsTab.pricingRunLatest")}</option>
                  {lockedRuns.map((r) => (
                    <option key={r.pricingRunId} value={r.pricingRunId}>
                      {r.pricingRunId.slice(0, 8)}
                      {formatPricingTotal(r) ? ` · ${formatPricingTotal(r)}` : ""}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Artifacts */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-foreground-muted">{t("exportsTab.artifacts")}</label>
            <div className="flex flex-wrap gap-2">
              {EXPORT_ARTIFACTS.map((a) => {
                const active = artifacts.has(a);
                return (
                  <button
                    key={a}
                    type="button"
                    onClick={() => toggleArtifact(a)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs transition",
                      active
                        ? "border-primary bg-primary-soft text-primary"
                        : "border-black/[0.08] bg-white text-foreground-muted hover:border-primary"
                    )}
                  >
                    {t(`exportsTab.artifact_${a}`)}
                  </button>
                );
              })}
            </div>
          </div>

          {warnings.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 space-y-1">
              <p className="font-medium">{t("exportsTab.warningsTitle")}</p>
              {warnings.map((w) => (
                <p key={w.code}>• {w.message}</p>
              ))}
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4" /> <span>{error}</span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="rounded-lg border border-black/[0.08] bg-white px-3 py-2 text-sm hover:bg-black/[0.03]">
              {t("exportsTab.cancel")}
            </button>
            <button
              type="submit"
              disabled={submitting || artifacts.size === 0}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {t("exportsTab.create")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
