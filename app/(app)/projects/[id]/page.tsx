"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ApiProjectDetail } from "@/components/projects/api-project-detail";
import { formatCurrency, cn } from "@/lib/utils";
import { useT, useLocale } from "@/lib/i18n";
import { useProjectStore, useCompanyProfileStore } from "@/store";
import { useLocalizedWorkspace } from "@/lib/i18n/use-localized-data";
import { TenderAnalysisReference } from "@/components/projects/tender-analysis-reference";
import { PricingPanel } from "@/components/projects/pricing-panel";
import { BoqTab } from "@/components/projects/boq-tab";
import { SubmissionTab } from "@/components/projects/submission-tab";
import { MethodStatementTab } from "@/components/projects/method-statement-tab";
import { ProgrammeTab } from "@/components/projects/programme-tab";
import { FilePipelineTab } from "@/components/projects/file-pipeline-tab";
import type { ProposalDocType, GeneratedProposal } from "@/types";
import {
  FileText, Zap, DollarSign, MessageSquare, FolderOpen,
  AlertTriangle, CheckCircle, Download, Pin, MoreHorizontal,
  ChevronRight, Send, Upload, Loader2, Trash2, Pencil, X, Check,
  FolderKanban, Tag, HelpCircle, ClipboardList, ListChecks, Wrench, BarChart2,
} from "lucide-react";
import Link from "next/link";

/* Inline tooltip — small "?" icon that shows a description on hover */
function HelpHint({
  text,
  visible = true,
  placement = "top",
}: {
  text: string;
  visible?: boolean;
  placement?: "top" | "bottom" | "right" | "left";
}) {
  if (!visible) return null;
  const placementCls =
    placement === "bottom" ? "top-full mt-2 left-1/2 -translate-x-1/2"
    : placement === "right" ? "left-full ml-2 top-1/2 -translate-y-1/2"
    : placement === "left"  ? "right-full mr-2 top-1/2 -translate-y-1/2"
    : "bottom-full mb-2 left-1/2 -translate-x-1/2";
  const arrowCls =
    placement === "bottom" ? "bottom-full left-1/2 -translate-x-1/2 border-b-[6px]"
    : placement === "right" ? "right-full top-1/2 -translate-y-1/2 border-r-[6px]"
    : placement === "left"  ? "left-full top-1/2 -translate-y-1/2 border-l-[6px]"
    : "top-full left-1/2 -translate-x-1/2 border-t-[6px]";
  return (
    <span className="relative inline-flex items-center group/help" onClick={(e) => e.stopPropagation()}>
      <HelpCircle
        className="h-3 w-3 cursor-help opacity-50 hover:opacity-100 transition-opacity"
        strokeWidth={2}
        style={{ color: "rgb(var(--foreground-subtle))" }}
      />
      <span
        className={`absolute z-50 invisible opacity-0 group-hover/help:visible group-hover/help:opacity-100 transition-opacity pointer-events-none w-64 px-3 py-2.5 rounded-[10px] text-[11px] leading-relaxed shadow-lg ${placementCls}`}
        style={{
          background: "rgb(var(--foreground))",
          color: "rgb(var(--background))",
        }}
      >
        {text}
        <span
          className={`absolute h-0 w-0 border-x-[6px] border-x-transparent ${arrowCls}`}
          style={{ borderColor: "transparent", borderTopColor: placement === "top" ? "rgb(var(--foreground))" : undefined, borderBottomColor: placement === "bottom" ? "rgb(var(--foreground))" : undefined, borderRightColor: placement === "right" ? "rgb(var(--foreground))" : undefined, borderLeftColor: placement === "left" ? "rgb(var(--foreground))" : undefined }}
        />
      </span>
    </span>
  );
}




type ChatMsg = { role: "user" | "ai"; text: string };

const AI_REPLIES: Record<string, string> = {
  default: "Based on the tender analysis for this project: the critical risk is the AED 50,000/day traffic penalty clause. I recommend requesting a cap at 10% of contract value during bid clarifications. Would you like me to draft the clarification letter?",
  risk: "I've identified 2 critical and 1 high risk in this tender. The most urgent is the LAD clause in Section 12.1 — the daily rate of AED 50,000 is 2.5× above market standard. Recommend flagging in your bid submission or requesting a negotiation meeting.",
  proposal: "I can generate all 5 proposal documents for this project. They'll be pre-filled with the extracted tender data — you just review and export. Which would you like to start with: Technical Proposal or Financial Proposal?",
  boq: "Based on the uploaded drawings and BOQ, I've extracted 47 line items across 4 categories: Civil (32), Electrical (9), Structures (3), and Signage (3). Total estimated value: AED 4,200,000. Want me to cross-check these against current market rates?",
};

function getReply(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("risk") || m.includes("خطر")) return AI_REPLIES.risk;
  if (m.includes("proposal") || m.includes("عرض")) return AI_REPLIES.proposal;
  if (m.includes("boq") || m.includes("كميات")) return AI_REPLIES.boq;
  return AI_REPLIES.default;
}

/* Build Company Profile sections from the centralised company profile store —
 * single source of truth for every tender. */
function buildCompanyProfileSections(cp: import("@/types").CompanyProfile): { heading: string; body: string }[] {
  const sections: { heading: string; body: string }[] = [
    {
      heading: `About ${cp.legalName}`,
      body: `${cp.description} Established ${cp.established} in ${cp.headquarters}. Trade licence ${cp.registration} · VAT ${cp.vatNumber}.`,
    },
  ];
  if (cp.certifications.length > 0) {
    sections.push({
      heading: "Certifications & Approvals",
      body: cp.certifications.map((c, i) => `${i + 1}. ${c}`).join(" "),
    });
  }
  if (cp.pastProjects.length > 0) {
    const top = cp.pastProjects.slice(0, 6);
    const totalValue = cp.pastProjects.reduce((s, p) => s + p.value, 0);
    sections.push({
      heading: "Track Record",
      body:
        `${cp.pastProjects.length} delivered projects with a combined value of AED ${(totalValue / 1_000_000).toFixed(1)}M. ` +
        `Reference projects: ${top.map((p) => `${p.name} (${p.client}, ${p.year}, AED ${(p.value / 1_000_000).toFixed(1)}M)`).join("; ")}.`,
    });
  }
  if (cp.staff.length > 0) {
    const byDept = cp.staff.reduce<Record<string, number>>((acc, s) => {
      acc[s.department] = (acc[s.department] ?? 0) + 1;
      return acc;
    }, {});
    const key = cp.staff.slice(0, 5)
      .map((s) => `${s.name} — ${s.title} (${s.employeeId})`)
      .join("; ");
    sections.push({
      heading: "Key Personnel",
      body:
        `${cp.staff.length} staff across ${Object.keys(byDept).length} departments: ` +
        `${Object.entries(byDept).map(([d, n]) => `${d} (${n})`).join(", ")}. ` +
        `Key personnel: ${key}.`,
    });
  }
  if (cp.equipment.length > 0) {
    const totalUnits = cp.equipment.reduce((s, e) => s + e.quantity, 0);
    const byCat = cp.equipment.reduce<Record<string, number>>((acc, e) => {
      acc[e.category] = (acc[e.category] ?? 0) + e.quantity;
      return acc;
    }, {});
    const owned = cp.equipment.filter((e) => e.ownership === "owned").reduce((s, e) => s + e.quantity, 0);
    sections.push({
      heading: "Plant & Equipment",
      body:
        `${totalUnits} units of equipment across ${Object.keys(byCat).length} categories ` +
        `(${owned} owned, ${totalUnits - owned} leased / subcontracted). Categories: ` +
        `${Object.entries(byCat).map(([c, n]) => `${c} (${n})`).join(", ")}. ` +
        `Notable equipment includes ${cp.equipment.slice(0, 4).map((e) => `${e.name}${e.model ? ` (${e.model})` : ""} × ${e.quantity}`).join("; ")}.`,
    });
  }
  if (cp.labour.length > 0) {
    const totalHc = cp.labour.reduce((s, l) => s + l.headcount, 0);
    const skilled = cp.labour.filter((l) => l.skillLevel === "skilled" || l.skillLevel === "supervisor").reduce((s, l) => s + l.headcount, 0);
    const trades  = new Set(cp.labour.map((l) => l.trade));
    sections.push({
      heading: "Workforce & Labour Capacity",
      body:
        `${totalHc} permanent workers across ${trades.size} trades, of whom ${skilled} are skilled or supervisory. ` +
        `Key trades: ${cp.labour.slice(0, 6).map((l) => `${l.title} × ${l.headcount}`).join("; ")}. ` +
        `All workforce is mobilisable within 14 days of Notice to Proceed.`,
    });
  }
  return sections;
}

/* Simulated generated content for new proposals */
const GENERATED_SECTIONS: Record<ProposalDocType, { heading: string; body: string }[]> = {
  tender_submission: [
    { heading: "Tender Cover", body: "ConstructCo LLC submits this tender in full compliance with the issued tender documents, conditions of contract, and all applicable UAE regulations and municipality requirements." },
    { heading: "Project Understanding", body: "We have thoroughly reviewed the tender documents and confirm our understanding of the full scope of works, programme requirements, and contractual obligations." },
    { heading: "Bill of Quantities — Priced", body: "Full priced BOQ attached. Rates are based on current market pricing from verified UAE construction databases, valid through Q3 2026." },
    { heading: "Pricing Basis & Assumptions", body: "Unit rates are inclusive of all labour, materials, plant, overheads, profit, and temporary works unless otherwise stated. Rates are firm for the tender validity period." },
    { heading: "Compliance Statement", body: "ConstructCo LLC confirms full compliance with all technical, financial, and legal requirements of this tender. We accept the contract conditions without qualification." },
  ],
  tender_overview: [
    { heading: "Project Summary", body: "AI-extracted overview of the tender scope, deliverables, and project context based on the uploaded documents." },
    { heading: "Key Requirements", body: "Contractor qualifications, certifications, compliance requirements, and submission prerequisites as identified in the tender." },
    { heading: "Key Dates", body: "Bid submission deadline, mobilization date, and substantial completion milestones extracted from the tender programme." },
  ],
  risk_assessment: [
    { heading: "Contractual Risks", body: "LAD clauses, penalty structures, and unfavourable contract conditions identified during document review. Mitigation strategies recommended." },
    { heading: "Operational Risks", body: "Site constraints, programme pressure, supply chain exposure, and execution risks specific to this tender scope." },
    { heading: "Penalty Clauses", body: "Summary of liquidated damages, retention clauses, and performance bond requirements extracted from the contract documents." },
  ],
  boq_report: [
    { heading: "Quantities Summary", body: "Bill of quantities line items extracted from drawings and specifications, categorised by work package with quantities and estimated unit rates." },
    { heading: "Estimated Project Value", body: "AI-estimated project value derived from current market rates cross-referenced against extracted BOQ quantities. Confidence based on completeness of tender documents." },
  ],
  technical_proposal: [
    { heading: "Executive Summary", body: "ConstructCo LLC proposes a comprehensive solution leveraging our 17 years of UAE construction expertise, ISO 9001:2015 certification, and proven project delivery methodology." },
    { heading: "Technical Approach", body: "Our approach integrates modern construction methods with rigorous quality controls to ensure delivery within schedule and budget constraints." },
    { heading: "Quality Assurance", body: "All materials shall be tested at approved third-party laboratories. Daily HSE toolbox talks and weekly inspections will be conducted throughout." },
  ],
  company_profile: [
    { heading: "About ConstructCo LLC", body: "ConstructCo LLC is a Grade A Civil & MEP contractor registered with Dubai Municipality since 2009, with AED 850M+ in delivered projects." },
    { heading: "Certifications", body: "ISO 9001:2015 · ISO 14001:2015 · ISO 45001:2018 · RTA Approved Grade A · DEWA Approved · Dubai Municipality Grade I" },
  ],
  method_statement: [
    { heading: "Mobilization", body: "Site establishment, traffic management setup, and temporary facilities within 14 days of Notice to Proceed." },
    { heading: "Construction Sequence", body: "Works proceed in logical sequence: subgrade → drainage → subbase → base course → wearing course, with continuous QC checkpoints." },
  ],
  scope_of_work: [
    { heading: "Scope Summary", body: "Full design-and-build scope as defined in the contract documents, including all civil, structural, MEP, and finishing works." },
    { heading: "Exclusions", body: "Utility diversions by Client, geotechnical investigation by Client, specialist SCADA systems by Client's system integrator." },
  ],
  execution_plan: [
    { heading: "Programme", body: "18-month detailed programme with 45-day float. Critical path: substructure → superstructure → MEP → finishes → commissioning." },
    { heading: "Resource Plan", body: "Peak workforce: 320 workers. Key plant: crawler crane 80T × 2, concrete pumps × 4, tower cranes × 2 (floors 8+)." },
  ],
  financial_proposal: [
    { heading: "Pricing Summary", body: "Our all-inclusive lump sum price encompasses all materials, labor, plant, temporary works, testing, and commissioning as detailed in the BOQ." },
    { heading: "Payment Terms", body: "Monthly valuations with 28-day payment terms. 10% retention (50% released at practical completion, 50% at defects liability expiry)." },
  ],
};

export default function ProjectWorkspacePage({ params }: { params: { id: string } }) {
  const t = useT();
  const { dir } = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const workspaces       = useProjectStore((s) => s.workspaces);
  const renameWorkspace  = useProjectStore((s) => s.renameWorkspace);
  const deleteWorkspace  = useProjectStore((s) => s.deleteWorkspace);
  const pinWorkspace     = useProjectStore((s) => s.pinWorkspace);
  const startGenerating  = useProjectStore((s) => s.startGenerating);
  const finishGenerating = useProjectStore((s) => s.finishGenerating);
  const companyProfile   = useCompanyProfileStore((s) => s.profile);

  const rawWs = workspaces.find((w) => w.id === params.id) ?? null;
  const ws    = useLocalizedWorkspace(rawWs) ?? null;
  const sourceParam = searchParams.get("source");

  const [tab, setTab] = useState(sourceParam === "tender" ? "proposals" : "overview");
  const [activeProposal, setActiveProposal] = useState<ProposalDocType | null>(
    ws?.tenderId ? "tender_overview" : "technical_proposal"
  );
  const [chatInput, setChatInput]     = useState("");
  const [messages, setMessages]       = useState<ChatMsg[]>([
    { role: "ai", text: ws ? `I have full context on "${ws.name}". I've analyzed the tender documents and generated ${ws.proposals.length} proposal document${ws.proposals.length !== 1 ? "s" : ""}. What would you like to work on?` : "Loading…" },
  ]);
  const [chatLoading, setChatLoading] = useState(false);

  /* Rename state */
  const [renaming, setRenaming]       = useState(false);
  const [renameVal, setRenameVal]     = useState(ws?.name ?? "");
  const renameRef = useRef<HTMLInputElement>(null);

  /* Delete confirm */
  const [confirmDelete, setConfirmDelete] = useState(false);

  /* Generating */
  const [generatingType, setGeneratingType] = useState<ProposalDocType | null>(null);
  const [streamIdx, setStreamIdx]           = useState(0);

  /* Help-tooltip visibility (persisted across sessions) */
  const [showHelp, setShowHelp] = useState(true);
  useEffect(() => {
    const stored = localStorage.getItem("cs-show-help");
    if (stored !== null) setShowHelp(stored === "true");
  }, []);
  useEffect(() => {
    localStorage.setItem("cs-show-help", String(showHelp));
  }, [showHelp]);

  if (!ws) return <ApiProjectDetail projectId={params.id} />;

  const TABS = [
    { id: "overview",    label: t("project.tabs.overview"),    icon: FileText,       help: "Project summary including tender source, BOQ items, key dates, and a checklist of generated documents." },
    { id: "boq",         label: t("boq.tabLabel"),             icon: ClipboardList,  help: "Bill of Quantities — generate via AI from uploaded files, upload your own sheet, or add items manually. The BOQ feeds the Pricing tab and the Financial Proposal." },
    { id: "proposals",   label: t("project.tabs.proposals"),   icon: Zap,            help: "All AI-generated documents — the final priced tender submission, the tender analysis docs, and standard proposal documents (technical, financial, scope, etc.)." },
    { id: "pricing",     label: t("project.tabs.pricing"),     icon: Tag,            help: "Set unit rates for the BOQ items via AI market scraping or by uploading your own pricing sheet. Required to generate the Financial Proposal and Tender Submission." },
    { id: "financial",   label: t("project.tabs.financial"),   icon: DollarSign,     help: "Cost breakdown by category (materials, labour, equipment, overhead, risk buffer) and the AI-suggested tender price. Total cost × (1 + margin %) = suggested price." },
    { id: "submission",  label: t("project.tabs.submission"),  icon: ListChecks,     help: "Tender submission checklist — track which required documents are ready (auto-linked from generated proposals) and which still need to be prepared." },
    { id: "method",      label: t("project.tabs.method"),      icon: Wrench,         help: "Method Statement editor — fill in the form fields and let AI draft a professional method statement document ready for export." },
    { id: "programme",   label: t("project.tabs.programme"),   icon: BarChart2,      help: "Construction Programme — AI-generated Gantt chart showing all activities, durations, and the critical path across the project timeline." },
    { id: "copilot",     label: t("project.tabs.copilot"),     icon: MessageSquare,  help: "Chat with the AI about this specific project. It has full context on the tender analysis, pricing, and generated documents." },
    { id: "documents",   label: t("project.tabs.documents"),   icon: FolderOpen,     help: "Uploaded tender files, drawings, BOQ sheets, and any reference documents attached to this project. Files are processed through an AI pipeline automatically." },
  ];

  const ANALYSIS_TYPES: { type: ProposalDocType; label: string; icon: string }[] = [
    { type: "tender_overview", label: t("project.analysisTypes.tenderOverview"),  icon: "📄" },
    { type: "risk_assessment", label: t("project.analysisTypes.riskAssessment"),  icon: "⚠️" },
    { type: "boq_report",      label: t("project.analysisTypes.boqReport"),       icon: "📊" },
  ];

  const PROPOSAL_TYPES: { type: ProposalDocType; label: string; icon: string }[] = [
    { type: "technical_proposal", label: t("proposal.typeTechnical"),  icon: "📋" },
    { type: "company_profile",    label: t("proposal.sectionCompanyProfile"),      icon: "🏢" },
    { type: "method_statement",   label: t("proposal.sectionMethodStatement"),     icon: "🔧" },
    { type: "scope_of_work",      label: t("proposal.sectionScopeOfWork"),        icon: "📐" },
    { type: "execution_plan",     label: t("proposal.sectionExecutionPlan"),       icon: "📅" },
    { type: "financial_proposal", label: t("proposal.typeFinancial"),   icon: "💰" },
  ];

  useEffect(() => {
    if (renaming) renameRef.current?.focus();
  }, [renaming]);

  function commitRename() {
    const v = renameVal.trim();
    if (v && v !== ws!.name) renameWorkspace(ws!.id, v);
    setRenaming(false);
  }

  function handleDelete() {
    deleteWorkspace(ws!.id);
    router.push("/projects");
  }

  function sendChat(text: string) {
    if (!text.trim()) return;
    setMessages((m) => [...m, { role: "user", text }]);
    setChatInput("");
    setChatLoading(true);
    setTimeout(() => {
      setMessages((m) => [...m, { role: "ai", text: getReply(text) }]);
      setChatLoading(false);
    }, 1100);
  }

  async function generateProposal(type: ProposalDocType) {
    const alreadyExists = ws!.proposals.find((p) => p.type === type && p.status === "ready");
    if (alreadyExists || generatingType) return;

    setGeneratingType(type);
    setActiveProposal(type);
    setStreamIdx(0);
    if (tab !== "proposals") setTab("proposals");

    const pid = startGenerating(ws!.id, type);
    // For Company Profile, pull live data from the centralised company profile store.
    const sections = type === "company_profile"
      ? buildCompanyProfileSections(companyProfile)
      : GENERATED_SECTIONS[type];

    // Stream sections one-by-one
    for (let i = 0; i < sections.length; i++) {
      await new Promise((r) => setTimeout(r, 900));
      setStreamIdx(i + 1);
    }

    const finished: GeneratedProposal = {
      id: pid,
      type,
      title: PROPOSAL_TYPES.find((p) => p.type === type)!.label,
      status: "ready",
      sections: sections.map((s, i) => ({ id: `s${i}`, ...s })),
      createdAt: new Date().toISOString(),
      wordCount: sections.reduce((acc, s) => acc + s.body.split(" ").length + s.heading.split(" ").length, 0) * 12,
    };

    finishGenerating(ws!.id, pid, finished);
    setGeneratingType(null);
    setStreamIdx(0);
  }

  async function generateAll() {
    for (const { type } of PROPOSAL_TYPES) {
      const exists = ws!.proposals.find((p) => p.type === type && p.status === "ready");
      if (!exists) await generateProposal(type);
    }
  }

  async function generateTenderDoc() {
    const type: ProposalDocType = "tender_submission";
    const alreadyExists = ws!.proposals.find((p) => p.type === type && p.status === "ready");
    if (alreadyExists || generatingType) return;

    setGeneratingType(type);
    setActiveProposal(type);
    setStreamIdx(0);
    setTab("proposals");

    const pid = startGenerating(ws!.id, type);
    const pricing = ws!.pricingItems ?? [];
    const analysis = ws!.analysis;

    // Build sections that bake in real pricing numbers
    const boqLines = pricing.length
      ? pricing.map((item) =>
          `${item.description}: ${item.unit} × AED ${item.unitPrice.toLocaleString()} — Source: ${item.source}`
        ).join(". ")
      : "Pricing not yet configured — rates to be confirmed.";

    const totalValue = pricing.reduce((sum, item) => {
      const boqQty = analysis?.boqItems.find((b) => b.description === item.description)?.quantity ?? 1;
      return sum + item.unitPrice * boqQty;
    }, 0);

    const sources = [...new Set(pricing.map((i) => i.source))].join(", ");
    const validUntil = pricing[0]?.validUntil ?? "—";

    const sections = [
      {
        id: "ts1",
        heading: "Tender Cover & Introduction",
        body: `${ws!.name} — submitted by ConstructCo LLC to ${ws!.clientName ?? "Client"}. This tender is submitted in full response to the issued tender documents and incorporates all conditions, specifications, and drawings therein without qualification.`,
      },
      {
        id: "ts2",
        heading: "Project Understanding",
        body: analysis?.summary ?? "Refer to tender documents for full project scope.",
      },
      {
        id: "ts3",
        heading: "Bill of Quantities — Priced",
        body: boqLines,
      },
      {
        id: "ts4",
        heading: "Total Tender Price",
        body: `Total submitted tender value: AED ${totalValue.toLocaleString()}. This is an all-inclusive lump sum covering all labour, materials, plant, temporary works, testing, commissioning, overheads, and profit as detailed in the attached priced BOQ.`,
      },
      {
        id: "ts5",
        heading: "Pricing Basis & Validity",
        body: `Unit rates sourced from: ${sources || "company rate schedule"}. All rates are valid until ${validUntil}. Prices are firm and not subject to fluctuation during the tender validity period.`,
      },
      {
        id: "ts6",
        heading: "Compliance & Acceptance",
        body: `ConstructCo LLC confirms full compliance with all technical, financial, HSE, and legal requirements of this tender. We accept the contract conditions without reservation and are prepared to execute the works within the programme stated.`,
      },
    ];

    for (let i = 0; i < sections.length; i++) {
      await new Promise((r) => setTimeout(r, 800));
      setStreamIdx(i + 1);
    }

    const finished: GeneratedProposal = {
      id:        pid,
      type,
      title:     "Tender Submission",
      status:    "ready",
      sections,
      createdAt: new Date().toISOString(),
      wordCount: sections.reduce((acc, s) => acc + s.body.split(" ").length + s.heading.split(" ").length, 0),
    };

    finishGenerating(ws!.id, pid, finished);
    setGeneratingType(null);
    setStreamIdx(0);
  }

  const currentProposal = ws.proposals.find((p) => p.type === activeProposal);
  const isGeneratingCurrent = generatingType === activeProposal;

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "rgb(var(--background))" }}>

      {/* Project header */}
      <div className="px-8 py-5 shrink-0" style={{ borderBottom: "1px solid rgb(var(--border) / 0.06)", background: "rgb(var(--surface))" }}>
        <div className="mx-auto max-w-[1200px]">
          <div className="flex items-center gap-2 mb-2 text-xs" style={{ color: "rgb(var(--foreground-subtle))" }}>
            <Link href="/projects" style={{ color: "rgb(var(--foreground-subtle))" }}>{t("nav.projects")}</Link>
            <ChevronRight className="h-3 w-3" />
            <span style={{ color: "rgb(var(--foreground))" }}>{ws.name}</span>
          </div>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {renaming ? (
                <div className="flex items-center gap-2">
                  <input
                    ref={renameRef}
                    value={renameVal}
                    onChange={(e) => setRenameVal(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") commitRename(); if (e.key === "Escape") setRenaming(false); }}
                    className="input text-xl font-semibold py-1 px-2"
                    style={{ color: "rgb(var(--foreground))", maxWidth: 400 }}
                  />
                  <button onClick={commitRename} className="btn-primary py-1 px-2"><Check className="h-4 w-4" strokeWidth={2} /></button>
                  <button onClick={() => setRenaming(false)} className="btn-ghost py-1 px-2"><X className="h-4 w-4" strokeWidth={2} /></button>
                </div>
              ) : (
                <div className="flex items-center gap-2 group">
                  <h1 className="text-xl font-semibold truncate" style={{ color: "rgb(var(--foreground))" }}>{ws.name}</h1>
                  <button onClick={() => { setRenameVal(ws.name); setRenaming(true); }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity btn-ghost p-1">
                    <Pencil className="h-3.5 w-3.5" strokeWidth={1.5} style={{ color: "rgb(var(--foreground-subtle))" }} />
                  </button>
                </div>
              )}
              <p className="text-sm mt-0.5" style={{ color: "rgb(var(--foreground-muted))" }}>
                {ws.clientName} · {ws.projectType}
                {ws.financials && <span style={{ color: "rgb(var(--primary))" }} className="font-medium"> · {formatCurrency(ws.financials.suggestedPrice, "AED")}</span>}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => pinWorkspace(ws.id, !ws.pinned)}
                className="btn-ghost py-1.5 px-3 text-xs gap-1.5"
                title={ws.pinned ? t("project.header.unpin") : t("project.header.pinToTop")}
              >
                <Pin className="h-3.5 w-3.5" strokeWidth={1.5} style={{ color: ws.pinned ? "rgb(var(--primary))" : undefined }} />
              </button>
              <div className="relative">
                <button onClick={() => setConfirmDelete(!confirmDelete)} className="btn-ghost py-1.5 px-3 text-xs">
                  <MoreHorizontal className="h-3.5 w-3.5" strokeWidth={1.5} />
                </button>
                {confirmDelete && (
                  <div className="absolute right-0 top-full mt-1 z-50 rounded-[12px] px-1 py-1 min-w-[160px]"
                    style={{ background: "rgb(var(--surface))", border: "1px solid rgb(var(--border) / 0.06)", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
                    <button
                      onClick={handleDelete}
                      className="w-full flex items-center gap-2 rounded-[8px] px-3 py-2 text-xs font-medium text-left transition-colors hover:bg-danger-soft"
                      style={{ color: "rgb(var(--danger))" }}
                    >
                      <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                      {t("project.header.deleteProject")}
                    </button>
                    <button onClick={() => setConfirmDelete(false)}
                      className="w-full flex items-center gap-2 rounded-[8px] px-3 py-2 text-xs text-left hover:bg-black/[0.03]"
                      style={{ color: "rgb(var(--foreground-muted))" }}>
                      {t("common.cancel")}
                    </button>
                  </div>
                )}
              </div>
              <button className="btn-secondary text-xs py-1.5 px-3 gap-1.5">
                <Download className="h-3.5 w-3.5" strokeWidth={1.5} />{t("project.header.exportAll")}
              </button>
              <button
                onClick={() => { setTab("proposals"); generateAll(); }}
                disabled={!!generatingType}
                className="btn-primary text-xs py-1.5 px-3 gap-1.5 disabled:opacity-60"
              >
                {generatingType ? <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.5} /> : <Zap className="h-3.5 w-3.5" strokeWidth={1.5} />}
                {generatingType ? t("project.header.generating") : t("project.header.generateProposals")}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-8 shrink-0" style={{ borderBottom: "1px solid rgb(var(--border) / 0.06)", background: "rgb(var(--surface))" }}>
        <div className="mx-auto max-w-[1200px] flex items-center gap-0.5 overflow-x-auto scrollbar-tab">
          {TABS.map(({ id, label, icon: Icon, help }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className="flex items-center gap-2 px-3 py-3 text-xs font-medium transition-all border-b-2 whitespace-nowrap"
              style={{
                borderColor: tab === id ? "rgb(var(--primary))" : "transparent",
                color: tab === id ? "rgb(var(--primary))" : "rgb(var(--foreground-muted))",
              }}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
              {label}
              {id === "proposals" && ws.proposals.filter(p => p.status === "ready").length > 0 && (
                <span className="badge badge-ai px-1.5 py-0">{ws.proposals.filter(p => p.status === "ready").length}</span>
              )}
              {id === "pricing" && !ws.pricingItems?.length && (
                <span className="badge badge-warning px-1.5 py-0">{t("project.badge.setUp")}</span>
              )}
              {id === "pricing" && !!ws.pricingItems?.length && (
                <span className="badge badge-success px-1.5 py-0">✓</span>
              )}
              {id === "boq" && !ws.analysis?.boqItems.length && (
                <span className="badge badge-warning px-1.5 py-0">{t("project.badge.setUp")}</span>
              )}
              {id === "boq" && !!ws.analysis?.boqItems.length && (
                <span className="badge badge-success px-1.5 py-0">{ws.analysis!.boqItems.length}</span>
              )}
              <HelpHint text={help} visible={showHelp} placement="bottom" />
            </button>
          ))}
          <div className="ml-auto flex items-center gap-1 shrink-0">
            <button
              onClick={() => setShowHelp((v) => !v)}
              className="btn-ghost flex items-center gap-1.5 py-1.5 px-3 text-xs"
              style={{
                color: showHelp ? "rgb(var(--primary))" : "rgb(var(--foreground-subtle))",
                background: showHelp ? "rgb(var(--primary-soft))" : undefined,
              }}
              title={showHelp ? "Hide help hints" : "Show help hints"}
            >
              <HelpCircle className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
              {showHelp ? t("common.hintsOn") : t("common.hintsOff")}
            </button>
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-auto">
        <div className="mx-auto max-w-[1200px] px-8 py-8">

          {/* ─── Overview ──────────────────────────────────────── */}
          {tab === "overview" && (
            ws.analysis ? (
              <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                  {/* Tender Source Card */}
                  {ws.tenderId && (
                    <div className="card p-5 border-l-4" style={{ borderColor: "rgb(var(--primary))" }}>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs font-medium mb-1" style={{ color: "rgb(var(--foreground-subtle))" }}>{t("project.overview.convertedFromTender")}</p>
                          <p className="text-sm font-semibold" style={{ color: "rgb(var(--foreground))" }}>
                            {t("project.header.tenderId")} <span style={{ color: "rgb(var(--primary))" }}>{ws.tenderId}</span>
                          </p>
                          <p className="text-xs mt-1" style={{ color: "rgb(var(--foreground-muted))" }}>
                            {ws.clientName && <>{t("project.header.clientLabel")} {ws.clientName} · </>}
                            {t("project.header.projectTypeLabel")} {ws.projectType}
                          </p>
                        </div>
                        <Zap className="h-4 w-4 shrink-0" strokeWidth={1.5} style={{ color: "rgb(var(--primary))" }} />
                      </div>
                    </div>
                  )}

                  {ws.analysis.risks.length > 0 && (
                    <div className="card p-5 flex items-center justify-between gap-4" style={{ background: "rgb(var(--danger-soft))", border: "1px solid rgb(var(--border) / 0.05)" }}>
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="h-4 w-4 shrink-0" strokeWidth={1.5} style={{ color: "rgb(var(--danger))" }} />
                        <p className="text-sm" style={{ color: "rgb(var(--foreground))" }}>
                          <span className="font-semibold">{t("project.overview.risksIdentified", { count: ws.analysis.risks.length })}</span>
                        </p>
                      </div>
                      <Link href="/insights" className="btn-ghost text-xs py-1.5 px-3 gap-1.5 shrink-0">
                        {t("project.overview.viewInsights")}
                        <ChevronRight className="h-3 w-3" strokeWidth={2} />
                      </Link>
                    </div>
                  )}

                  {ws.analysis.boqItems.length > 0 ? (
                    <div className="card overflow-hidden">
                      <div className="px-6 py-4 flex items-center justify-between gap-2" style={{ borderBottom: "1px solid rgb(var(--border) / 0.05)" }}>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-medium uppercase tracking-widest" style={{ color: "rgb(var(--foreground-subtle))" }}>{t("project.overview.boqItems")}</p>
                          <HelpHint visible={showHelp} text="Bill of Quantities — every measurable item in the tender (materials, units, quantities, rates, totals). AI extracted these directly from the tender drawings and specs. The 'Total' column is quantity × unit rate from the original tender estimate." />
                        </div>
                        <button onClick={() => setTab("boq")} className="btn-ghost text-xs py-1 px-2 gap-1.5" style={{ color: "rgb(var(--primary))" }}>
                          <ClipboardList className="h-3 w-3" strokeWidth={1.5} />
                          {t("boq.tabLabel")}
                        </button>
                      </div>
                      <table className="w-full text-xs">
                        <thead>
                          <tr style={{ borderBottom: "1px solid rgb(var(--border) / 0.05)" }}>
                            {[t("project.pricing.description"), t("common.unit"), t("common.qty"), t("common.rate"), t("common.total")].map(h => (
                              <th key={h} className="px-5 py-3 text-left font-medium" style={{ color: "rgb(var(--foreground-subtle))" }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-black/[0.05]">
                          {ws.analysis.boqItems.map(item => (
                            <tr key={item.id} className="hover:bg-black/[0.025]">
                              <td className="px-5 py-3" style={{ color: "rgb(var(--foreground))" }}>{item.description}</td>
                              <td className="px-5 py-3 font-mono" style={{ color: "rgb(var(--foreground-muted))" }}>{item.unit}</td>
                              <td className="px-5 py-3 font-mono" style={{ color: "rgb(var(--foreground-muted))" }}>{item.quantity.toLocaleString()}</td>
                              <td className="px-5 py-3 font-mono" style={{ color: "rgb(var(--foreground-muted))" }}>{item.unitPrice.toLocaleString()}</td>
                              <td className="px-5 py-3 font-mono font-semibold" style={{ color: "rgb(var(--foreground))" }}>{formatCurrency(item.total, "AED")}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    /* No BOQ yet — prompt to generate */
                    <div className="card p-6 flex items-center justify-between gap-4" style={{ background: "rgb(var(--warning-soft))", border: "1px solid rgb(var(--border) / 0.05)" }}>
                      <div className="flex items-center gap-3">
                        <ClipboardList className="h-5 w-5 shrink-0" strokeWidth={1.5} style={{ color: "rgb(var(--warning))" }} />
                        <div>
                          <p className="text-sm font-semibold" style={{ color: "rgb(var(--foreground))" }}>{t("boq.title")}</p>
                          <p className="text-xs" style={{ color: "rgb(var(--foreground-muted))" }}>{t("boq.empty.sub")}</p>
                        </div>
                      </div>
                      <button onClick={() => setTab("boq")} className="btn-primary text-xs py-1.5 px-3 gap-1.5 shrink-0">
                        <Zap className="h-3.5 w-3.5" strokeWidth={1.5} />
                        {t("boq.aiExtract.cta")}
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-5">
                  {ws.financials && (
                    <div className="card p-5" style={{ background: "rgb(var(--primary-soft))", border: "1px solid rgb(var(--primary-soft))" }}>
                      <div className="flex items-center gap-2 mb-3">
                        <p className="text-xs font-medium" style={{ color: "rgb(var(--foreground-subtle))" }}>{t("project.overview.suggestedPrice")}</p>
                        <HelpHint visible={showHelp} text="The price we recommend bidding. Calculated as Total Cost × (1 + margin %). Total Cost = materials + labor + equipment + overhead + risk buffer (4%)." />
                      </div>
                      <p className="text-2xl font-bold mb-1" style={{ color: "rgb(var(--primary))" }}>{formatCurrency(ws.financials.suggestedPrice, "AED")}</p>
                      <p className="text-xs mb-4" style={{ color: "rgb(var(--foreground-subtle))" }}>{t("project.overview.marginFormat", { margin: ws.financials.margin, cost: formatCurrency(ws.financials.totalCost, "AED") })}</p>
                      <button onClick={() => setTab("financial")} className="btn-secondary text-xs w-full justify-center">{t("project.overview.viewBreakdown")}</button>
                    </div>
                  )}

                  <div className="card p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <p className="text-xs font-medium uppercase tracking-widest" style={{ color: "rgb(var(--foreground-subtle))" }}>{t("project.overview.keyDates")}</p>
                      <HelpHint visible={showHelp} text="Important deadlines parsed from the tender — bid submission cutoff, site mobilization date, substantial completion, etc. Use these to plan resourcing and document deadlines." />
                    </div>
                    {ws.analysis.deadlines.map(d => (
                      <div key={d.label} className="flex justify-between py-2" style={{ borderBottom: "1px solid rgb(var(--border) / 0.05)" }}>
                        <span className="text-xs" style={{ color: "rgb(var(--foreground-muted))" }}>{d.label}</span>
                        <span className="text-xs font-medium font-mono" style={{ color: "rgb(var(--foreground))" }}>{d.date}</span>
                      </div>
                    ))}
                  </div>

                  <div className="card p-5">
                    {ws.tenderId && (
                      <>
                        <p className="text-[10px] font-medium uppercase tracking-widest mb-2" style={{ color: "rgb(var(--primary))" }}>{t("project.overview.analysisDocs")}</p>
                        <div className="space-y-1.5 mb-3">
                          {ANALYSIS_TYPES.map(({ type, label, icon }) => {
                            const exists = ws.proposals.find(p => p.type === type && p.status === "ready");
                            return (
                              <div key={type} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm">{icon}</span>
                                  <span className="text-xs" style={{ color: "rgb(var(--foreground-muted))" }}>{label}</span>
                                </div>
                                {exists
                                  ? <CheckCircle className="h-3.5 w-3.5" strokeWidth={1.5} style={{ color: "rgb(var(--primary))" }} />
                                  : <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgb(var(--surface-2))", color: "rgb(var(--foreground-subtle))", border: "1px solid rgb(var(--border) / 0.06)" }}>—</span>
                                }
                              </div>
                            );
                          })}
                        </div>
                        <div className="h-px mb-3" style={{ background: "rgb(var(--border) / 0.05)" }} />
                      </>
                    )}
                    <p className="text-[10px] font-medium uppercase tracking-widest mb-2" style={{ color: "rgb(var(--foreground-subtle))" }}>{t("project.overview.proposals")}</p>
                    <div className="space-y-1.5">
                      {PROPOSAL_TYPES.map(({ type, label, icon }) => {
                        const exists = ws.proposals.find(p => p.type === type && p.status === "ready");
                        const isGen  = generatingType === type;
                        return (
                          <div key={type} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{icon}</span>
                              <span className="text-xs" style={{ color: "rgb(var(--foreground-muted))" }}>{label}</span>
                            </div>
                            {isGen
                              ? <Loader2 className="h-3.5 w-3.5 animate-spin" style={{ color: "rgb(var(--primary))" }} />
                              : exists
                              ? <CheckCircle className="h-3.5 w-3.5" strokeWidth={1.5} style={{ color: "rgb(var(--success))" }} />
                              : <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgb(var(--surface-2))", color: "rgb(var(--foreground-subtle))", border: "1px solid rgb(var(--border) / 0.06)" }}>—</span>
                            }
                          </div>
                        );
                      })}
                    </div>
                    <button
                      onClick={() => { setTab("proposals"); generateAll(); }}
                      disabled={!!generatingType}
                      className="btn-primary text-xs w-full justify-center mt-4 disabled:opacity-60"
                    >
                      <Zap className="h-3.5 w-3.5" strokeWidth={1.5} />
                      {generatingType ? t("project.header.generating") : t("project.header.generateProposals")}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* No analysis yet (new project) */
              <div className="max-w-[560px] mx-auto text-center py-20">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-[20px]" style={{ background: "rgb(var(--primary-soft))" }}>
                  <Zap className="h-8 w-8" strokeWidth={1.5} style={{ color: "rgb(var(--primary))" }} />
                </div>
                <h2 className="text-xl font-semibold mb-2" style={{ color: "rgb(var(--foreground))" }}>{t("project.overview.aiAnalyzing")}</h2>
                <p className="text-sm mb-6" style={{ color: "rgb(var(--foreground-muted))" }}>
                  {t("project.overview.aiAnalyzingSub")}
                </p>
                <button onClick={() => setTab("documents")} className="btn-primary mx-auto">
                  <Upload className="h-4 w-4" strokeWidth={1.5} />
                  {t("project.overview.uploadFiles")}
                </button>
              </div>
            )
          )}

          {/* ─── BOQ (Bill of Quantities) ──────────────────────── */}
          {tab === "boq" && (
            <BoqTab ws={ws} />
          )}

          {/* ─── Proposals ──────────────────────────────────────── */}
          {tab === "proposals" && (
            <div className="space-y-5">

              {/* Pricing nudge */}
              {!ws.pricingItems?.length && (
                <div className="flex items-center justify-between gap-4 rounded-[14px] px-5 py-3.5"
                  style={{ background: "rgb(var(--warning-soft))", border: "1px solid rgb(var(--border) / 0.05)" }}>
                  <div className="flex items-center gap-3">
                    <Tag className="h-4 w-4 shrink-0" strokeWidth={1.5} style={{ color: "rgb(var(--warning))" }} />
                    <p className="text-sm" style={{ color: "rgb(var(--foreground))" }}>
                      {t("project.proposals.pricingNudge")}
                    </p>
                  </div>
                  <button onClick={() => setTab("pricing")} className="btn-secondary text-xs py-1.5 px-3 gap-1.5 shrink-0">
                    <Tag className="h-3.5 w-3.5" strokeWidth={1.5} />
                    {t("project.proposals.setPricing")}
                  </button>
                </div>
              )}

              {/* 3-panel layout: sidebar | viewer | reference */}
              <div className={`grid gap-6 ${ws.analysis ? "lg:grid-cols-[280px_1fr_220px]" : "lg:grid-cols-[280px_1fr]"}`}>

                {/* ── Left sidebar — document list ── */}
                <div className="flex flex-col gap-1 min-w-0">

                  {/* Tender Submission */}
                  {(() => {
                    const p      = ws.proposals.find((x) => x.type === "tender_submission");
                    const ready  = p?.status === "ready";
                    const isGen  = generatingType === "tender_submission";
                    const active = activeProposal === "tender_submission";
                    return (
                      <div className="mb-1">
                        <div className="px-2 mb-2 flex items-center gap-1.5">
                          <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "rgb(var(--primary))" }}>
                            {t("project.proposals.tenderDocument")}
                          </p>
                          <HelpHint visible={showHelp} placement="right" text="The final priced tender bid you submit to the client. AI builds this using your tender analysis PLUS the unit rates you set in the Pricing tab — so every BOQ item has a real number against it." />
                        </div>
                        <button
                          onClick={() => {
                            setActiveProposal("tender_submission");
                            if (!p && !isGen) generateTenderDoc();
                          }}
                          className="w-full flex items-center gap-3 rounded-[14px] px-3.5 py-3 text-left transition-all"
                          style={active
                            ? { background: "rgb(var(--primary-soft))", border: "1px solid rgb(var(--primary-soft))" }
                            : { background: "rgb(var(--surface-2))", border: "1px solid rgb(var(--border) / 0.05)" }}
                        >
                          <span className="text-lg shrink-0 leading-none">📑</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold" style={{ color: active ? "rgb(var(--primary))" : "rgb(var(--foreground))" }}>
                              {t("project.proposals.tenderSubmission")}
                            </p>
                            <p className="text-[11px] mt-0.5" style={{ color:
                              isGen ? "rgb(var(--primary))" :
                              ready ? "rgb(var(--success))" :
                              ws.pricingItems?.length ? "rgb(var(--primary))" :
                              "rgb(var(--warning))"
                            }}>
                              {isGen ? t("project.proposals.generatingWithPricing")
                                : ready ? t("project.proposals.wordsFormat", { count: p!.wordCount.toLocaleString() })
                                : ws.pricingItems?.length ? t("project.proposals.pricingReady")
                                : t("project.proposals.pricingMissing")}
                            </p>
                          </div>
                          {isGen ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" style={{ color: "rgb(var(--primary))" }} />
                            : ready ? <CheckCircle className="h-4 w-4 shrink-0" strokeWidth={1.5} style={{ color: "rgb(var(--success))" }} />
                            : <Zap className="h-4 w-4 shrink-0" strokeWidth={1.5} style={{ color: ws.pricingItems?.length ? "rgb(var(--primary))" : "rgb(var(--foreground-subtle))" }} />}
                        </button>
                        <div className="mt-4 mb-3 h-px" style={{ background: "rgb(var(--border) / 0.06)" }} />
                      </div>
                    );
                  })()}

                  {/* Analysis documents */}
                  {ws.tenderId && (
                    <div className="mb-1">
                      <div className="px-2 mb-2 flex items-center gap-1.5">
                        <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "rgb(var(--primary))" }}>
                          {t("project.proposals.tenderAnalysis")}
                        </p>
                        <HelpHint visible={showHelp} placement="right" text="AI-generated documents that summarise what's inside the tender — project overview, identified risks, and the extracted Bill of Quantities. Pre-generated automatically when you converted from a tender." />
                      </div>
                      <div className="flex flex-col gap-1">
                        {ANALYSIS_TYPES.map(({ type, label, icon }) => {
                          const p      = ws.proposals.find((x) => x.type === type);
                          const ready  = p?.status === "ready";
                          const isGen  = generatingType === type;
                          const active = activeProposal === type;
                          return (
                            <button
                              key={type}
                              onClick={() => { setActiveProposal(type); if (!p && !isGen) generateProposal(type); }}
                              className="w-full flex items-center gap-3 rounded-[12px] px-3.5 py-2.5 text-left transition-all"
                              style={active
                                ? { background: "rgb(var(--primary-soft))", border: "1px solid rgb(var(--primary))" }
                                : { background: "transparent", border: "1px solid transparent" }}
                            >
                              <span className="text-base shrink-0 leading-none">{icon}</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium" style={{ color: active ? "rgb(var(--primary))" : "rgb(var(--foreground))" }}>{label}</p>
                                <p className="text-[11px] mt-0.5" style={{ color: isGen ? "rgb(var(--primary))" : ready ? "rgb(var(--success))" : "rgb(var(--foreground-subtle))" }}>
                                  {isGen ? t("common.generating") : ready ? t("project.proposals.wordsFormat", { count: p!.wordCount.toLocaleString() }) : t("project.proposals.preGenerated")}
                                </p>
                              </div>
                              {isGen ? <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" style={{ color: "rgb(var(--primary))" }} />
                                : ready ? <CheckCircle className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} style={{ color: "rgb(var(--success))" }} />
                                : null}
                            </button>
                          );
                        })}
                      </div>
                      <div className="mt-4 mb-3 h-px" style={{ background: "rgb(var(--border) / 0.06)" }} />
                    </div>
                  )}

                  {/* Proposals */}
                  <div className="flex-1">
                    <div className="px-2 mb-2 flex items-center gap-1.5">
                      <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "rgb(var(--foreground-subtle))" }}>
                        {t("project.proposals.proposalsLabel")}
                      </p>
                      <HelpHint visible={showHelp} placement="right" text="Standard proposal documents you submit alongside the tender — technical approach, company profile, method statement, scope of work, execution plan, and financial proposal. Click any item to let the AI write it." />
                    </div>
                    <div className="flex flex-col gap-1">
                      {PROPOSAL_TYPES.map(({ type, label, icon }) => {
                        const p      = ws.proposals.find((x) => x.type === type);
                        const ready  = p?.status === "ready";
                        const isGen  = generatingType === type;
                        const active = activeProposal === type;
                        return (
                          <button
                            key={type}
                            onClick={() => { setActiveProposal(type); if (!p && !isGen) generateProposal(type); }}
                            className="w-full flex items-center gap-3 rounded-[12px] px-3.5 py-2.5 text-left transition-all"
                            style={active
                              ? { background: "rgb(var(--primary-soft))", border: "1px solid rgb(var(--primary-soft))" }
                              : { background: "transparent", border: "1px solid transparent" }}
                          >
                            <span className="text-base shrink-0 leading-none">{icon}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium" style={{ color: active ? "rgb(var(--primary))" : "rgb(var(--foreground))" }}>{label}</p>
                              <p className="text-[11px] mt-0.5" style={{ color: isGen ? "rgb(var(--primary))" : ready ? "rgb(var(--success))" : "rgb(var(--foreground-subtle))" }}>
                                {isGen ? t("common.generating") : ready ? t("project.proposals.wordsFormat", { count: p!.wordCount.toLocaleString() }) : t("project.proposals.clickToGenerate")}
                              </p>
                            </div>
                            {isGen ? <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" style={{ color: "rgb(var(--primary))" }} />
                              : ready ? <CheckCircle className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} style={{ color: "rgb(var(--success))" }} />
                              : null}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    onClick={() => generateAll()}
                    disabled={!!generatingType}
                    className="btn-primary w-full justify-center text-xs mt-5 disabled:opacity-60"
                  >
                    <Zap className="h-3.5 w-3.5" strokeWidth={1.5} />
                    {t("project.proposals.generateAllProposals")}
                  </button>
                </div>

                {/* ── Centre — document viewer ── */}
                <div className="min-w-0">
                  {isGeneratingCurrent ? (
                    <div className="card p-8 space-y-8">
                      {/* Header */}
                      <div className="flex items-center gap-3 pb-4" style={{ borderBottom: "1px solid rgb(var(--border) / 0.05)" }}>
                        <div className="flex h-9 w-9 items-center justify-center rounded-[10px]" style={{ background: "rgb(var(--primary-soft))" }}>
                          <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.5} style={{ color: "rgb(var(--primary))" }} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold" style={{ color: "rgb(var(--foreground))" }}>
                            {t("project.proposals.aiWriting", {
                              label: [...ANALYSIS_TYPES, ...PROPOSAL_TYPES, { type: "tender_submission" as const, label: t("project.proposals.tenderSubmission"), icon: "📑" }]
                                .find(p => p.type === activeProposal)?.label ?? activeProposal ?? ""
                            })}
                          </p>
                          <p className="text-xs" style={{ color: "rgb(var(--foreground-subtle))" }}>{t("project.proposals.usingSource")}</p>
                        </div>
                      </div>
                      {/* Stream */}
                      {(GENERATED_SECTIONS[activeProposal!] ?? []).slice(0, streamIdx).map((sec, i) => (
                        <div key={i} className="ai-mark">
                          <h3 className="text-base font-semibold mb-2" style={{ color: "rgb(var(--foreground))" }}>{sec.heading}</h3>
                          <p className="text-sm leading-relaxed" style={{ color: "rgb(var(--foreground-muted))" }}>{sec.body}</p>
                        </div>
                      ))}
                      {streamIdx < (GENERATED_SECTIONS[activeProposal!] ?? []).length && (
                        <div className="flex items-center gap-1.5 pt-2">
                          {[0,1,2].map(i => (
                            <div key={i} className="h-2 w-2 rounded-full animate-pulse-soft"
                              style={{ background: "rgb(var(--primary))", animationDelay: `${i * 0.2}s` }} />
                          ))}
                        </div>
                      )}
                    </div>
                  ) : currentProposal?.status === "ready" ? (
                    <div className="card overflow-hidden">
                      {/* Doc header */}
                      <div className="flex items-center justify-between px-7 py-5" style={{ borderBottom: "1px solid rgb(var(--border) / 0.05)" }}>
                        <div>
                          <p className="text-base font-semibold" style={{ color: "rgb(var(--foreground))" }}>{currentProposal.title}</p>
                          <p className="text-xs mt-0.5" style={{ color: "rgb(var(--foreground-subtle))" }}>
                            {t("project.proposals.wordsFormat", { count: currentProposal.wordCount.toLocaleString(), date: new Date(currentProposal.createdAt).toLocaleDateString() })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <span className="badge badge-ai">{t("project.proposals.aiGenerated")}</span>
                          <button className="btn-secondary text-xs py-1.5 px-3 gap-1.5">
                            <Download className="h-3.5 w-3.5" strokeWidth={1.5} />{t("project.proposals.exportPdf")}
                          </button>
                        </div>
                      </div>
                      {/* Doc content */}
                      <div className="px-8 py-8 space-y-10 overflow-y-auto" style={{ maxHeight: "calc(100vh - 300px)" }}>
                        {currentProposal.sections.map((sec, i) => (
                          <div key={sec.id} className="ai-mark">
                            {i > 0 && <div className="h-px mb-10" style={{ background: "rgb(var(--border) / 0.05)" }} />}
                            <h3 className="text-base font-semibold mb-3" style={{ color: "rgb(var(--foreground))" }}>{sec.heading}</h3>
                            <p className="text-sm leading-7" style={{ color: "rgb(var(--foreground-muted))" }}>{sec.body}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="card flex flex-col items-center justify-center text-center py-24 px-10">
                      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-[20px]" style={{ background: "rgb(var(--primary-soft))" }}>
                        <Zap className="h-7 w-7" strokeWidth={1.5} style={{ color: "rgb(var(--primary))" }} />
                      </div>
                      <p className="text-base font-semibold mb-1.5" style={{ color: "rgb(var(--foreground))" }}>{t("project.proposals.notGeneratedYet")}</p>
                      <p className="text-sm mb-6 max-w-[320px]" style={{ color: "rgb(var(--foreground-subtle))" }}>
                        {t("project.proposals.notGeneratedSub")}
                      </p>
                      <button
                        onClick={() => activeProposal && generateProposal(activeProposal)}
                        className="btn-primary mx-auto"
                      >
                        <Zap className="h-4 w-4" strokeWidth={1.5} />{t("project.proposals.generateNow")}
                      </button>
                    </div>
                  )}
                </div>

                {/* ── Right — reference panel ── */}
                {ws.analysis && (
                  <div className="hidden lg:block">
                    <TenderAnalysisReference
                      analysis={ws.analysis}
                      tenderId={ws.tenderId}
                      tenderTitle={ws.name}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ─── Pricing ────────────────────────────────────────── */}
          {tab === "pricing" && (
            <div className="space-y-6">
              <PricingPanel ws={ws} />

              {/* Generate CTA — appears once pricing is set */}
              {ws.pricingItems && ws.pricingItems.length > 0 && (
                <div className="card p-6" style={{ background: "rgb(var(--primary-soft))", border: "1px solid rgb(var(--primary-soft))" }}>
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px]" style={{ background: "rgb(var(--primary-soft))" }}>
                        <Zap className="h-5 w-5" strokeWidth={1.5} style={{ color: "rgb(var(--primary))" }} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold mb-1" style={{ color: "rgb(var(--foreground))" }}>
                          {t("project.pricing.readyCta")}
                        </p>
                        <p className="text-xs leading-relaxed" style={{ color: "rgb(var(--foreground-muted))" }}>
                          {t("project.pricing.readyCtaSub", { n: ws.pricingItems.length })}
                        </p>
                        {ws.pricingSource && (
                          <p className="text-xs mt-1.5" style={{ color: "rgb(var(--foreground-subtle))" }}>
                            {t("project.pricing.pricingSource")}: <span className="font-medium">{ws.pricingSource === "scraped" ? t("project.pricing.sourceScraped") : t("project.pricing.sourceUploaded")}</span>
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        const done = ws.proposals.find((p) => p.type === "tender_submission" && p.status === "ready");
                        if (done) { setActiveProposal("tender_submission"); setTab("proposals"); }
                        else generateTenderDoc();
                      }}
                      disabled={!!generatingType}
                      className="btn-primary shrink-0 gap-2 disabled:opacity-60"
                    >
                      {generatingType === "tender_submission"
                        ? <><Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.5} />{t("common.generating")}</>
                        : ws.proposals.find((p) => p.type === "tender_submission" && p.status === "ready")
                        ? <><CheckCircle className="h-4 w-4" strokeWidth={1.5} />{t("project.pricing.viewTender")}</>
                        : <><Zap className="h-4 w-4" strokeWidth={1.5} />{t("project.pricing.generateTender")}</>
                      }
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── Financial ──────────────────────────────────────── */}
          {tab === "financial" && ws.financials && (
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="space-y-4">
                {[
                  { label: t("project.financial.materials"),  value: ws.financials.materialCost,   color: "rgb(var(--primary))",  help: "Sum of all material costs (cement, steel, aggregates, etc.) — quantity × unit rate, totalled from the BOQ." },
                  { label: t("project.financial.labor"),      value: ws.financials.laborCost,      color: "rgb(var(--success))", help: "Estimated workforce cost: crew size × duration × daily rates. Includes skilled and unskilled labour." },
                  { label: t("project.financial.equipment"),  value: ws.financials.equipmentCost,  color: "rgb(var(--primary))",      help: "Plant and equipment rental, fuel, and operator costs — based on the project programme." },
                  { label: t("project.financial.overhead"),   value: ws.financials.overheadCost,   color: "rgb(var(--warning))", help: "Indirect costs — site supervision, insurance, bonds, utilities, mobilization. Typically 8–12% of direct cost." },
                  { label: t("project.financial.riskBuffer"), value: ws.financials.riskBuffer,     color: "rgb(var(--danger))",  help: "Contingency for unforeseen costs (weather, scope variation, material price changes). Set to 4% of base cost by default." },
                ].map(({ label, value, color, help }) => (
                  <div key={label} className="card px-5 py-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-medium" style={{ color: "rgb(var(--foreground-muted))" }}>{label}</p>
                        <HelpHint visible={showHelp} text={help} />
                      </div>
                      <p className="text-sm font-semibold font-mono" style={{ color }}>{formatCurrency(value, "AED")}</p>
                    </div>
                    <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: "rgb(var(--border) / 0.06)" }}>
                      <div className="h-full rounded-full" style={{ width: `${(value / ws.financials!.totalCost) * 100}%`, background: color }} />
                    </div>
                  </div>
                ))}
                <div className="card px-5 py-5" style={{ background: "rgb(var(--primary-soft))", border: "1px solid rgb(var(--primary-soft))" }}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <p className="text-xs" style={{ color: "rgb(var(--foreground-subtle))" }}>{t("project.financial.totalCost")}</p>
                    <HelpHint visible={showHelp} text="Sum of all five cost categories above: Materials + Labor + Equipment + Overhead + Risk Buffer. This is what the project will cost ConstructCo to deliver." />
                  </div>
                  <p className="text-xl font-bold mb-2" style={{ color: "rgb(var(--foreground))" }}>{formatCurrency(ws.financials.totalCost, "AED")}</p>
                  <div className="h-px w-full my-3" style={{ background: "rgb(var(--primary-soft))" }} />
                  <div className="flex items-center gap-1.5 mb-1">
                    <p className="text-xs" style={{ color: "rgb(var(--foreground-subtle))" }}>{t("project.financial.marginFormat", { margin: ws.financials.margin })}</p>
                    <HelpHint visible={showHelp} text={`Total Cost × (1 + ${ws.financials.margin}% margin) = the price we recommend bidding. Margin covers profit and competitive positioning. Adjust margin to be more or less aggressive.`} />
                  </div>
                  <p className="text-2xl font-bold" style={{ color: "rgb(var(--primary))" }}>{formatCurrency(ws.financials.suggestedPrice, "AED")}</p>
                </div>
              </div>

              <div className="lg:col-span-2 card overflow-hidden">
                <div className="px-6 py-4" style={{ borderBottom: "1px solid rgb(var(--border) / 0.05)" }}>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-medium uppercase tracking-widest" style={{ color: "rgb(var(--foreground-subtle))" }}>{t("project.financial.costBreakdown")}</p>
                    <HelpHint visible={showHelp} text="Line-by-line cost for every item in the BOQ. Quantities come from the tender; rates come from your set pricing source (or estimated if not set). Sum equals Total Cost." />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr style={{ borderBottom: "1px solid rgb(var(--border) / 0.05)" }}>
                        {[t("project.financial.category"), t("project.financial.item"), t("common.unit"), t("common.qty"), t("common.rate"), t("common.total")].map(h => (
                          <th key={h} className="px-5 py-3 text-left font-medium" style={{ color: "rgb(var(--foreground-subtle))" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/[0.05]">
                      {ws.financials.breakdown.map(line => (
                        <tr key={line.id} className="hover:bg-black/[0.025]">
                          <td className="px-5 py-3"><span className="badge badge-neutral capitalize">{line.category}</span></td>
                          <td className="px-5 py-3" style={{ color: "rgb(var(--foreground))" }}>{line.item}</td>
                          <td className="px-5 py-3 font-mono" style={{ color: "rgb(var(--foreground-muted))" }}>{line.unit}</td>
                          <td className="px-5 py-3 font-mono" style={{ color: "rgb(var(--foreground-muted))" }}>{line.qty.toLocaleString()}</td>
                          <td className="px-5 py-3 font-mono" style={{ color: "rgb(var(--foreground-muted))" }}>{line.rate.toLocaleString()}</td>
                          <td className="px-5 py-3 font-mono font-semibold" style={{ color: "rgb(var(--foreground))" }}>{formatCurrency(line.total, "AED")}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{ borderTop: "2px solid rgb(var(--border) / 0.06)" }}>
                        <td colSpan={5} className="px-5 py-3 text-xs font-semibold" style={{ color: "rgb(var(--foreground-muted))" }}>{t("project.financial.totalCost")}</td>
                        <td className="px-5 py-3 text-sm font-bold font-mono" style={{ color: "rgb(var(--primary))" }}>{formatCurrency(ws.financials.totalCost, "AED")}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                {ws.financials.notes.length > 0 && (
                  <div className="px-6 py-4" style={{ borderTop: "1px solid rgb(var(--border) / 0.05)", background: "rgb(var(--primary-soft))" }}>
                    <p className="text-xs font-medium mb-2 flex items-center gap-1.5" style={{ color: "rgb(var(--primary))" }}>
                      <Zap className="h-3 w-3" strokeWidth={1.5} />{t("project.financial.aiNotes")}
                    </p>
                    {ws.financials.notes.map((n, i) => (
                      <p key={i} className="text-xs" style={{ color: "rgb(var(--foreground-muted))" }}>• {n}</p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === "financial" && !ws.financials && (
            <div className="text-center py-20">
              <p className="text-sm" style={{ color: "rgb(var(--foreground-subtle))" }}>{t("project.financial.empty")}</p>
            </div>
          )}

          {/* ─── Submission Checklist ──────────────────────────── */}
          {tab === "submission" && <SubmissionTab ws={ws} />}

          {/* ─── Method Statement ───────────────────────────────── */}
          {tab === "method" && <MethodStatementTab ws={ws} />}

          {/* ─── Construction Programme ─────────────────────────── */}
          {tab === "programme" && <ProgrammeTab ws={ws} />}

          {/* ─── Copilot ────────────────────────────────────────── */}
          {tab === "copilot" && (
            <div className="max-w-[760px] mx-auto">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full" style={{ background: "rgb(var(--primary-soft))" }}>
                  <Zap className="h-3.5 w-3.5" strokeWidth={1.5} style={{ color: "rgb(var(--primary))" }} />
                </div>
                <span className="text-sm font-medium" style={{ color: "rgb(var(--foreground-muted))" }}>
                  {t("project.copilot.header", { name: ws.name, count: ws.proposals.filter(p => p.status === "ready").length })}
                </span>
              </div>
              <div className="card overflow-hidden" style={{ minHeight: "480px", display: "flex", flexDirection: "column" }}>
                <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin" style={{ maxHeight: "400px" }}>
                  {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      {msg.role === "ai" && (
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full mr-2 mt-0.5" style={{ background: "rgb(var(--primary-soft))" }}>
                          <Zap className="h-3 w-3" strokeWidth={1.5} style={{ color: "rgb(var(--primary))" }} />
                        </div>
                      )}
                      <div className="max-w-[75%] rounded-[16px] px-4 py-2.5 text-sm leading-relaxed"
                        style={msg.role === "user"
                          ? { background: "rgb(var(--primary))", color: "white", borderRadius: "16px 16px 4px 16px" }
                          : { background: "rgb(var(--surface-2))", border: "1px solid rgb(var(--border) / 0.06)", color: "rgb(var(--foreground-muted))", borderRadius: "4px 16px 16px 16px" }
                        }>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="flex justify-start">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full mr-2" style={{ background: "rgb(var(--primary-soft))" }}>
                        <Loader2 className="h-3 w-3 animate-spin" style={{ color: "rgb(var(--primary))" }} />
                      </div>
                      <div className="rounded-[16px] px-4 py-2.5" style={{ background: "rgb(var(--surface-2))", border: "1px solid rgb(var(--border) / 0.06)" }}>
                        <div className="flex items-center gap-1">
                          {[0,1,2].map(i => <div key={i} className="h-1.5 w-1.5 rounded-full animate-pulse-soft" style={{ background: "rgb(var(--primary))", animationDelay: `${i*0.2}s` }} />)}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="px-4 pb-2 flex flex-wrap gap-2">
                  {[t("project.copilot.askRisks"), t("project.copilot.generateGuarantee"), t("project.copilot.askPenalties"), t("project.copilot.explainBoq")].map(prompt => (
                    <button key={prompt} onClick={() => sendChat(prompt)}
                      className="text-[11px] px-3 py-1.5 rounded-full transition-colors hover:bg-black/[0.04]"
                      style={{ background: "rgb(var(--surface-2))", border: "1px solid rgb(var(--border) / 0.06)", color: "rgb(var(--foreground-muted))" }}>
                      {prompt}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 px-4 pb-4">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") sendChat(chatInput); }}
                    placeholder={t("project.copilot.placeholder")}
                    className="flex-1 input text-sm py-2.5"
                  />
                  <button onClick={() => sendChat(chatInput)} disabled={!chatInput.trim()}
                    className="flex h-9 w-9 items-center justify-center rounded-full disabled:opacity-40 transition-opacity"
                    style={{ background: "rgb(var(--primary))" }}>
                    <Send className="h-4 w-4 text-white" strokeWidth={2} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ─── Documents (pipeline UI) ────────────────────────── */}
          {tab === "documents" && <FilePipelineTab ws={ws} />}
        </div>
      </div>
    </div>
  );
}
