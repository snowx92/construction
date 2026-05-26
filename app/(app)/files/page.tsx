import type { Metadata } from "next";
import { mockFiles } from "@/data/mock";
import { FileText, Table, Image, File, Upload, Search, Grid, List, CheckCircle, Clock } from "lucide-react";

export const metadata: Metadata = { title: "Files" };

const TYPE_ICONS: Record<string, React.ElementType> = {
  pdf:   FileText,
  xlsx:  Table,
  dwg:   File,
  docx:  FileText,
  image: Image,
  other: File,
};
const TYPE_COLORS: Record<string, string> = {
  pdf:   "var(--color-danger)",
  xlsx:  "var(--color-success)",
  dwg:   "var(--color-ai)",
  docx:  "var(--color-info)",
  other: "var(--color-text-3)",
};

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FilesPage() {
  return (
    <div className="mx-auto max-w-[1200px] px-8 py-10">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest mb-1" style={{ color: "var(--color-text-3)" }}>File Library</p>
          <h1 className="text-3xl font-semibold" style={{ color: "var(--color-text-1)" }}>Uploaded Files</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--color-text-2)" }}>{mockFiles.length} files · {mockFiles.filter(f => f.aiProcessed).length} AI-processed</p>
        </div>
        <label className="btn-primary cursor-pointer" htmlFor="file-upload-lib">
          <Upload className="h-4 w-4" strokeWidth={1.5} />
          Upload Files
          <input id="file-upload-lib" type="file" className="sr-only" multiple accept=".pdf,.dwg,.xlsx,.docx" />
        </label>
      </div>

      {/* Search + view toggle */}
      <div className="mb-6 flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2" strokeWidth={1.5} style={{ color: "var(--color-text-3)" }} />
          <input type="text" placeholder="Search files…" className="input pl-10" />
        </div>
        <div className="flex rounded-[12px] overflow-hidden" style={{ border: "1px solid var(--color-border)" }}>
          <button className="px-3 py-2.5 flex items-center" style={{ background: "var(--color-accent)", color: "white" }}>
            <Grid className="h-4 w-4" strokeWidth={1.5} />
          </button>
          <button className="px-3 py-2.5 flex items-center" style={{ background: "var(--color-surface)", color: "var(--color-text-3)" }}>
            <List className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Drop zone */}
      <div
        className="mb-6 rounded-[20px] border-2 border-dashed p-8 text-center"
        style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}
      >
        <Upload className="mx-auto h-8 w-8 mb-3" strokeWidth={1.5} style={{ color: "var(--color-text-3)" }} />
        <p className="text-sm font-medium mb-1" style={{ color: "var(--color-text-2)" }}>Drop files here or click to upload</p>
        <p className="text-xs" style={{ color: "var(--color-text-3)" }}>PDF · DWG · XLSX · DOCX · Max 100MB per file</p>
      </div>

      {/* Files grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {mockFiles.map((file) => {
          const Icon = TYPE_ICONS[file.type] ?? File;
          const color = TYPE_COLORS[file.type] ?? "var(--color-text-3)";
          return (
            <div key={file.id} className="card p-5 cursor-pointer hover:shadow-[0_2px_16px_oklch(18%_0.008_75/0.07)]">
              <div className="flex items-start justify-between mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[12px]" style={{ background: color + "15" }}>
                  <Icon className="h-5 w-5" strokeWidth={1.5} style={{ color }} />
                </div>
                <div className="flex items-center gap-1">
                  {file.aiProcessed
                    ? <span className="badge badge-ai gap-1"><CheckCircle className="h-2.5 w-2.5" strokeWidth={2} /> AI</span>
                    : <span className="badge badge-neutral gap-1"><Clock className="h-2.5 w-2.5" strokeWidth={2} /> Pending</span>
                  }
                </div>
              </div>

              <p className="text-xs font-semibold mb-1 truncate" style={{ color: "var(--color-text-1)" }}>{file.name}</p>
              <p className="text-xs mb-3" style={{ color: "var(--color-text-3)" }}>
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
