"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Upload, FileText, FileSpreadsheet, FileImage, FileArchive,
  Loader2, CheckCircle2, AlertCircle, Trash2, RotateCcw, Download,
} from "lucide-react";
import { useT } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import { useDocuments } from "@/lib/use-documents";
import { showToast } from "@/lib/toast";
import { ApiError } from "@/lib/api/client";
import {
  confirmUpload, createUploadSessions, deleteDocument, getDownloadUrl,
  retryDocument, uploadFileToR2,
} from "@/lib/api/documents";
import {
  ALLOWED_MIME_TYPES, type AllowedMimeType, type DocumentRecord, type DocumentStep,
} from "@/lib/api/types";
import { timeAgoFromIso } from "@/lib/project-status";
import { cn } from "@/lib/utils";

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB
const ALLOWED_SET = new Set<string>(ALLOWED_MIME_TYPES);

function iconFor(mime?: string) {
  if (!mime) return FileText;
  if (mime.includes("spreadsheet") || mime.includes("excel") || mime === "text/csv") return FileSpreadsheet;
  if (mime.startsWith("image/")) return FileImage;
  if (mime === "application/zip") return FileArchive;
  return FileText;
}

function statusOf(d: DocumentRecord): "pending" | "uploading" | "processing" | "ready" | "failed" {
  if (d.status === "ready") return "ready";
  if (d.status === "failed") return "failed";
  if (d.currentStep === "document_ready") return "ready";
  if (d.status === "uploaded" || d.status === "processing") return "processing";
  return d.status === "pending" ? "pending" : "processing";
}

const PROGRESS_BY_STEP: Record<DocumentStep, number> = {
  upload_confirm:    10,
  document_classify: 20,
  ocr:               40,
  parse:             60,
  thumbnail:         70,
  chunk:             80,
  embedding:         95,
  document_ready:    100,
};

interface PendingUpload {
  file: File;
  documentId?: string;
  progress: number;
  state: "uploading" | "confirming" | "done" | "failed";
  error?: string;
}

export function DocumentsTab({ projectId }: { projectId: string }) {
  const t = useT();
  const { profile } = useAuth();
  const companyId = profile?.activeCompanyId;
  const { documents, loading, error } = useDocuments(projectId);

  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<PendingUpload[]>([]);
  const [dragging, setDragging] = useState(false);
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());

  const storageKey = `hidden-docs:${companyId}:${projectId}`;

  // Load persisted hidden IDs
  useEffect(() => {
    if (typeof window === "undefined" || !companyId) return;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setHiddenIds(new Set(JSON.parse(raw)));
    } catch { /* ignore */ }
  }, [storageKey, companyId]);

  const persistHidden = useCallback((next: Set<string>) => {
    setHiddenIds(next);
    try { localStorage.setItem(storageKey, JSON.stringify([...next])); } catch { /* ignore */ }
  }, [storageKey]);

  const visibleDocuments = useMemo(
    () => documents.filter((d) => !hiddenIds.has(d.documentId)),
    [documents, hiddenIds]
  );

  async function handleFiles(files: File[]) {
    if (!companyId) return;
    if (files.length === 0) return;

    // Validate
    const ok: File[] = [];
    for (const f of files) {
      if (!ALLOWED_SET.has(f.type)) {
        showToast(t("documents.unsupportedType", { name: f.name }), "error");
        continue;
      }
      if (f.size > MAX_FILE_SIZE) {
        showToast(t("documents.fileTooLarge", { name: f.name }), "error");
        continue;
      }
      ok.push(f);
    }
    if (ok.length === 0) return;

    // Seed pending state
    setPending((prev) => [
      ...prev,
      ...ok.map<PendingUpload>((f) => ({ file: f, progress: 0, state: "uploading" })),
    ]);

    try {
      // Get upload slots
      const { uploads } = await createUploadSessions({
        companyId,
        projectId,
        files: ok.map((f) => ({
          name: f.name,
          sizeBytes: f.size,
          mimeType: f.type as AllowedMimeType,
        })),
      });

      // Upload + confirm each
      await Promise.all(
        ok.map(async (file, i) => {
          const slot = uploads[i];
          try {
            await uploadFileToR2(slot.uploadUrl, file);
            setPending((prev) => prev.map((p) =>
              p.file === file ? { ...p, documentId: slot.documentId, progress: 80, state: "confirming" } : p
            ));
            await confirmUpload(slot.documentId, { companyId, projectId });
            setPending((prev) => prev.map((p) =>
              p.file === file ? { ...p, progress: 100, state: "done" } : p
            ));
            // Remove from pending after a short delay (Firestore listener takes over)
            setTimeout(() => {
              setPending((prev) => prev.filter((p) => p.file !== file));
            }, 1500);
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            setPending((prev) => prev.map((p) =>
              p.file === file ? { ...p, state: "failed", error: msg } : p
            ));
            showToast(`${file.name}: ${msg}`, "error");
            console.error("[upload]", file.name, err);
          }
        })
      );
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Failed to create upload sessions", "error");
      setPending((prev) => prev.filter((p) => !ok.includes(p.file)));
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    handleFiles(files);
    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    handleFiles(Array.from(e.dataTransfer.files));
  }

  async function handleDelete(d: DocumentRecord) {
    if (!companyId) return;
    const name = d.filename || d.name || d.documentId;
    if (!confirm(t("documents.confirmDelete", { name }))) return;

    // Hide immediately AND persist — the user wants it gone from their view
    // regardless of what the backend/Firestore mirror decides.
    const nextHidden = new Set(hiddenIds).add(d.documentId);
    persistHidden(nextHidden);

    // Fire the API call (best-effort). Also try to nuke the Firestore mirror
    // so the entry doesn't leak into other clients or come back on rehydrate.
    let apiOk = false;
    try {
      await deleteDocument(d.documentId, { companyId, projectId });
      apiOk = true;
    } catch (err) {
      const isMissing =
        err instanceof ApiError && (err.status === 404 || err.code === "not-found");
      if (!isMissing) {
        console.error("[delete-api]", err);
        showToast(err instanceof ApiError ? err.message : "Delete failed", "error");
        // Row stays hidden anyway — user asked for it.
      }
    }

    // Always try to clean up the Firestore mirror. If rules block us it's
    // silently ignored; the local hidden-list still keeps it out of view.
    try {
      await deleteDoc(doc(db, "companies", companyId, "projects", projectId, "documents", d.documentId));
    } catch { /* ignore */ }

    if (apiOk) showToast(t("documents.delete"), "success");
  }

  async function handleRetry(d: DocumentRecord) {
    if (!companyId) return;
    try {
      await retryDocument(d.documentId, { companyId, projectId });
      showToast(t("documents.retry"), "success");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Retry failed", "error");
    }
  }

  async function handleDownload(d: DocumentRecord) {
    if (!companyId) return;
    try {
      const { downloadUrl } = await getDownloadUrl(d.documentId, companyId, projectId);
      window.open(downloadUrl, "_blank");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Download failed", "error");
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-base font-semibold text-foreground">{t("documents.title")}</h2>
        <p className="mt-0.5 text-xs text-foreground-subtle">{t("documents.subtitle")}</p>
      </div>

      {/* Dropzone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition",
          dragging
            ? "border-primary bg-primary-soft"
            : "border-black/[0.08] bg-surface hover:border-primary/40 hover:bg-primary-soft/30"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ALLOWED_MIME_TYPES.join(",")}
          onChange={handleInputChange}
          className="sr-only"
        />
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-soft">
          <Upload className="h-5 w-5 text-primary" />
        </div>
        <p className="text-sm font-medium text-foreground">{t("documents.dragHere")}</p>
        <p className="mt-1 text-xs text-foreground-subtle">{t("documents.supported")}</p>
      </div>

      {/* Pending uploads (transient) */}
      {pending.length > 0 && (
        <div className="space-y-2">
          {pending.map((p) => (
            <div key={p.file.name} className="flex items-center gap-3 rounded-xl border border-black/[0.06] bg-surface px-4 py-3">
              <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{p.file.name}</p>
                <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-black/[0.06]">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${p.progress}%` }} />
                </div>
              </div>
              <span className="shrink-0 text-xs text-foreground-subtle">
                {p.state === "uploading" ? t("documents.uploading")
                  : p.state === "confirming" ? t("documents.processing")
                  : p.state === "failed" ? t("documents.failed")
                  : t("documents.ready")}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Document list */}
      {loading ? (
        <div className="flex h-24 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-foreground-subtle" />
        </div>
      ) : error ? (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4" /> <span>{error}</span>
        </div>
      ) : visibleDocuments.length === 0 && pending.length === 0 ? (
        <p className="py-8 text-center text-sm text-foreground-subtle">{t("documents.empty")}</p>
      ) : (
        <div className="space-y-2">
          {visibleDocuments.map((d) => {
            const Icon = iconFor(d.mimeType);
            const s = statusOf(d);
            const stepKey = d.currentStep ? `documents.step_${d.currentStep}` : null;
            const progress = d.progressPercent
              ?? (d.currentStep ? PROGRESS_BY_STEP[d.currentStep] : undefined)
              ?? (s === "ready" ? 100 : 0);
            const name = d.filename || d.name || d.documentId.slice(0, 12);

            return (
              <div key={d.documentId} className="flex items-center gap-3 rounded-xl border border-black/[0.06] bg-card px-4 py-3">
                <Icon className="h-5 w-5 shrink-0 text-foreground-subtle" strokeWidth={1.5} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-foreground">{name}</p>
                    <StatusBadge status={s} t={t} />
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-foreground-subtle">
                    {d.sizeBytes && <span>{(d.sizeBytes / 1024 / 1024).toFixed(2)} MB</span>}
                    <span>·</span>
                    <span>{timeAgoFromIso(d.createdAt || d.uploadedAt)}</span>
                    {s === "processing" && stepKey && (
                      <>
                        <span>·</span>
                        <span>{t(stepKey)}</span>
                      </>
                    )}
                    {s === "failed" && d.error?.message && (
                      <>
                        <span>·</span>
                        <span className="text-red-600">{d.error.message}</span>
                      </>
                    )}
                  </div>
                  {s === "processing" && (
                    <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-black/[0.06]">
                      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                    </div>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  {s === "failed" && (
                    <button
                      onClick={() => handleRetry(d)}
                      className="rounded-md p-1.5 text-foreground-subtle hover:bg-black/[0.05] hover:text-foreground"
                      title={t("documents.retry")}
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {s === "ready" && (
                    <button
                      onClick={() => handleDownload(d)}
                      className="rounded-md p-1.5 text-foreground-subtle hover:bg-black/[0.05] hover:text-foreground"
                      title={t("documents.download")}
                    >
                      <Download className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(d)}
                    className="rounded-md p-1.5 text-foreground-subtle hover:bg-red-50 hover:text-red-600"
                    title={t("documents.delete")}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status, t }: { status: "pending"|"uploading"|"processing"|"ready"|"failed"; t: (k: string) => string }) {
  const map = {
    pending:    { cls: "bg-foreground-subtle/10 text-foreground-subtle", icon: Loader2,        spin: false },
    uploading:  { cls: "bg-primary-soft text-primary",                   icon: Loader2,        spin: true },
    processing: { cls: "bg-primary-soft text-primary",                   icon: Loader2,        spin: true },
    ready:      { cls: "bg-emerald-50 text-emerald-700",                 icon: CheckCircle2,   spin: false },
    failed:     { cls: "bg-red-50 text-red-700",                         icon: AlertCircle,    spin: false },
  } as const;
  const { cls, icon: Icon, spin } = map[status];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${cls}`}>
      <Icon className={cn("h-2.5 w-2.5", spin && "animate-spin")} />
      {t(`documents.${status}`)}
    </span>
  );
}
