"use client";

import { useState } from "react";
import {
  CheckCircle, Circle, Clock, AlertTriangle, Download,
  FileText, Shield, Wrench, Calendar, DollarSign, Users,
  HardHat, Zap,
} from "lucide-react";
import type { ProjectWorkspace } from "@/types";

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  category: "legal" | "technical" | "financial" | "hse";
  required: boolean;
  autoLinked?: string; // proposal type that fulfils this
}

const ITEMS: ChecklistItem[] = [
  { id: "c1",  label: "Trade Licence / Company Registration",        description: "Valid trade licence issued by the relevant authority (e.g. OCCI, DED).",            category: "legal",     required: true },
  { id: "c2",  label: "VAT Registration Certificate",                description: "Valid VAT certificate matching the company registered for the tender.",             category: "legal",     required: true },
  { id: "c3",  label: "ISO 9001:2015 Quality Certificate",           description: "Third-party quality management system certification, valid and in scope.",           category: "legal",     required: true },
  { id: "c4",  label: "ISO 14001 / ISO 45001 Certificates",          description: "Environmental & OH&S management system certificates.",                              category: "hse",       required: true },
  { id: "c5",  label: "Grade Classification Certificate",            description: "Contractor classification from relevant authority (e.g. MOH Oman Grade A/B).",      category: "legal",     required: true },
  { id: "c6",  label: "Bid Bond / Tender Security",                  description: "Bank guarantee or tender security per the required amount in the tender documents.", category: "financial", required: true },
  { id: "c7",  label: "Technical Proposal",                          description: "Technical methodology, approach, and scope narrative.",                              category: "technical", required: true,  autoLinked: "technical_proposal" },
  { id: "c8",  label: "Company Profile",                             description: "Corporate overview, track record, key projects, certifications, and staff.",        category: "technical", required: true,  autoLinked: "company_profile" },
  { id: "c9",  label: "Method Statement",                            description: "Step-by-step construction methodology for the key work packages.",                  category: "technical", required: true,  autoLinked: "method_statement" },
  { id: "c10", label: "Construction Programme",                      description: "Works programme (bar chart or CPM) showing activities, durations, and critical path.", category: "technical", required: true },
  { id: "c11", label: "Priced Bill of Quantities",                   description: "Fully priced BOQ with unit rates, quantities, and totals.",                         category: "financial", required: true },
  { id: "c12", label: "Financial Proposal / Price Schedule",         description: "Tender price submission, inclusive of all costs, overhead, and profit.",            category: "financial", required: true,  autoLinked: "financial_proposal" },
  { id: "c13", label: "Key Personnel CVs & Qualifications",          description: "CVs for Project Manager, Site Engineer, QA/QC, and Safety Officer.",                category: "technical", required: true },
  { id: "c14", label: "HSE Plan",                                    description: "Project-specific HSE plan covering risks, controls, and emergency procedures.",     category: "hse",       required: false },
];

const CATEGORY_META: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  legal:     { label: "Legal & Compliance",   color: "var(--color-ai)",      icon: Shield },
  technical: { label: "Technical Documents",  color: "var(--color-accent)",  icon: Wrench },
  financial: { label: "Financial",            color: "var(--color-success)", icon: DollarSign },
  hse:       { label: "HSE",                  color: "var(--color-warning)", icon: HardHat },
};

type ItemStatus = "ready" | "partial" | "missing";

export function SubmissionTab({ ws }: { ws: ProjectWorkspace }) {
  // auto-detect which proposal types are ready
  const readyProposals = new Set(ws.proposals.filter((p) => p.status === "ready").map((p) => p.type));

  // manual overrides (physical docs the user confirms they have)
  const [manual, setManual] = useState<Record<string, boolean>>({});

  function getStatus(item: ChecklistItem): ItemStatus {
    if (item.autoLinked && readyProposals.has(item.autoLinked as import("@/types").ProposalDocType)) return "ready";
    if (manual[item.id]) return "ready";
    return "missing";
  }

  const total     = ITEMS.length;
  const readyCount = ITEMS.filter((i) => getStatus(i) === "ready").length;
  const pct        = Math.round((readyCount / total) * 100);

  const categories = ["legal", "technical", "financial", "hse"] as const;

  return (
    <div className="max-w-[860px] space-y-6">

      {/* Progress banner */}
      <div className="card p-5" style={{ background: pct === 100 ? "var(--color-success-sub)" : "var(--color-surface)", border: `1px solid ${pct === 100 ? "var(--color-success-line)" : "var(--color-border)"}` }}>
        <div className="flex items-center justify-between gap-6 mb-3">
          <div>
            <p className="text-sm font-semibold mb-0.5" style={{ color: "var(--color-text-1)" }}>
              Submission Readiness — {pct}%
            </p>
            <p className="text-xs" style={{ color: "var(--color-text-2)" }}>
              {readyCount} of {total} required documents ready · {total - readyCount} outstanding
            </p>
          </div>
          <div className="flex items-center gap-3">
            {pct === 100 ? (
              <CheckCircle className="h-6 w-6" strokeWidth={1.5} style={{ color: "var(--color-success)" }} />
            ) : (
              <AlertTriangle className="h-6 w-6" strokeWidth={1.5} style={{ color: pct >= 70 ? "var(--color-warning)" : "var(--color-danger)" }} />
            )}
            <button className="btn-secondary text-xs py-1.5 px-3 gap-1.5">
              <Download className="h-3.5 w-3.5" strokeWidth={1.5} />
              Export checklist
            </button>
          </div>
        </div>
        <div className="h-2.5 w-full rounded-full overflow-hidden" style={{ background: "var(--color-border)" }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${pct}%`,
              background: pct === 100 ? "var(--color-success)" : pct >= 70 ? "var(--color-warning)" : "var(--color-danger)",
            }}
          />
        </div>
        <div className="flex gap-4 mt-3">
          {[
            { label: "Ready",       color: "var(--color-success)", count: readyCount },
            { label: "Outstanding", color: "var(--color-danger)",  count: total - readyCount },
          ].map(({ label, color, count }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full" style={{ background: color }} />
              <span className="text-xs" style={{ color: "var(--color-text-2)" }}>{count} {label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* AI auto-link notice */}
      {readyProposals.size > 0 && (
        <div className="flex items-start gap-3 rounded-[14px] px-4 py-3.5" style={{ background: "var(--color-ai-sub)", border: "1px solid var(--color-ai-line)" }}>
          <Zap className="h-4 w-4 shrink-0 mt-0.5" strokeWidth={1.5} style={{ color: "var(--color-ai)" }} />
          <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-2)" }}>
            <span className="font-semibold" style={{ color: "var(--color-ai)" }}>Auto-linked: </span>
            {readyProposals.size} generated proposal{readyProposals.size !== 1 ? "s" : ""} automatically marked ready.
            For physical documents (bonds, certificates), tick them when you have the originals.
          </p>
        </div>
      )}

      {/* Checklist by category */}
      {categories.map((cat) => {
        const meta  = CATEGORY_META[cat];
        const Icon  = meta.icon;
        const items = ITEMS.filter((i) => i.category === cat);
        const done  = items.filter((i) => getStatus(i) === "ready").length;
        return (
          <div key={cat} className="card overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-3.5" style={{ borderBottom: "1px solid var(--color-border-sub)", background: "var(--color-panel)" }}>
              <div className="flex h-7 w-7 items-center justify-center rounded-[8px]" style={{ background: `color-mix(in srgb, ${meta.color} 15%, transparent)` }}>
                <Icon className="h-3.5 w-3.5" strokeWidth={1.5} style={{ color: meta.color }} />
              </div>
              <p className="text-xs font-semibold" style={{ color: "var(--color-text-1)" }}>{meta.label}</p>
              <span className="ml-auto text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: done === items.length ? "var(--color-success-sub)" : "var(--color-border)", color: done === items.length ? "var(--color-success)" : "var(--color-text-3)" }}>
                {done}/{items.length}
              </span>
            </div>
            <div className="divide-y" style={{ borderColor: "var(--color-border-sub)" }}>
              {items.map((item) => {
                const status  = getStatus(item);
                const isAuto  = item.autoLinked && readyProposals.has(item.autoLinked as import("@/types").ProposalDocType);
                return (
                  <div key={item.id} className="flex items-start gap-4 px-5 py-3.5">
                    {/* Toggle (only for non-auto items) */}
                    <button
                      disabled={!!isAuto}
                      onClick={() => setManual((m) => ({ ...m, [item.id]: !m[item.id] }))}
                      className="shrink-0 mt-0.5 transition-transform hover:scale-110 disabled:cursor-default"
                    >
                      {status === "ready" ? (
                        <CheckCircle className="h-5 w-5" strokeWidth={1.5} style={{ color: "var(--color-success)" }} />
                      ) : (
                        <Circle className="h-5 w-5" strokeWidth={1.5} style={{ color: "var(--color-border)" }} />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-xs font-semibold" style={{ color: "var(--color-text-1)" }}>{item.label}</p>
                        {!item.required && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: "var(--color-panel)", color: "var(--color-text-3)", border: "1px solid var(--color-border)" }}>Optional</span>
                        )}
                        {isAuto && (
                          <span className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: "var(--color-ai-sub)", color: "var(--color-ai)", border: "1px solid var(--color-ai-line)" }}>
                            <Zap className="h-2.5 w-2.5" strokeWidth={2} />AI generated
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] mt-0.5 leading-relaxed" style={{ color: "var(--color-text-3)" }}>{item.description}</p>
                    </div>
                    {/* Status label */}
                    <div className="shrink-0 flex items-center gap-1.5">
                      {status === "ready" ? (
                        <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: "var(--color-success-sub)", color: "var(--color-success)" }}>
                          <CheckCircle className="h-2.5 w-2.5" strokeWidth={2} />Ready
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: "var(--color-panel)", color: "var(--color-text-3)", border: "1px solid var(--color-border)" }}>
                          <Clock className="h-2.5 w-2.5" strokeWidth={2} />Outstanding
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
