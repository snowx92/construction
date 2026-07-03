"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Folder, FileText, ChevronRight, Download, Loader2, AlertCircle, Search,
} from "lucide-react";
import { useT } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import { useProjects } from "@/lib/use-projects";
import { showToast } from "@/lib/toast";
import { ApiError } from "@/lib/api/client";
import { getDocumentDownloadUrl, listCompanyDocuments } from "@/lib/api/documents";
import type { DocumentRecord } from "@/lib/api/types";
import { timeAgoFromIso } from "@/lib/project-status";
import { cn } from "@/lib/utils";

type FolderKey = "all" | "tender" | "boq" | "proposals" | "contracts" | "reports";

function docName(d: DocumentRecord & { originalFilename?: string }) {
  return d.filename || d.name || d.originalFilename || d.documentId.slice(0, 12);
}

function mimeLabel(mime?: string) {
  if (!mime) return "FILE";
  const ext = mime.split("/").pop();
  return (ext ?? mime).toUpperCase();
}

function matchesFolder(doc: DocumentRecord, folder: FolderKey): boolean {
  if (folder === "all") return true;
  const name = docName(doc).toLowerCase();
  const mime = (doc.mimeType ?? "").toLowerCase();
  switch (folder) {
    case "tender":
      return mime.includes("pdf") || /tender|rfp|scope|spec/.test(name);
    case "boq":
      return mime.includes("sheet") || mime.includes("excel") || mime.includes("dwg") || /boq|drawing|dwg|xlsx/.test(name);
    case "proposals":
      return /proposal|submission|method/.test(name);
    case "contracts":
      return /contract|agreement|nda/.test(name);
    case "reports":
      return /report|hse|safety|audit/.test(name);
    default:
      return true;
  }
}

export default function DocumentsPage() {
  const t = useT();
  const { profile } = useAuth();
  const companyId = profile?.activeCompanyId;
  const { projects } = useProjects();

  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [activeFolder, setActiveFolder] = useState<FolderKey>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const folders: { key: FolderKey; label: string }[] = [
    { key: "all", label: t("documents.folderAll") },
    { key: "tender", label: t("documents.folderTenderPackages") },
    { key: "boq", label: t("documents.folderBoqDrawings") },
    { key: "proposals", label: t("documents.folderProposals") },
    { key: "contracts", label: t("documents.folderContracts") },
    { key: "reports", label: t("documents.folderReports") },
  ];

  const projectNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of projects) {
      if (p.projectId) map.set(p.projectId, p.name);
    }
    return map;
  }, [projects]);

  const filteredDocuments = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return documents.filter((doc) => {
      if (!matchesFolder(doc, activeFolder)) return false;
      if (!q) return true;
      return docName(doc).toLowerCase().includes(q);
    });
  }, [documents, activeFolder, searchQuery]);

  const groupedByProject = useMemo(() => {
    const groups = new Map<string, DocumentRecord[]>();
    for (const doc of filteredDocuments) {
      const pid = doc.projectId;
      if (!pid) continue;
      const list = groups.get(pid) ?? [];
      list.push(doc);
      groups.set(pid, list);
    }
    return [...groups.entries()]
      .map(([projectId, files]) => ({
        projectId,
        projectName: projectNameById.get(projectId) ?? projectId,
        files,
      }))
      .sort((a, b) => a.projectName.localeCompare(b.projectName));
  }, [filteredDocuments, projectNameById]);

  const reload = useCallback(async () => {
    if (!companyId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await listCompanyDocuments({ companyId, limit: 500 });
      setDocuments(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("documents.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [companyId, t]);

  useEffect(() => {
    reload();
  }, [reload]);

  async function handleDownload(doc: DocumentRecord) {
    if (!companyId || !doc.projectId) return;
    setDownloadingId(doc.documentId);
    try {
      const { downloadUrl } = await getDocumentDownloadUrl(doc.documentId, companyId, doc.projectId);
      window.open(downloadUrl, "_blank");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : t("documents.downloadFailed"), "error");
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <div className="mx-auto max-w-[1200px] px-8 py-10">
      <div className="mb-8">
        <p className="text-xs font-medium uppercase tracking-widest text-foreground-subtle mb-1">{t("documents.eyebrow")}</p>
        <h1 className="text-3xl font-semibold text-foreground">{t("documents.title")}</h1>
        <p className="mt-1 text-sm text-foreground-muted">{t("documents.subtitle")}</p>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-foreground-subtle" />
        </div>
      ) : error ? (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="card p-5">
            <p className="text-xs font-medium uppercase tracking-widest text-foreground-subtle mb-4">{t("documents.library")}</p>
            <div className="space-y-1">
              {folders.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveFolder(key)}
                  className={cn(
                    "w-full flex items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-left transition-colors hover:bg-black/[0.03]",
                    activeFolder === key ? "bg-primary-soft text-primary" : "text-foreground-muted",
                  )}
                >
                  <Folder className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                  <span className="text-sm font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div className="relative">
              <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-subtle" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("documents.searchPlaceholder")}
                className="input w-full ps-9"
              />
            </div>

            {groupedByProject.length === 0 ? (
              <div className="card px-5 py-12 text-center">
                <p className="text-sm text-foreground-subtle">
                  {documents.length === 0 ? t("documents.empty") : t("documents.noMatches")}
                </p>
                {documents.length === 0 && projects.length > 0 && (
                  <Link
                    href={`/projects/${projects[0].projectId}`}
                    className="mt-3 inline-block text-sm font-medium text-primary hover:opacity-80"
                  >
                    {t("documents.uploadCta")} →
                  </Link>
                )}
              </div>
            ) : (
              groupedByProject.map(({ projectId, projectName, files }) => (
                <div key={projectId} className="card overflow-hidden">
                  <Link
                    href={`/projects/${projectId}`}
                    className={`flex items-center gap-3 px-5 py-4 transition-colors hover:bg-black/[0.02] ${files.length > 0 ? "border-b border-black/[0.05]" : ""}`}
                  >
                    <Folder className="h-4 w-4 text-primary" strokeWidth={1.5} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate text-foreground">{projectName}</p>
                      <p className="text-xs text-foreground-subtle">{t("documents.fileCount", { count: files.length })}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-foreground-subtle" strokeWidth={1.5} />
                  </Link>

                  {files.length > 0 && (
                    <div className="divide-y divide-black/[0.05]">
                      {files.map((f) => (
                        <div key={f.documentId} className="flex items-center gap-3 px-5 py-3.5 hover:bg-black/[0.025]">
                          <FileText className="h-4 w-4 shrink-0 text-foreground-subtle" strokeWidth={1.5} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate text-foreground">{docName(f)}</p>
                            <p className="text-xs text-foreground-subtle">
                              {mimeLabel(f.mimeType)} · {timeAgoFromIso(f.uploadedAt ?? f.createdAt)}
                            </p>
                          </div>
                          {f.status === "ready" && (
                            <span className="badge badge-ai shrink-0">{t("documents.badgeAi")}</span>
                          )}
                          <button
                            type="button"
                            className="btn-ghost py-1.5 px-2"
                            disabled={downloadingId === f.documentId}
                            onClick={() => handleDownload(f)}
                            aria-label={t("documents.download")}
                          >
                            {downloadingId === f.documentId ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.5} />
                            ) : (
                              <Download className="h-3.5 w-3.5" strokeWidth={1.5} />
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
