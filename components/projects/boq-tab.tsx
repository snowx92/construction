"use client";

import { useState, useRef } from "react";
import { useProjectStore } from "@/store";
import { useT } from "@/lib/i18n";
import { formatCurrency } from "@/lib/utils";
import {
  Zap, Upload, Download, Loader2, CheckCircle, Plus, Trash2,
  FileSpreadsheet, Sparkles, X, AlertCircle, Wand2, Globe,
} from "lucide-react";
import { COUNTRIES, type CountryCode } from "@/lib/countries";
import type { ProjectWorkspace, BOQItem } from "@/types";

const EXTRACT_STEPS_KEYS = [
  "boq.aiSteps.scan",
  "boq.aiSteps.detect",
  "boq.aiSteps.extract",
  "boq.aiSteps.classify",
  "boq.aiSteps.totals",
  "boq.aiSteps.done",
];

const PRICING_STEPS_KEYS = [
  "boq.priceSteps.match",
  "boq.priceSteps.fetch",
  "boq.priceSteps.apply",
  "boq.priceSteps.calc",
  "boq.priceSteps.done",
];

/**
 * Seed BOQ items extracted from a tender (NO prices — tender requests prices
 * from contractor). Prices will be filled by AI auto-pricing or user upload.
 */
const SEED_BOQ_UNPRICED: Omit<BOQItem, "id">[] = [
  { description: "Subbase course (Cl.A)",        unit: "m³",  quantity: 12400, unitPrice: 0, total: 0, category: "Civil" },
  { description: "Asphalt base course 60mm",     unit: "m²",  quantity: 28000, unitPrice: 0, total: 0, category: "Civil" },
  { description: "OPC Cement (50kg bag)",        unit: "bag", quantity: 4800,  unitPrice: 0, total: 0, category: "Materials" },
  { description: "Steel Rebar (Y12)",            unit: "ton", quantity: 90,    unitPrice: 0, total: 0, category: "Materials" },
  { description: "Street lighting pole (10m)",   unit: "No.", quantity: 180,   unitPrice: 0, total: 0, category: "Electrical" },
  { description: "Road marking (thermoplastic)", unit: "m²",  quantity: 3200,  unitPrice: 0, total: 0, category: "Civil" },
];

/* Market reference prices used by AI auto-pricing (AED, base rates). */
const MARKET_PRICES: Record<string, number> = {
  "Subbase course (Cl.A)":         85,
  "Asphalt base course 60mm":      42,
  "OPC Cement (50kg bag)":         18.5,
  "Steel Rebar (Y12)":             2850,
  "Steel Rebar (Y16)":             2780,
  "Street lighting pole (10m)":    4200,
  "Road marking (thermoplastic)":  28,
  "Crushed Stone 20mm":            95,
  "Washed Sand (Dune)":            65,
  "Ready Mix Concrete C25":        340,
  "Ready Mix Concrete C30":        375,
  "Structural Steel (H-Beam)":     3200,
  "HDPE Pipe 110mm":               62,
  "11kV XLPE Cable 3x240mm²":      285,
  "LV Cable 4x50mm²":              48,
};

function uid() { return Math.random().toString(36).slice(2, 10); }

function priceFor(description: string): number {
  const exact = MARKET_PRICES[description];
  if (exact !== undefined) return Math.round(exact * (0.92 + Math.random() * 0.16) * 100) / 100;
  const lower = description.toLowerCase();
  for (const [key, val] of Object.entries(MARKET_PRICES)) {
    if (lower.includes(key.toLowerCase().split(" ")[0])) {
      return Math.round(val * (0.92 + Math.random() * 0.16) * 100) / 100;
    }
  }
  return Math.round((300 + Math.random() * 900) * 100) / 100;
}

export function BoqTab({ ws }: { ws: ProjectWorkspace }) {
  const t = useT();
  const setBoqItems = useProjectStore((s) => s.setBoqItems);
  const fileRef       = useRef<HTMLInputElement>(null);
  const priceFileRef  = useRef<HTMLInputElement>(null);

  const [extracting, setExtracting]   = useState(false);
  const [extractStep, setExtractStep] = useState(0);
  const [pricing,    setPricing]      = useState(false);
  const [priceStep,  setPriceStep]    = useState(0);
  const [uploading,  setUploading]    = useState(false);
  const [fileName,   setFileName]     = useState<string | null>(null);
  const [priceFileName, setPriceFileName] = useState<string | null>(null);
  const [showManual, setShowManual]   = useState(false);
  const [country,    setCountry]      = useState<CountryCode>(ws.country ?? "eg");
  const [draft,      setDraft]        = useState<Omit<BOQItem, "id" | "total">>({
    description: "", unit: "", quantity: 0, unitPrice: 0, category: "Civil",
  });

  const items       = ws.analysis?.boqItems ?? [];
  const totalValue  = items.reduce((s, it) => s + it.total, 0);
  const hasItems    = items.length > 0;
  const unpricedCount = items.filter((it) => it.unitPrice === 0).length;
  const needsPricing  = unpricedCount > 0;
  const fullyPriced   = hasItems && unpricedCount === 0;

  /* ─── Step 1: Extract BOQ structure (no prices) ──────────────── */
  async function handleAiExtract() {
    setExtracting(true);
    setExtractStep(0);
    for (let i = 0; i < EXTRACT_STEPS_KEYS.length; i++) {
      await new Promise((r) => setTimeout(r, 600));
      setExtractStep(i + 1);
    }
    const extracted = SEED_BOQ_UNPRICED.map((b) => ({ ...b, id: "b-" + uid() }));
    setBoqItems(ws.id, extracted);
    setExtracting(false);
  }

  async function handleBoqFile(file: File) {
    if (!file) return;
    setFileName(file.name);
    setUploading(true);
    await new Promise((r) => setTimeout(r, 1200));
    const parsed = SEED_BOQ_UNPRICED.map((b) => ({ ...b, id: "b-" + uid() }));
    setBoqItems(ws.id, parsed);
    setUploading(false);
  }

  /* ─── Step 2: Complete pricing ───────────────────────────────── */
  async function handleAiPricing() {
    setPricing(true);
    setPriceStep(0);
    for (let i = 0; i < PRICING_STEPS_KEYS.length; i++) {
      await new Promise((r) => setTimeout(r, 600));
      setPriceStep(i + 1);
    }
    const priced = items.map((it) => {
      const unitPrice = it.unitPrice > 0 ? it.unitPrice : priceFor(it.description);
      return { ...it, unitPrice, total: Math.round(unitPrice * it.quantity * 100) / 100 };
    });
    setBoqItems(ws.id, priced);
    setPricing(false);
  }

  async function handlePriceUpload(file: File) {
    if (!file) return;
    setPriceFileName(file.name);
    setPricing(true);
    await new Promise((r) => setTimeout(r, 1400));
    // Simulate matching uploaded prices against BOQ items
    const priced = items.map((it) => {
      const unitPrice = priceFor(it.description); // use market price as user-rate substitute
      return { ...it, unitPrice, total: Math.round(unitPrice * it.quantity * 100) / 100 };
    });
    setBoqItems(ws.id, priced);
    setPricing(false);
  }

  function downloadBoqTemplate() {
    const rows = [
      ["Description", "Unit", "Quantity", "Unit Price (AED)", "Category"],
      ["Example: Subbase course (Cl.A)", "m³", "12400", "85", "Civil"],
      ["Example: Steel Rebar (Y12)",     "ton", "90",   "2850", "Materials"],
    ];
    triggerDownload(rows, `boq-template-${ws.name.replace(/\s+/g, "-").toLowerCase()}.csv`);
  }

  /** Pricing template pre-filled with current BOQ descriptions so user only
   *  needs to fill the "Unit Price" column then upload back. */
  function downloadPriceTemplate() {
    const rows: string[][] = [["Description", "Unit", "Quantity", "Unit Price (AED)", "Notes"]];
    items.forEach((it) => rows.push([it.description, it.unit, String(it.quantity), "", ""]));
    triggerDownload(rows, `pricing-for-${ws.name.replace(/\s+/g, "-").toLowerCase()}.csv`);
  }

  function triggerDownload(rows: string[][], name: string) {
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = name; a.click();
    URL.revokeObjectURL(url);
  }

  function addManualItem() {
    if (!draft.description.trim() || !draft.unit.trim() || draft.quantity <= 0) return;
    const total = draft.quantity * draft.unitPrice;
    const newItem: BOQItem = { id: "b-" + uid(), ...draft, total };
    setBoqItems(ws.id, [...items, newItem]);
    setDraft({ description: "", unit: "", quantity: 0, unitPrice: 0, category: "Civil" });
    setShowManual(false);
  }

  function removeItem(id: string) {
    setBoqItems(ws.id, items.filter((b) => b.id !== id));
  }

  function clearAll() {
    setBoqItems(ws.id, []);
  }

  /* ═══════════════ EMPTY STATE — Step 1 ═══════════════ */
  if (!hasItems) {
    return (
      <div className="max-w-[1000px]">
        {/* Workflow indicator */}
        <div className="mb-6 flex items-center gap-3 text-xs" style={{ color: "rgb(var(--foreground-subtle))" }}>
          <span className="flex items-center gap-2 font-medium" style={{ color: "rgb(var(--primary))" }}>
            <span className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ background: "rgb(var(--primary))" }}>1</span>
            {t("boq.step1")}
          </span>
          <span className="h-px flex-1" style={{ background: "rgb(var(--border) / 0.06)" }} />
          <span className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold" style={{ background: "rgb(var(--surface-2))", border: "1px solid rgb(var(--border) / 0.06)", color: "rgb(var(--foreground-subtle))" }}>2</span>
            {t("boq.step2")}
          </span>
        </div>

        <div className="mb-6">
          <h2 className="text-base font-semibold mb-1" style={{ color: "rgb(var(--foreground))" }}>{t("boq.step1Title")}</h2>
          <p className="text-sm" style={{ color: "rgb(var(--foreground-muted))" }}>{t("boq.step1Sub")}</p>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {/* AI extract from uploaded tender files */}
          <div className="card p-6 flex flex-col gap-5"
            style={extracting ? { border: "1px solid rgb(var(--primary))", background: "rgb(var(--primary-soft))" } : {}}>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px]" style={{ background: "rgb(var(--primary-soft))", border: "1px solid rgb(var(--primary))" }}>
                <Sparkles className="h-5 w-5" strokeWidth={1.5} style={{ color: "rgb(var(--primary))" }} />
              </div>
              <div>
                <p className="text-sm font-semibold mb-0.5" style={{ color: "rgb(var(--foreground))" }}>{t("boq.aiExtract.title")}</p>
                <p className="text-xs leading-relaxed" style={{ color: "rgb(var(--foreground-muted))" }}>{t("boq.aiExtract.sub")}</p>
              </div>
            </div>
            {extracting && (
              <div className="space-y-1.5">
                {EXTRACT_STEPS_KEYS.map((k, i) => (
                  <div key={k} className={`flex items-center gap-2 text-xs transition-opacity ${i < extractStep ? "opacity-100" : "opacity-30"}`}>
                    {i < extractStep
                      ? <CheckCircle className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} style={{ color: "rgb(var(--primary))" }} />
                      : i === extractStep
                      ? <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" style={{ color: "rgb(var(--primary))" }} />
                      : <div className="h-3.5 w-3.5 shrink-0 rounded-full" style={{ border: "1.5px solid rgb(var(--border) / 0.06)" }} />}
                    <span style={{ color: i < extractStep ? "rgb(var(--foreground-muted))" : "rgb(var(--foreground-subtle))" }}>{t(k)}</span>
                  </div>
                ))}
              </div>
            )}
            <button onClick={handleAiExtract} disabled={extracting} className="btn-primary justify-center mt-auto disabled:opacity-60">
              {extracting
                ? <><Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.5} />{t("boq.aiExtract.extracting")}</>
                : <><Zap className="h-4 w-4" strokeWidth={1.5} />{t("boq.aiExtract.cta")}</>}
            </button>
          </div>

          {/* Upload BOQ sheet (from tender) */}
          <div className="card p-6 flex flex-col gap-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px]" style={{ background: "rgb(var(--primary-soft))", border: "1px solid rgb(var(--primary-soft))" }}>
                <Upload className="h-5 w-5" strokeWidth={1.5} style={{ color: "rgb(var(--primary))" }} />
              </div>
              <div>
                <p className="text-sm font-semibold mb-0.5" style={{ color: "rgb(var(--foreground))" }}>{t("boq.upload.title")}</p>
                <p className="text-xs leading-relaxed" style={{ color: "rgb(var(--foreground-muted))" }}>{t("boq.upload.sub")}</p>
              </div>
            </div>
            <div className="rounded-[12px] p-3.5 flex items-center justify-between gap-3" style={{ background: "rgb(var(--surface-2))", border: "1px solid rgb(var(--border) / 0.06)" }}>
              <div className="flex items-center gap-2 min-w-0">
                <FileSpreadsheet className="h-4 w-4 shrink-0" strokeWidth={1.5} style={{ color: "rgb(var(--foreground-subtle))" }} />
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate" style={{ color: "rgb(var(--foreground))" }}>{t("boq.upload.template")}</p>
                  <p className="text-[10px]" style={{ color: "rgb(var(--foreground-subtle))" }}>{t("boq.upload.templateSub")}</p>
                </div>
              </div>
              <button onClick={downloadBoqTemplate} className="btn-secondary text-xs py-1.5 px-3 gap-1.5 shrink-0">
                <Download className="h-3.5 w-3.5" strokeWidth={1.5} />{t("project.pricing.downloadTemplate")}
              </button>
            </div>
            <div
              className="rounded-[12px] border-2 border-dashed p-5 text-center cursor-pointer transition-colors hover:border-primary mt-auto"
              style={{ borderColor: "rgb(var(--border) / 0.06)" }}
              onClick={() => fileRef.current?.click()}
            >
              {uploading ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" style={{ color: "rgb(var(--primary))" }} />
                  <p className="text-xs" style={{ color: "rgb(var(--foreground-muted))" }}>{t("project.pricing.parsing")} {fileName}…</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1.5">
                  <Upload className="h-5 w-5" strokeWidth={1.5} style={{ color: "rgb(var(--foreground-subtle))" }} />
                  <p className="text-xs font-medium" style={{ color: "rgb(var(--foreground-muted))" }}>{t("boq.upload.drop")}</p>
                  <p className="text-[10px]" style={{ color: "rgb(var(--foreground-subtle))" }}>{t("boq.upload.formats")}</p>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept=".csv,.xlsx,.pdf" className="sr-only"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleBoqFile(f); }} />
          </div>

          {/* Manual */}
          <div className="card p-6 flex flex-col gap-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px]" style={{ background: "rgb(var(--success-soft))", border: "1px solid rgb(var(--success))" }}>
                <Plus className="h-5 w-5" strokeWidth={1.5} style={{ color: "rgb(var(--success))" }} />
              </div>
              <div>
                <p className="text-sm font-semibold mb-0.5" style={{ color: "rgb(var(--foreground))" }}>{t("boq.manual.title")}</p>
                <p className="text-xs leading-relaxed" style={{ color: "rgb(var(--foreground-muted))" }}>{t("boq.manual.sub")}</p>
              </div>
            </div>
            <button onClick={() => setShowManual(true)} className="btn-secondary justify-center mt-auto">
              <Plus className="h-4 w-4" strokeWidth={1.5} />{t("boq.manual.cta")}
            </button>
          </div>
        </div>

        {showManual && <ManualEntryModal t={t} draft={draft} setDraft={setDraft} onClose={() => setShowManual(false)} onSubmit={addManualItem} />}
      </div>
    );
  }

  /* ═══════════════ STATE — BOQ exists ═══════════════ */
  return (
    <div className="space-y-5">
      {/* Workflow indicator */}
      <div className="flex items-center gap-3 text-xs" style={{ color: "rgb(var(--foreground-subtle))" }}>
        <span className="flex items-center gap-2 font-medium" style={{ color: "rgb(var(--success))" }}>
          <span className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ background: "rgb(var(--success))" }}>
            <CheckCircle className="h-3 w-3" strokeWidth={3} />
          </span>
          {t("boq.step1")}
        </span>
        <span className="h-px flex-1" style={{ background: needsPricing ? "rgb(var(--border) / 0.06)" : "rgb(var(--success))" }} />
        <span className="flex items-center gap-2 font-medium"
          style={{ color: fullyPriced ? "rgb(var(--success))" : needsPricing ? "rgb(var(--primary))" : "rgb(var(--foreground-subtle))" }}>
          <span className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold"
            style={fullyPriced
              ? { background: "rgb(var(--success))", color: "white" }
              : needsPricing
              ? { background: "rgb(var(--primary))", color: "white" }
              : { background: "rgb(var(--surface-2))", border: "1px solid rgb(var(--border) / 0.06)" }}>
            {fullyPriced ? <CheckCircle className="h-3 w-3" strokeWidth={3} /> : "2"}
          </span>
          {t("boq.step2")}
        </span>
      </div>

      {/* Status bar */}
      <div className="card p-5 flex items-center justify-between gap-4"
        style={{
          background: needsPricing ? "rgb(var(--warning-soft))" : "rgb(var(--success-soft))",
          border: "1px solid rgb(var(--border) / 0.05)",
        }}>
        <div className="flex items-center gap-3">
          {needsPricing
            ? <AlertCircle className="h-5 w-5 shrink-0" strokeWidth={1.5} style={{ color: "rgb(var(--warning))" }} />
            : <CheckCircle className="h-5 w-5 shrink-0" strokeWidth={1.5} style={{ color: "rgb(var(--success))" }} />}
          <div>
            <p className="text-sm font-semibold" style={{ color: "rgb(var(--foreground))" }}>
              {items.length} {t("boq.itemsCount")}
              {needsPricing
                ? <> · <span style={{ color: "rgb(var(--warning))" }}>{unpricedCount} {t("boq.unpriced")}</span></>
                : <> · {formatCurrency(totalValue, "AED")}</>}
            </p>
            <p className="text-xs" style={{ color: "rgb(var(--foreground-subtle))" }}>
              {needsPricing ? t("boq.needsPricingSub") : t("boq.totalEstimate")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => setShowManual(true)} className="btn-secondary text-xs py-1.5 px-3 gap-1.5">
            <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />{t("common.add")}
          </button>
          <button onClick={clearAll} className="btn-ghost text-xs py-1.5 px-3 gap-1.5" style={{ color: "rgb(var(--danger))" }}>
            <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />{t("common.delete")}
          </button>
        </div>
      </div>

      {/* ─── STEP 2 — Pricing completion (only shown if needed) ─── */}
      {needsPricing && (
        <div className="card p-6" style={{ background: "rgb(var(--primary-soft))", border: "1px solid rgb(var(--primary-soft))" }}>
          <div className="flex items-start gap-3 mb-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px]" style={{ background: "rgb(var(--primary))", color: "white" }}>
              <Wand2 className="h-5 w-5" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-sm font-semibold mb-0.5" style={{ color: "rgb(var(--foreground))" }}>{t("boq.completePricing.title")}</p>
              <p className="text-xs leading-relaxed" style={{ color: "rgb(var(--foreground-muted))" }}>{t("boq.completePricing.sub")}</p>
            </div>
          </div>

          {pricing && (
            <div className="space-y-1.5 mb-5 rounded-[12px] p-4" style={{ background: "rgb(var(--surface))", border: "1px solid rgb(var(--border) / 0.05)" }}>
              {PRICING_STEPS_KEYS.map((k, i) => (
                <div key={k} className={`flex items-center gap-2 text-xs transition-opacity ${i < priceStep ? "opacity-100" : "opacity-30"}`}>
                  {i < priceStep
                    ? <CheckCircle className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} style={{ color: "rgb(var(--primary))" }} />
                    : i === priceStep
                    ? <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" style={{ color: "rgb(var(--primary))" }} />
                    : <div className="h-3.5 w-3.5 shrink-0 rounded-full" style={{ border: "1.5px solid rgb(var(--border) / 0.06)" }} />}
                  <span style={{ color: i < priceStep ? "rgb(var(--foreground-muted))" : "rgb(var(--foreground-subtle))" }}>{t(k)}</span>
                </div>
              ))}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            {/* AI auto-price */}
            <div className="rounded-[14px] p-5 flex flex-col gap-4" style={{ background: "rgb(var(--surface))", border: "1px solid rgb(var(--border) / 0.06)" }}>
              <div className="flex items-start gap-3">
                <Globe className="h-5 w-5 shrink-0 mt-0.5" strokeWidth={1.5} style={{ color: "rgb(var(--primary))" }} />
                <div>
                  <p className="text-sm font-semibold mb-0.5" style={{ color: "rgb(var(--foreground))" }}>{t("boq.aiPrice.title")}</p>
                  <p className="text-xs leading-relaxed" style={{ color: "rgb(var(--foreground-muted))" }}>{t("boq.aiPrice.sub")}</p>
                </div>
              </div>
              <div className="flex items-center justify-between gap-2 text-xs">
                <span style={{ color: "rgb(var(--foreground-subtle))" }}>{t("project.pricing.market")}</span>
                <select className="input text-xs py-1 px-2" value={country} onChange={(e) => setCountry(e.target.value as CountryCode)}>
                  {(["eg", "om"] as CountryCode[]).map((c) => (
                    <option key={c} value={c}>{COUNTRIES[c].flag} {COUNTRIES[c].name} ({COUNTRIES[c].currency})</option>
                  ))}
                </select>
              </div>
              <button onClick={handleAiPricing} disabled={pricing} className="btn-primary justify-center disabled:opacity-60 mt-auto">
                {pricing
                  ? <><Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.5} />{t("boq.aiPrice.pricing")}</>
                  : <><Zap className="h-4 w-4" strokeWidth={1.5} />{t("boq.aiPrice.cta")}</>}
              </button>
            </div>

            {/* Upload pricing template */}
            <div className="rounded-[14px] p-5 flex flex-col gap-4" style={{ background: "rgb(var(--surface))", border: "1px solid rgb(var(--border) / 0.06)" }}>
              <div className="flex items-start gap-3">
                <FileSpreadsheet className="h-5 w-5 shrink-0 mt-0.5" strokeWidth={1.5} style={{ color: "rgb(var(--primary))" }} />
                <div>
                  <p className="text-sm font-semibold mb-0.5" style={{ color: "rgb(var(--foreground))" }}>{t("boq.uploadPrice.title")}</p>
                  <p className="text-xs leading-relaxed" style={{ color: "rgb(var(--foreground-muted))" }}>{t("boq.uploadPrice.sub")}</p>
                </div>
              </div>
              <button onClick={downloadPriceTemplate} className="btn-secondary text-xs py-1.5 px-3 gap-1.5 self-start">
                <Download className="h-3.5 w-3.5" strokeWidth={1.5} />
                {t("boq.uploadPrice.download")}
              </button>
              <button
                onClick={() => priceFileRef.current?.click()}
                disabled={pricing}
                className="btn-primary justify-center disabled:opacity-60 mt-auto"
                style={{ background: "rgb(var(--primary))" }}
              >
                {pricing && priceFileName
                  ? <><Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.5} />{t("boq.uploadPrice.matching")} {priceFileName}…</>
                  : <><Upload className="h-4 w-4" strokeWidth={1.5} />{t("boq.uploadPrice.cta")}</>}
              </button>
              <input ref={priceFileRef} type="file" accept=".csv,.xlsx" className="sr-only"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePriceUpload(f); }} />
            </div>
          </div>
        </div>
      )}

      {/* BOQ table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: "1px solid rgb(var(--border) / 0.05)" }}>
                {[t("project.pricing.description"), t("common.unit"), t("common.qty"), t("common.rate"), t("common.total"), t("project.financial.category"), ""].map((h, i) => (
                  <th key={i} className="px-5 py-3 text-left font-medium" style={{ color: "rgb(var(--foreground-subtle))" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.05]">
              {items.map((it) => {
                const unpriced = it.unitPrice === 0;
                return (
                  <tr key={it.id} className={`transition-colors ${unpriced ? "" : "hover:bg-black/[0.025]"}`}
                    style={unpriced ? { background: "rgb(var(--warning-soft))" } : undefined}>
                    <td className="px-5 py-3" style={{ color: "rgb(var(--foreground))" }}>{it.description}</td>
                    <td className="px-5 py-3 font-mono" style={{ color: "rgb(var(--foreground-muted))" }}>{it.unit}</td>
                    <td className="px-5 py-3 font-mono" style={{ color: "rgb(var(--foreground-muted))" }}>{it.quantity.toLocaleString()}</td>
                    <td className="px-5 py-3 font-mono" style={{ color: unpriced ? "rgb(var(--warning))" : "rgb(var(--foreground-muted))" }}>
                      {unpriced ? <span className="italic">{t("boq.tbd")}</span> : it.unitPrice.toLocaleString()}
                    </td>
                    <td className="px-5 py-3 font-mono font-semibold" style={{ color: unpriced ? "rgb(var(--foreground-subtle))" : "rgb(var(--foreground))" }}>
                      {unpriced ? "—" : formatCurrency(it.total, "AED")}
                    </td>
                    <td className="px-5 py-3">
                      <span className="badge badge-neutral text-[10px]">{it.category}</span>
                    </td>
                    <td className="px-5 py-3">
                      <button onClick={() => removeItem(it.id)} className="btn-ghost p-1" style={{ color: "rgb(var(--foreground-subtle))" }} title={t("common.delete")}>
                        <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: "2px solid rgb(var(--border) / 0.06)" }}>
                <td colSpan={4} className="px-5 py-3 font-semibold" style={{ color: "rgb(var(--foreground-muted))" }}>{t("common.total")}</td>
                <td className="px-5 py-3 font-mono font-bold" style={{ color: "rgb(var(--primary))" }}>
                  {fullyPriced ? formatCurrency(totalValue, "AED") : <span style={{ color: "rgb(var(--warning))" }}>{t("boq.pending")}</span>}
                </td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {showManual && <ManualEntryModal t={t} draft={draft} setDraft={setDraft} onClose={() => setShowManual(false)} onSubmit={addManualItem} />}
    </div>
  );
}

/* ── Manual entry modal ────────────────────────────────────────────── */
function ManualEntryModal({
  t, draft, setDraft, onClose, onSubmit,
}: {
  t: (k: string, v?: Record<string, string | number>) => string;
  draft: Omit<BOQItem, "id" | "total">;
  setDraft: (d: Omit<BOQItem, "id" | "total">) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.4)" }} onClick={onClose}>
      <div className="rounded-[20px] p-6 w-full max-w-md" style={{ background: "rgb(var(--surface))", border: "1px solid rgb(var(--border) / 0.06)" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm font-semibold" style={{ color: "rgb(var(--foreground))" }}>{t("boq.manual.modalTitle")}</p>
          <button onClick={onClose} className="btn-ghost p-1"><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: "rgb(var(--foreground-muted))" }}>{t("project.pricing.description")}</label>
            <input className="input w-full" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: "rgb(var(--foreground-muted))" }}>{t("common.unit")}</label>
              <input className="input w-full" placeholder="m³ / ton / m²" value={draft.unit} onChange={(e) => setDraft({ ...draft, unit: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: "rgb(var(--foreground-muted))" }}>{t("project.financial.category")}</label>
              <select className="input w-full" value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })}>
                {["Civil", "Materials", "Electrical", "MEP", "Finishing", "Structures"].map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: "rgb(var(--foreground-muted))" }}>{t("common.qty")}</label>
              <input type="number" className="input w-full" value={draft.quantity || ""} onChange={(e) => setDraft({ ...draft, quantity: parseFloat(e.target.value) || 0 })} />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: "rgb(var(--foreground-muted))" }}>{t("common.rate")} (AED) — {t("boq.optional")}</label>
              <input type="number" className="input w-full" value={draft.unitPrice || ""} onChange={(e) => setDraft({ ...draft, unitPrice: parseFloat(e.target.value) || 0 })} />
            </div>
          </div>
          {draft.quantity > 0 && draft.unitPrice > 0 && (
            <div className="flex items-center justify-between rounded-[10px] p-3" style={{ background: "rgb(var(--primary-soft))", border: "1px solid rgb(var(--primary-soft))" }}>
              <span className="text-xs font-medium" style={{ color: "rgb(var(--foreground-muted))" }}>{t("common.total")}</span>
              <span className="text-sm font-bold font-mono" style={{ color: "rgb(var(--primary))" }}>{formatCurrency(draft.quantity * draft.unitPrice, "AED")}</span>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-3 mt-5">
          <button onClick={onClose} className="btn-secondary">{t("common.cancel")}</button>
          <button onClick={onSubmit} className="btn-primary">{t("boq.manual.add")}</button>
        </div>
      </div>
    </div>
  );
}
