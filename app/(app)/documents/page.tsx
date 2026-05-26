import type { Metadata } from "next";
import { mockFiles, mockTenders } from "@/data/mock";
import { Folder, FileText, ChevronRight, Download, Eye } from "lucide-react";

export const metadata: Metadata = { title: "Documents" };

export default function DocumentsPage() {
  const tenderDocs = mockTenders.map((t) => ({
    tender: t,
    files: mockFiles.filter((f) => f.tenderId === t.id),
  }));

  return (
    <div className="mx-auto max-w-[1200px] px-8 py-10">
      <div className="mb-8">
        <p className="text-xs font-medium uppercase tracking-widest mb-1" style={{ color: "var(--color-text-3)" }}>Document Management</p>
        <h1 className="text-3xl font-semibold" style={{ color: "var(--color-text-1)" }}>Documents</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--color-text-2)" }}>Organized by tender and project</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">

        {/* Folder tree */}
        <div className="card p-5">
          <p className="text-xs font-medium uppercase tracking-widest mb-4" style={{ color: "var(--color-text-3)" }}>Library</p>
          <div className="space-y-1">
            {["All Documents", "Tender Packages", "BOQs & Drawings", "Proposals", "Contracts", "Reports"].map((folder, i) => (
              <button
                key={folder}
                className="w-full flex items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-left transition-colors hover:bg-sand-100/60"
                style={i === 0 ? { background: "var(--color-accent-muted)", color: "var(--color-accent)" } : { color: "var(--color-text-2)" }}
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
                className="flex items-center gap-3 px-5 py-4 cursor-pointer"
                style={{ borderBottom: files.length > 0 ? "1px solid var(--color-border-sub)" : "none" }}
              >
                <Folder className="h-4 w-4" strokeWidth={1.5} style={{ color: "var(--color-accent)" }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: "var(--color-text-1)" }}>{tender.title}</p>
                  <p className="text-xs" style={{ color: "var(--color-text-3)" }}>{files.length} files</p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0" strokeWidth={1.5} style={{ color: "var(--color-text-3)" }} />
              </div>

              {files.length > 0 && (
                <div className="divide-y" style={{ borderColor: "var(--color-border-sub)" }}>
                  {files.map((f) => (
                    <div key={f.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-sand-50/50">
                      <FileText className="h-4 w-4 shrink-0" strokeWidth={1.5} style={{ color: "var(--color-text-3)" }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate" style={{ color: "var(--color-text-1)" }}>{f.name}</p>
                        <p className="text-xs" style={{ color: "var(--color-text-3)" }}>{f.type.toUpperCase()} · {new Date(f.uploadedAt).toLocaleDateString()}</p>
                      </div>
                      {f.aiProcessed && <span className="badge badge-ai shrink-0">AI</span>}
                      <div className="flex items-center gap-1">
                        <button className="btn-ghost py-1.5 px-2"><Eye className="h-3.5 w-3.5" strokeWidth={1.5} /></button>
                        <button className="btn-ghost py-1.5 px-2"><Download className="h-3.5 w-3.5" strokeWidth={1.5} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {files.length === 0 && (
                <div className="px-5 py-8 text-center" style={{ borderTop: "1px solid var(--color-border-sub)" }}>
                  <p className="text-xs" style={{ color: "var(--color-text-3)" }}>No documents yet</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
