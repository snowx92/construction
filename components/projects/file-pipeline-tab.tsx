"use client";

import { useState, useRef } from "react";
import {
  Upload, FileText, CheckCircle, Loader2, AlertTriangle,
  Clock, Zap, ChevronRight, X, File,
} from "lucide-react";
import type { ProjectWorkspace, UploadedFile } from "@/types";

type PipelineStage = "uploaded" | "parsing" | "extracting" | "pricing" | "ready" | "error";

interface PipelineFile {
  file: UploadedFile;
  stage: PipelineStage;
  progress: number; // 0-100
  error?: string;
}

const STAGE_ORDER: PipelineStage[] = ["uploaded", "parsing", "extracting", "pricing", "ready"];

const STAGE_META: Record<PipelineStage, { label: string; desc: string; color: string }> = {
  uploaded:   { label: "Uploaded",        desc: "File received and queued for processing",         color: "var(--color-text-3)" },
  parsing:    { label: "Parsing",         desc: "Extracting text and structure from document",      color: "var(--color-ai)" },
  extracting: { label: "Extracting BOQ",  desc: "AI identifying quantities, items, and rates",      color: "var(--color-accent)" },
  pricing:    { label: "Pricing",         desc: "Matching BOQ items to market rate database",       color: "var(--color-warning)" },
  ready:      { label: "Ready",           desc: "Processing complete — data available in all tabs", color: "var(--color-success)" },
  error:      { label: "Error",           desc: "Processing failed — check file format",            color: "var(--color-danger)" },
};

const FILE_TYPE_ICONS: Record<string, string> = {
  pdf: "📄", dwg: "📐", xlsx: "📊", docx: "📝", image: "🖼️", other: "📎",
};

/* Simulate a file going through the pipeline */
function useMockPipeline() {
  const [files, setFiles] = useState<PipelineFile[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());

  function enqueue(f: UploadedFile) {
    const pf: PipelineFile = { file: f, stage: "uploaded", progress: 0 };
    setFiles((prev) => [...prev, pf]);

    const stages: PipelineStage[] = ["parsing", "extracting", "pricing", "ready"];
    let stageIdx = 0;
    const interval = setInterval(() => {
      setFiles((prev) =>
        prev.map((x) => {
          if (x.file.id !== f.id) return x;
          const nextStage = stages[stageIdx];
          stageIdx++;
          if (stageIdx >= stages.length) {
            clearInterval(interval);
            timers.current.delete(f.id);
          }
          return { ...x, stage: nextStage, progress: Math.round(((stageIdx) / stages.length) * 100) };
        })
      );
    }, 1400);
    timers.current.set(f.id, interval);
  }

  function remove(id: string) {
    const t = timers.current.get(id);
    if (t) { clearInterval(t); timers.current.delete(id); }
    setFiles((prev) => prev.filter((f) => f.file.id !== id));
  }

  return { files, enqueue, remove };
}

export function FilePipelineTab({ ws }: { ws: ProjectWorkspace }) {
  const { files, enqueue, remove } = useMockPipeline();
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Seed with existing workspace files (shown as already ready)
  const existingFiles: PipelineFile[] = ws.files.map((f) => ({
    file: f,
    stage: "ready" as PipelineStage,
    progress: 100,
  }));

  const allFiles = [...existingFiles, ...files];

  const readyCount = allFiles.filter((f) => f.stage === "ready").length;
  const processingCount = allFiles.filter((f) => f.stage !== "ready" && f.stage !== "error" && f.stage !== "uploaded").length;

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    Array.from(e.dataTransfer.files).forEach((f) => mockUpload(f.name, f.type));
  }

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    Array.from(e.target.files ?? []).forEach((f) => mockUpload(f.name, f.type));
    e.target.value = "";
  }

  function mockUpload(name: string, mime: string) {
    const ext = name.split(".").pop()?.toLowerCase() ?? "other";
    const type = (["pdf", "dwg", "xlsx", "docx"].includes(ext) ? ext : ext.startsWith("image") ? "image" : "other") as UploadedFile["type"];
    const fake: UploadedFile = {
      id:          `new-${Date.now()}-${Math.random()}`,
      name,
      type,
      size:        Math.random() * 5_000_000 + 200_000,
      uploadedAt:  new Date().toISOString(),
      tenderId:    ws.tenderId,
      aiProcessed: false,
      tags:        [],
    };
    enqueue(fake);
  }

  return (
    <div className="max-w-[860px] space-y-5">

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total files",  value: allFiles.length,    color: "var(--color-text-1)"  },
          { label: "Processing",   value: processingCount,    color: "var(--color-ai)"      },
          { label: "Ready",        value: readyCount,         color: "var(--color-success)" },
        ].map(({ label, value, color }) => (
          <div key={label} className="card px-5 py-4">
            <p className="text-xs mb-1" style={{ color: "var(--color-text-3)" }}>{label}</p>
            <p className="text-2xl font-bold font-mono" style={{ color }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className="rounded-[20px] border-2 border-dashed p-10 text-center cursor-pointer transition-all"
        style={{
          borderColor: dragging ? "var(--color-accent)" : "var(--color-border)",
          background: dragging ? "var(--color-accent-muted)" : "var(--color-surface)",
        }}
      >
        <input ref={inputRef} type="file" multiple className="hidden" onChange={handleInput} accept=".pdf,.dwg,.xlsx,.docx,.jpg,.png" />
        <Upload className="mx-auto h-8 w-8 mb-3" strokeWidth={1.5} style={{ color: dragging ? "var(--color-accent)" : "var(--color-text-3)" }} />
        <p className="text-sm font-medium mb-1" style={{ color: dragging ? "var(--color-accent)" : "var(--color-text-1)" }}>
          {dragging ? "Drop files to upload" : "Upload tender files"}
        </p>
        <p className="text-xs" style={{ color: "var(--color-text-3)" }}>
          PDF, DWG, XLSX, DOCX — AI processes automatically on upload
        </p>
      </div>

      {/* Pipeline stage legend */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {STAGE_ORDER.map((stage, i) => (
          <div key={stage} className="flex items-center gap-1 shrink-0">
            <div className="flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full"
              style={{ background: "var(--color-panel)", border: "1px solid var(--color-border)", color: STAGE_META[stage].color }}>
              <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: STAGE_META[stage].color }} />
              {STAGE_META[stage].label}
            </div>
            {i < STAGE_ORDER.length - 1 && <ChevronRight className="h-3 w-3 shrink-0" style={{ color: "var(--color-border)" }} />}
          </div>
        ))}
      </div>

      {/* File list */}
      {allFiles.length === 0 ? (
        <div className="card p-12 text-center">
          <FileText className="mx-auto h-8 w-8 mb-3" strokeWidth={1.5} style={{ color: "var(--color-text-3)" }} />
          <p className="text-sm" style={{ color: "var(--color-text-3)" }}>No files uploaded yet</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="px-5 py-3 flex items-center gap-2" style={{ borderBottom: "1px solid var(--color-border-sub)", background: "var(--color-panel)" }}>
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--color-text-3)" }}>Files</p>
            {processingCount > 0 && (
              <span className="flex items-center gap-1 badge badge-ai animate-pulse ml-1">
                <Loader2 className="h-2.5 w-2.5 animate-spin" />
                {processingCount} processing
              </span>
            )}
          </div>

          <div className="divide-y" style={{ borderColor: "var(--color-border-sub)" }}>
            {allFiles.map((pf) => {
              const isExisting = existingFiles.some((e) => e.file.id === pf.file.id);
              const meta = STAGE_META[pf.stage];
              const stageIdx = STAGE_ORDER.indexOf(pf.stage);
              const isProcessing = pf.stage !== "ready" && pf.stage !== "error" && pf.stage !== "uploaded";

              return (
                <div key={pf.file.id} className="px-5 py-3.5">
                  <div className="flex items-start gap-3">
                    {/* File icon */}
                    <span className="text-xl shrink-0 leading-none mt-0.5">
                      {FILE_TYPE_ICONS[pf.file.type] ?? "📎"}
                    </span>

                    {/* Main info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium truncate" style={{ color: "var(--color-text-1)" }}>{pf.file.name}</p>
                        <span className="text-[10px] font-mono shrink-0" style={{ color: "var(--color-text-3)" }}>
                          {(pf.file.size / 1_000_000).toFixed(1)} MB
                        </span>
                      </div>

                      {/* Stage progress bar */}
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--color-border)" }}>
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${pf.stage === "ready" ? 100 : ((stageIdx + 1) / STAGE_ORDER.length) * 100}%`,
                              background: meta.color,
                            }}
                          />
                        </div>
                        <span className="text-[10px] font-medium shrink-0" style={{ color: meta.color }}>
                          {meta.label}
                        </span>
                      </div>

                      {/* Stage pipeline dots */}
                      <div className="flex items-center gap-1">
                        {STAGE_ORDER.map((s, i) => {
                          const done = pf.stage === "ready" || stageIdx > i;
                          const active = s === pf.stage && s !== "ready";
                          return (
                            <div key={s} className="flex items-center gap-1">
                              <div
                                className="h-1.5 w-1.5 rounded-full transition-all"
                                style={{
                                  background: done || active ? STAGE_META[s].color : "var(--color-border)",
                                  opacity: active ? 1 : done ? 0.8 : 0.35,
                                }}
                              />
                              {i < STAGE_ORDER.length - 1 && (
                                <div className="h-px w-3" style={{ background: done ? "var(--color-border)" : "var(--color-border-sub)" }} />
                              )}
                            </div>
                          );
                        })}
                        <span className="text-[10px] ml-2" style={{ color: "var(--color-text-3)" }}>
                          {meta.desc}
                        </span>
                      </div>
                    </div>

                    {/* Status icon + remove */}
                    <div className="shrink-0 flex items-center gap-2">
                      {pf.stage === "ready" ? (
                        <CheckCircle className="h-4 w-4" strokeWidth={1.5} style={{ color: "var(--color-success)" }} />
                      ) : pf.stage === "error" ? (
                        <AlertTriangle className="h-4 w-4" strokeWidth={1.5} style={{ color: "var(--color-danger)" }} />
                      ) : pf.stage === "uploaded" ? (
                        <Clock className="h-4 w-4" strokeWidth={1.5} style={{ color: "var(--color-text-3)" }} />
                      ) : (
                        <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.5} style={{ color: "var(--color-ai)" }} />
                      )}
                      {!isExisting && (
                        <button onClick={() => remove(pf.file.id)} className="btn-ghost p-1">
                          <X className="h-3.5 w-3.5" strokeWidth={1.5} style={{ color: "var(--color-text-3)" }} />
                        </button>
                      )}
                      {pf.file.aiProcessed && (
                        <span className="badge badge-ai text-[9px] px-1.5">AI</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
