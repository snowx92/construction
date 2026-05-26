"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileText, Zap, ArrowRight, X } from "lucide-react";
import { useProjectStore } from "@/store";
import { COUNTRY_LIST, type CountryCode } from "@/lib/countries";
import { useT, useLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const PROJECT_TYPES = [
  "Road Infrastructure", "MEP — Building", "MEP — Industrial", "Electrical — HV/MV",
  "Civil — Structures", "Fit-Out — Commercial", "Fit-Out — Education",
  "Water & Drainage", "Oil & Gas", "Solar / Renewables", "Other",
];

export default function NewProjectPage() {
  const t = useT();
  const { dir } = useLocale();
  const router = useRouter();
  const addWorkspace = useProjectStore((s) => s.addWorkspace);
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [client, setClient] = useState("");
  const [country, setCountry] = useState<CountryCode>("eg");
  const [dragging, setDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [creating, setCreating] = useState(false);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const dropped = Array.from(e.dataTransfer.files);
    setFiles((f) => [...f, ...dropped]);
    if (!name && dropped[0]) setName(dropped[0].name.replace(/\.[^.]+$/, "").replace(/_/g, " "));
  }

  async function handleCreate() {
    if (!name.trim()) return;
    setCreating(true);
    const id = addWorkspace({
      name: name.trim(),
      clientName: client.trim() || "Unknown client",
      projectType: type || "Other",
      country,
      status: files.length > 0 ? "analyzing" : "new",
      pinned: false,
    });
    // Small delay to feel responsive then navigate
    await new Promise((r) => setTimeout(r, 400));
    router.push(`/projects/${id}`);
  }

  return (
    <div className="mx-auto max-w-[680px] px-8 py-12">
      <div className="mb-10">
        <p className="text-xs font-medium uppercase tracking-widest mb-1" style={{ color: "var(--color-text-3)" }}>{t("newProject.eyebrow")}</p>
        <h1 className="text-3xl font-semibold" style={{ color: "var(--color-text-1)" }}>{t("newProject.title")}</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--color-text-2)" }}>{t("newProject.subtitle")}</p>
      </div>

      <div className="space-y-5">
        {/* Upload zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className="rounded-[20px] border-2 border-dashed p-10 text-center transition-all cursor-pointer"
          style={{ borderColor: dragging ? "var(--color-accent)" : "var(--color-border)", background: dragging ? "var(--color-accent-muted)" : "var(--color-surface)" }}
        >
          <label htmlFor="file-new" className="cursor-pointer">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-[18px]" style={{ background: "var(--color-accent-muted)" }}>
              <Upload className="h-6 w-6" strokeWidth={1.5} style={{ color: "var(--color-accent)" }} />
            </div>
            <p className="text-sm font-semibold mb-1" style={{ color: "var(--color-text-1)" }}>{t("newProject.dropFiles")}</p>
            <p className="text-xs" style={{ color: "var(--color-text-3)" }}>
              {t("newProject.dropFilesSub")}
            </p>
            <p className="mt-3 text-xs" style={{ color: "var(--color-text-3)" }}>
              {t("newProject.dropFilesExtract")}
            </p>
            <input id="file-new" type="file" multiple accept=".pdf,.xlsx,.dwg,.docx" className="sr-only"
              onChange={(e) => {
                const f = Array.from(e.target.files ?? []);
                setFiles((prev) => [...prev, ...f]);
                if (!name && f[0]) setName(f[0].name.replace(/\.[^.]+$/, "").replace(/_/g, " "));
              }} />
          </label>
        </div>

        {/* Uploaded files */}
        {files.length > 0 && (
          <div className="space-y-2">
            {files.map((f, i) => (
              <div key={i} className="flex items-center gap-3 rounded-[12px] px-4 py-3" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
                <FileText className="h-4 w-4 shrink-0" strokeWidth={1.5} style={{ color: "var(--color-ai)" }} />
                <span className="flex-1 text-sm truncate" style={{ color: "var(--color-text-1)" }}>{f.name}</span>
                <span className="text-xs" style={{ color: "var(--color-text-3)" }}>{(f.size / 1048576).toFixed(1)} MB</span>
                <button onClick={() => setFiles(files.filter((_, j) => j !== i))} className="btn-ghost p-1">
                  <X className="h-3.5 w-3.5" strokeWidth={2} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Project name */}
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-text-2)" }}>
            {t("newProject.projectName")} <span style={{ color: "var(--color-danger)" }}>*</span>
          </label>
          <input
            type="text"
            placeholder={t("newProject.projectNamePh")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input text-base"
          />
          <p className="mt-1.5 text-xs" style={{ color: "var(--color-text-3)" }}>{t("newProject.projectNameHint")}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Client */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-text-2)" }}>{t("newProject.client")}</label>
            <input type="text" placeholder={t("newProject.clientPh")} value={client} onChange={(e) => setClient(e.target.value)} className="input" />
          </div>

          {/* Type */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-text-2)" }}>{t("newProject.type")}</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className="input bg-transparent">
              <option value="">{t("newProject.selectType")}</option>
              {PROJECT_TYPES.map((pt) => <option key={pt} value={pt}>{pt}</option>)}
            </select>
          </div>
        </div>

        {/* Country / Market */}
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-text-2)" }}>
            {t("newProject.country")}
          </label>
          <div className="grid grid-cols-2 gap-2">
            {COUNTRY_LIST.map((c) => {
              const active = country === c.code;
              return (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => setCountry(c.code)}
                  className="flex items-center gap-2.5 rounded-[12px] px-3.5 py-2.5 text-left transition-all"
                  style={active
                    ? { background: "var(--color-accent-muted)", border: "1px solid var(--color-accent-sub)" }
                    : { background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
                >
                  <span className="text-lg leading-none">{c.flag}</span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold" style={{ color: active ? "var(--color-accent)" : "var(--color-text-1)" }}>{c.name}</p>
                    <p className="text-[10px]" style={{ color: "var(--color-text-3)" }}>{c.currency}</p>
                  </div>
                </button>
              );
            })}
          </div>
          <p className="mt-1.5 text-xs" style={{ color: "var(--color-text-3)" }}>
            {t("newProject.countryHint")}
          </p>
        </div>

        {/* AI features banner */}
        <div className="rounded-[16px] px-5 py-4" style={{ background: "var(--color-ai-sub)", border: "1px solid oklch(70% 0.06 260 / 0.15)" }}>
          <div className="flex items-start gap-3">
            <Zap className="h-4 w-4 mt-0.5 shrink-0" strokeWidth={1.5} style={{ color: "var(--color-ai)" }} />
            <div>
              <p className="text-xs font-semibold mb-2" style={{ color: "var(--color-text-1)" }}>{t("newProject.aiBanner")}</p>
              <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs" style={{ color: "var(--color-text-2)" }}>
                {["Technical Proposal", "Company Profile", "Method Statement", "Scope of Work", "Execution Plan", "Financial Analysis", "Risk Report", "BOQ Extraction"].map((item) => (
                  <li key={item} className="flex items-center gap-1.5">
                    <span className="h-1 w-1 rounded-full shrink-0" style={{ background: "var(--color-ai)" }} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Create */}
        <button
          onClick={handleCreate}
          disabled={!name.trim() || creating}
          className="btn-primary w-full justify-center py-3 text-base disabled:opacity-40"
        >
          {creating ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              {t("newProject.creating")}
            </>
          ) : (
            <>
              <Zap className="h-4 w-4" strokeWidth={1.5} />
              {t("newProject.create")}
              <ArrowRight className={cn("h-4 w-4", dir === "rtl" && "rtl-flip")} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
