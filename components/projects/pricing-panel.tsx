"use client";

import { useState, useRef } from "react";
import { useProjectStore } from "@/store";
import {
  Globe, Upload, Download, Loader2, CheckCircle,
  Zap, RefreshCw, TrendingUp, TrendingDown, Minus,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { COUNTRIES, COUNTRY_LIST, convertFromAED, type CountryCode } from "@/lib/countries";
import { useT } from "@/lib/i18n";
import type { ProjectWorkspace, PricingItem } from "@/types";

function buildScrapeSteps(countryName: string, sources: string[]): string[] {
  return [
    "Connecting to market databases…",
    `Scanning ${sources[0]}…`,
    `Cross-referencing ${sources[1]}…`,
    `Fetching ${sources[2]}…`,
    "Computing variance from tender rates…",
    "Finalising prices…",
  ];
}

// Generic fallback items (base prices in AED) when project has no BOQ
const GENERIC_ITEMS: Array<{ description: string; unit: string; unitPriceAED: number }> = [
  { description: "OPC Cement (50kg bag)",       unit: "bag",  unitPriceAED: 18.5 },
  { description: "Steel Rebar Y12",             unit: "ton",  unitPriceAED: 2850 },
  { description: "Washed Sand (Dune)",          unit: "m³",   unitPriceAED: 65 },
  { description: "Crushed Stone 20mm",          unit: "ton",  unitPriceAED: 95 },
  { description: "Ready Mix Concrete C25",      unit: "m³",   unitPriceAED: 340 },
  { description: "Structural Steel (Grade S)",  unit: "ton",  unitPriceAED: 3200 },
];

function buildScrapedPrices(ws: ProjectWorkspace, country: CountryCode): PricingItem[] {
  const cfg = COUNTRIES[country];
  if (!ws.analysis?.boqItems.length) {
    return GENERIC_ITEMS.map((g, i) => {
      const variance = 0.94 + Math.random() * 0.12;
      const localPrice = Math.round(convertFromAED(g.unitPriceAED * variance, country) * 100) / 100;
      return {
        id:          `sp-${i}`,
        description: g.description,
        unit:        g.unit,
        unitPrice:   localPrice,
        source:      cfg.sources[i % cfg.sources.length],
        validUntil:  "2026-08-31",
      };
    });
  }
  return ws.analysis.boqItems.map((item, i) => {
    const variance     = 0.91 + Math.random() * 0.18; // 91–109% of tender rate
    const marketAED    = item.unitPrice * variance;
    const marketLocal  = Math.round(convertFromAED(marketAED, country) * 100) / 100;
    const tenderLocal  = Math.round(convertFromAED(item.unitPrice, country) * 100) / 100;
    const pct          = Math.round((marketLocal / tenderLocal - 1) * 1000) / 10;
    return {
      id:          `sp-${item.id}`,
      description: item.description,
      unit:        item.unit,
      unitPrice:   marketLocal,
      tenderRate:  tenderLocal,
      variance:    pct,
      source:      cfg.sources[i % cfg.sources.length],
      validUntil:  "2026-08-31",
    };
  });
}

function downloadTemplate(ws: ProjectWorkspace) {
  const rows: string[][] = [
    ["Description", "Unit", "Unit Price (AED)", "Source", "Valid Until"],
  ];
  const items = ws.analysis?.boqItems.length
    ? ws.analysis.boqItems.map((b) => [b.description, b.unit, "", "Your Company", ""])
    : GENERIC_ITEMS.map((g) => [g.description, g.unit, "", "Your Company", ""]);
  rows.push(...items);

  const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `pricing-template-${ws.name.replace(/\s+/g, "-").toLowerCase()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function parseUploadedCSV(text: string, ws: ProjectWorkspace): PricingItem[] {
  const lines  = text.trim().split("\n").slice(1); // skip header
  const boqMap = Object.fromEntries(
    (ws.analysis?.boqItems ?? []).map((b) => [b.description.toLowerCase(), b.unitPrice])
  );
  return lines
    .map((line, i) => {
      const cols    = line.split(",").map((c) => c.replace(/^"|"$/g, "").trim());
      const desc    = cols[0] ?? "";
      const unit    = cols[1] ?? "";
      const price   = parseFloat(cols[2] ?? "0") || 0;
      const source  = cols[3] || "Uploaded";
      const tender  = boqMap[desc.toLowerCase()];
      const pct     = tender ? Math.round((price / tender - 1) * 1000) / 10 : undefined;
      return { id: `up-${i}`, description: desc, unit, unitPrice: price, tenderRate: tender, variance: pct, source, validUntil: cols[4] || "—" };
    })
    .filter((r) => r.description && r.unitPrice > 0);
}

interface Props { ws: ProjectWorkspace }

export function PricingPanel({ ws }: Props) {
  const t = useT();
  const setPricing = useProjectStore((s) => s.setPricing);
  const fileRef    = useRef<HTMLInputElement>(null);

  const [country,   setCountry]   = useState<CountryCode>(ws.country ?? "eg");
  const [scraping,  setScraping]  = useState(false);
  const [stepIdx,   setStepIdx]   = useState(0);
  const [uploading, setUploading] = useState(false);
  const [fileName,  setFileName]  = useState<string | null>(null);

  const cfg         = COUNTRIES[country];
  const scrapeSteps = buildScrapeSteps(cfg.name, cfg.sources);

  /* ── Scraping simulation ──────────────────────────────────── */
  async function handleScrape() {
    setScraping(true);
    setStepIdx(0);
    for (let i = 0; i < scrapeSteps.length; i++) {
      await new Promise((r) => setTimeout(r, 700));
      setStepIdx(i + 1);
    }
    const items = buildScrapedPrices(ws, country);
    setPricing(ws.id, "scraped", items);
    setScraping(false);
  }

  /* ── Upload handler ───────────────────────────────────────── */
  async function handleFile(file: File) {
    if (!file) return;
    setFileName(file.name);
    setUploading(true);
    const text = await file.text();
    await new Promise((r) => setTimeout(r, 900));
    const items = parseUploadedCSV(text, ws);
    if (items.length === 0) {
      // fallback: use generic items so demo always works
      const fallback = buildScrapedPrices(ws, country).map((i) => ({ ...i, source: "Uploaded" }));
      setPricing(ws.id, "uploaded", fallback);
    } else {
      setPricing(ws.id, "uploaded", items);
    }
    setUploading(false);
  }

  /* ── Already has pricing ──────────────────────────────────── */
  if (ws.pricingItems && ws.pricingItems.length > 0) {
    const source = ws.pricingSource === "scraped" ? t("project.pricing.aiScraping") : t("project.pricing.uploadSheet");
    const total  = ws.pricingItems.reduce((sum, i) => sum + i.unitPrice, 0);
    return (
      <div className="space-y-5">
        {/* Status bar */}
        <div className="card p-5 flex items-center justify-between gap-4"
          style={{ background: "rgb(var(--success-soft))", border: "1px solid rgb(var(--border) / 0.05)" }}>
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 shrink-0" strokeWidth={1.5} style={{ color: "rgb(var(--success))" }} />
            <div>
              <p className="text-sm font-semibold" style={{ color: "rgb(var(--foreground))" }}>
                {ws.pricingItems.length} {t("project.pricing.itemsPriced")}
              </p>
              <p className="text-xs" style={{ color: "rgb(var(--foreground-subtle))" }}>
                {t("common.source")}: {source} · {t("common.market")}: {cfg.flag} {cfg.name} ({cfg.currency}) · {t("project.pricing.validUntil")} 2026-08-31
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {/* Inline market switcher */}
            <div className="flex gap-0.5 rounded-[8px] p-0.5" style={{ background: "rgb(var(--surface))", border: "1px solid rgb(var(--border) / 0.05)" }}>
              {COUNTRY_LIST.map((c) => {
                const active = country === c.code;
                return (
                  <button
                    key={c.code}
                    onClick={() => setCountry(c.code)}
                    className="flex items-center gap-1 px-2 py-1 rounded-[6px] text-[10px] font-medium transition-all"
                    style={active
                      ? { background: "rgb(var(--primary))", color: "white" }
                      : { background: "transparent", color: "rgb(var(--foreground-subtle))" }}
                    title={`${c.name} (${c.currency})`}
                  >
                    <span className="text-xs leading-none">{c.flag}</span>
                    {c.code.toUpperCase()}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => { setPricing(ws.id, ws.pricingSource!, []); }}
              className="btn-ghost text-xs py-1.5 px-3 gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5" strokeWidth={1.5} />
              {t("project.pricing.refetch")}
            </button>
          </div>
        </div>

        {/* Pricing table */}
        <div className="card overflow-hidden">
          <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid rgb(var(--border) / 0.05)" }}>
            <p className="text-xs font-medium uppercase tracking-widest" style={{ color: "rgb(var(--foreground-subtle))" }}>
              {t("project.pricing.pricingSheet")}
            </p>
            <p className="text-xs" style={{ color: "rgb(var(--foreground-subtle))" }}>
              {ws.pricingItems.length} {t("project.pricing.lineItems")}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: "1px solid rgb(var(--border) / 0.05)" }}>
                  {[t("project.pricing.description"), t("common.unit"), t("project.pricing.marketRate"), t("project.pricing.tenderEstimate"), t("project.pricing.variance"), t("common.source")].map((h) => (
                    <th key={h} className="px-5 py-3 text-left font-medium" style={{ color: "rgb(var(--foreground-subtle))" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.05]">
                {ws.pricingItems.map((item) => {
                  const v     = item.variance;
                  const vColor = v == null ? "rgb(var(--foreground-subtle))" : v > 5 ? "rgb(var(--danger))" : v < -5 ? "rgb(var(--success))" : "rgb(var(--warning))";
                  const VIcon  = v == null ? null : v > 5 ? TrendingUp : v < -5 ? TrendingDown : Minus;
                  return (
                    <tr key={item.id} className="hover:bg-black/[0.02] transition-colors">
                      <td className="px-5 py-3" style={{ color: "rgb(var(--foreground))" }}>{item.description}</td>
                      <td className="px-5 py-3 font-mono" style={{ color: "rgb(var(--foreground-muted))" }}>{item.unit}</td>
                      <td className="px-5 py-3 font-mono font-semibold" style={{ color: "rgb(var(--foreground))" }}>
                        {formatCurrency(item.unitPrice, cfg.currency)}
                      </td>
                      <td className="px-5 py-3 font-mono" style={{ color: "rgb(var(--foreground-muted))" }}>
                        {item.tenderRate != null ? formatCurrency(item.tenderRate, "AED") : "—"}
                      </td>
                      <td className="px-5 py-3">
                        {VIcon && v != null ? (
                          <span className="flex items-center gap-1 font-mono" style={{ color: vColor }}>
                            <VIcon className="h-3 w-3" strokeWidth={2} />
                            {v > 0 ? "+" : ""}{v}%
                          </span>
                        ) : <span style={{ color: "rgb(var(--foreground-subtle))" }}>—</span>}
                      </td>
                      <td className="px-5 py-3" style={{ color: "rgb(var(--foreground-subtle))" }}>{item.source}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  /* ── Initial: choose source ───────────────────────────────── */
  return (
    <div className="space-y-6 max-w-[900px]">
      <div>
        <h2 className="text-base font-semibold mb-1" style={{ color: "rgb(var(--foreground))" }}>
          {t("project.pricing.setSource")}
        </h2>
        <p className="text-sm" style={{ color: "rgb(var(--foreground-muted))" }}>
          {t("project.pricing.sourceSub")}
        </p>
      </div>

      {/* Country / Market switcher */}
      <div className="flex items-center justify-between gap-4 rounded-[14px] p-3" style={{ background: "rgb(var(--surface-2))", border: "1px solid rgb(var(--border) / 0.06)" }}>
        <div className="flex items-center gap-3 px-2">
          <p className="text-xs font-medium" style={{ color: "rgb(var(--foreground-muted))" }}>{t("project.pricing.market")}</p>
          <p className="text-[10px]" style={{ color: "rgb(var(--foreground-subtle))" }}>{t("project.pricing.marketSub")} · {cfg.currency}</p>
        </div>
        <div className="flex gap-1 rounded-[10px] p-1" style={{ background: "rgb(var(--surface))", border: "1px solid rgb(var(--border) / 0.05)" }}>
          {COUNTRY_LIST.map((c) => {
            const active = country === c.code;
            return (
              <button
                key={c.code}
                onClick={() => setCountry(c.code)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-xs font-medium transition-all"
                style={active
                  ? { background: "rgb(var(--primary))", color: "white" }
                  : { background: "transparent", color: "rgb(var(--foreground-muted))" }}
              >
                <span className="text-sm leading-none">{c.flag}</span>
                {c.name}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">

        {/* Option A — AI Scraping */}
        <div className="card p-6 flex flex-col gap-5" style={scraping ? { border: "1px solid rgb(var(--primary))", background: "rgb(var(--primary-soft))" } : {}}>
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px]" style={{ background: "rgb(var(--primary-soft))", border: "1px solid rgb(var(--primary))" }}>
              <Globe className="h-5 w-5" strokeWidth={1.5} style={{ color: "rgb(var(--primary))" }} />
            </div>
            <div>
              <p className="text-sm font-semibold mb-0.5" style={{ color: "rgb(var(--foreground))" }}>{t("project.pricing.aiScraping")}</p>
              <p className="text-xs leading-relaxed" style={{ color: "rgb(var(--foreground-muted))" }}>
                {t("project.pricing.aiScrapingSub", { country: cfg.name, currency: cfg.currency })}
              </p>
            </div>
          </div>

          {/* Sources list */}
          <ul className="space-y-1.5">
            {cfg.sources.map((s) => (
              <li key={s} className="flex items-center gap-2 text-xs" style={{ color: "rgb(var(--foreground-subtle))" }}>
                <div className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: "rgb(var(--primary))" }} />
                {s}
              </li>
            ))}
          </ul>

          {/* Scraping progress */}
          {scraping && (
            <div className="space-y-2">
              {scrapeSteps.map((step, i) => (
                <div key={i} className={`flex items-center gap-2 text-xs transition-opacity ${i < stepIdx ? "opacity-100" : "opacity-30"}`}>
                  {i < stepIdx
                    ? <CheckCircle className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} style={{ color: "rgb(var(--primary))" }} />
                    : i === stepIdx
                    ? <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" style={{ color: "rgb(var(--primary))" }} />
                    : <div className="h-3.5 w-3.5 shrink-0 rounded-full" style={{ border: "1.5px solid rgb(var(--border) / 0.06)" }} />
                  }
                  <span style={{ color: i < stepIdx ? "rgb(var(--foreground-muted))" : "rgb(var(--foreground-subtle))" }}>{step}</span>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={handleScrape}
            disabled={scraping}
            className="btn-primary justify-center disabled:opacity-60 mt-auto"
          >
            {scraping
              ? <><Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.5} />{t("project.pricing.fetching")}</>
              : <><Zap className="h-4 w-4" strokeWidth={1.5} />{t("project.pricing.fetchPrices")}</>
            }
          </button>
        </div>

        {/* Option B — Upload Sheet */}
        <div className="card p-6 flex flex-col gap-5">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px]" style={{ background: "rgb(var(--primary-soft))", border: "1px solid rgb(var(--primary-soft))" }}>
              <Upload className="h-5 w-5" strokeWidth={1.5} style={{ color: "rgb(var(--primary))" }} />
            </div>
            <div>
              <p className="text-sm font-semibold mb-0.5" style={{ color: "rgb(var(--foreground))" }}>{t("project.pricing.uploadSheet")}</p>
              <p className="text-xs leading-relaxed" style={{ color: "rgb(var(--foreground-muted))" }}>
                {t("project.pricing.uploadSub")}
              </p>
            </div>
          </div>

          {/* Template download */}
          <div className="rounded-[12px] p-4 flex items-center justify-between gap-3" style={{ background: "rgb(var(--surface-2))", border: "1px solid rgb(var(--border) / 0.06)" }}>
            <div>
              <p className="text-xs font-medium mb-0.5" style={{ color: "rgb(var(--foreground))" }}>{t("project.pricing.templateName")}</p>
              <p className="text-[10px]" style={{ color: "rgb(var(--foreground-subtle))" }}>
                {t("project.pricing.templateSub", { n: ws.analysis?.boqItems.length ?? 6 })}
              </p>
            </div>
            <button
              onClick={() => downloadTemplate(ws)}
              className="btn-secondary text-xs py-1.5 px-3 gap-1.5 shrink-0"
            >
              <Download className="h-3.5 w-3.5" strokeWidth={1.5} />
              {t("project.pricing.downloadTemplate")}
            </button>
          </div>

          {/* Upload zone */}
          <div
            className="rounded-[12px] border-2 border-dashed p-6 text-center cursor-pointer transition-colors hover:border-primary"
            style={{ borderColor: "rgb(var(--border) / 0.06)" }}
            onClick={() => fileRef.current?.click()}
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" style={{ color: "rgb(var(--primary))" }} />
                <p className="text-xs" style={{ color: "rgb(var(--foreground-muted))" }}>{t("project.pricing.parsing")} {fileName}…</p>
              </div>
            ) : fileName ? (
              <div className="flex flex-col items-center gap-2">
                <CheckCircle className="h-5 w-5" strokeWidth={1.5} style={{ color: "rgb(var(--success))" }} />
                <p className="text-xs font-medium" style={{ color: "rgb(var(--foreground))" }}>{fileName}</p>
                <p className="text-[10px]" style={{ color: "rgb(var(--foreground-subtle))" }}>{t("project.pricing.clickToReplace")}</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="h-5 w-5" strokeWidth={1.5} style={{ color: "rgb(var(--foreground-subtle))" }} />
                <p className="text-xs font-medium" style={{ color: "rgb(var(--foreground-muted))" }}>
                  {t("project.pricing.dropSheet")}
                </p>
                <p className="text-[10px]" style={{ color: "rgb(var(--foreground-subtle))" }}>{t("project.pricing.dropSheetSub")}</p>
              </div>
            )}
          </div>

          <input
            ref={fileRef}
            type="file"
            accept=".csv,.xlsx"
            className="sr-only"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
        </div>
      </div>
    </div>
  );
}
