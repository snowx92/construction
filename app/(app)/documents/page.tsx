"use client";

import { mockFiles, mockTenders } from "@/data/mock";
import { Folder, FileText, ChevronRight, Download, Eye } from "lucide-react";
import { useT } from "@/lib/i18n";

export default function DocumentsPage() {
  const t = useT();
  const tenderDocs = mockTenders.map((tender) => ({
    tender,
    files: mockFiles.filter((f) => f.tenderId === tender.id),
  }));

  return (
    <div className="mx-auto max-w-[1200px] px-8 py-10">
      <div className="mb-8">
        <p className="text-xs font-medium uppercase tracking-widest text-foreground-subtle mb-1">{t("documents.eyebrow")}</p>
        <h1 className="text-3xl font-semibold text-foreground">{t("documents.title")}</h1>
        <p className="mt-1 text-sm text-foreground-muted">{t("documents.subtitle")}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">

        {/* Folder tree */}
        <div className="card p-5">
          <p className="text-xs font-medium uppercase tracking-widest text-foreground-subtle mb-4">{t("documents.library")}</p>
          <div className="space-y-1">
            {[
              t("documents.folderAll"),
              t("documents.folderTenderPackages"),
              t("documents.folderBoqDrawings"),
              t("documents.folderProposals"),
              t("documents.folderContracts"),
              t("documents.folderReports"),
            ].map((folder, i) => (
              <button
                key={folder}
                className={`w-full flex items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-left transition-colors hover:bg-black/[0.03] ${i === 0 ? "bg-primary-soft text-primary" : "text-foreground-muted"}`}
              >
                <Folder className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                <span className="text-sm font-medium">{folder}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Document list */}
        <div className="lg:col-span-2 space-y-4">
          {tenderDocs.map(({ tender, files }) => (
            <div key={tender.id} className="card overflow-hidden">
              <div
                className={`flex items-center gap-3 px-5 py-4 cursor-pointer ${files.length > 0 ? "border-b border-black/[0.05]" : ""}`}
              >
                <Folder className="h-4 w-4 text-primary" strokeWidth={1.5} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate text-foreground">{tender.title}</p>
                  <p className="text-xs text-foreground-subtle">{t("documents.fileCount", { count: files.length })}</p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-foreground-subtle" strokeWidth={1.5} />
              </div>

              {files.length > 0 && (
                <div className="divide-y divide-black/[0.05]">
                  {files.map((f) => (
                    <div key={f.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-black/[0.025]">
                      <FileText className="h-4 w-4 shrink-0 text-foreground-subtle" strokeWidth={1.5} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate text-foreground">{f.name}</p>
                        <p className="text-xs text-foreground-subtle">{f.type.toUpperCase()} · {new Date(f.uploadedAt).toLocaleDateString()}</p>
                      </div>
                      {f.aiProcessed && <span className="badge badge-ai shrink-0">{t("documents.badgeAi")}</span>}
                      <div className="flex items-center gap-1">
                        <button className="btn-ghost py-1.5 px-2"><Eye className="h-3.5 w-3.5" strokeWidth={1.5} /></button>
                        <button className="btn-ghost py-1.5 px-2"><Download className="h-3.5 w-3.5" strokeWidth={1.5} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {files.length === 0 && (
                <div className="px-5 py-8 text-center border-t border-black/[0.05]">
                  <p className="text-xs text-foreground-subtle">{t("documents.empty")}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
