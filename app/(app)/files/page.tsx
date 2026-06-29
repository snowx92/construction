"use client";

import { mockFiles } from "@/data/mock";
import { FileText, Table, Image, File, Upload, Search, Grid, List, CheckCircle, Clock } from "lucide-react";
import { useT } from "@/lib/i18n";

const TYPE_ICONS: Record<string, React.ElementType> = {
  pdf:   FileText,
  xlsx:  Table,
  dwg:   File,
  docx:  FileText,
  image: Image,
  other: File,
};
const TYPE_COLORS: Record<string, string> = {
  pdf:   "rgb(var(--danger))",
  xlsx:  "rgb(var(--success))",
  dwg:   "rgb(var(--primary))",
  docx:  "rgb(var(--primary))",
  other: "rgb(var(--foreground-subtle))",
};

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FilesPage() {
  const t = useT();
  return (
    <div className="mx-auto max-w-[1200px] px-8 py-10">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-foreground-subtle mb-1">{t("files.eyebrow")}</p>
          <h1 className="text-3xl font-semibold text-foreground">{t("files.title")}</h1>
          <p className="mt-1 text-sm text-foreground-muted">
            {t("files.count", { count: mockFiles.length })} · {t("files.aiProcessed", { count: mockFiles.filter(f => f.aiProcessed).length })}
          </p>
        </div>
        <label className="btn-primary cursor-pointer" htmlFor="file-upload-lib">
          <Upload className="h-4 w-4" strokeWidth={1.5} />
          {t("files.uploadButton")}
          <input id="file-upload-lib" type="file" className="sr-only" multiple accept=".pdf,.dwg,.xlsx,.docx" />
        </label>
      </div>

      {/* Search + view toggle */}
      <div className="mb-6 flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-subtle" strokeWidth={1.5} />
          <input type="text" placeholder={t("files.searchPlaceholder")} className="input pl-10" />
        </div>
        <div className="flex rounded-[12px] overflow-hidden border border-black/[0.06]">
          <button className="px-3 py-2.5 flex items-center bg-primary text-white">
            <Grid className="h-4 w-4" strokeWidth={1.5} />
          </button>
          <button className="px-3 py-2.5 flex items-center bg-surface text-foreground-subtle">
            <List className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Drop zone */}
      <div
        className="mb-6 rounded-[20px] border-2 border-dashed border-black/[0.06] bg-surface p-8 text-center"
      >
        <Upload className="mx-auto h-8 w-8 mb-3 text-foreground-subtle" strokeWidth={1.5} />
        <p className="text-sm font-medium mb-1 text-foreground-muted">{t("files.dropZoneTitle")}</p>
        <p className="text-xs text-foreground-subtle">{t("files.dropZoneSub")}</p>
      </div>

      {/* Files grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {mockFiles.map((file) => {
          const Icon = TYPE_ICONS[file.type] ?? File;
          const color = TYPE_COLORS[file.type] ?? "rgb(var(--foreground-subtle))";
          return (
            <div key={file.id} className="card p-5 cursor-pointer hover:shadow-[var(--shadow-lg)]">
              <div className="flex items-start justify-between mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[12px]" style={{ background: color + "15" }}>
                  <Icon className="h-5 w-5" strokeWidth={1.5} style={{ color }} />
                </div>
                <div className="flex items-center gap-1">
                  {file.aiProcessed
                    ? <span className="badge badge-ai gap-1"><CheckCircle className="h-2.5 w-2.5" strokeWidth={2} /> {t("files.badgeAi")}</span>
                    : <span className="badge badge-neutral gap-1"><Clock className="h-2.5 w-2.5" strokeWidth={2} /> {t("files.badgePending")}</span>
                  }
                </div>
              </div>

              <p className="text-xs font-semibold mb-1 truncate text-foreground">{file.name}</p>
              <p className="text-xs mb-3 text-foreground-subtle">
                {file.type.toUpperCase()} · {formatSize(file.size)}
              </p>

              {file.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {file.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="badge badge-neutral text-[10px] px-2 py-0.5">{tag}</span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
