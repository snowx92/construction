import type { Metadata } from "next";
import { mockTenders } from "@/data/mock";
import { Zap, FileText, Download, CheckCircle, Clock, ChevronRight } from "lucide-react";

export const metadata: Metadata = { title: "Proposals" };

const PROPOSAL_TYPES = [
  { id: "technical", label: "Technical Proposal", desc: "Method statement, scope of work, execution plan, company profile", icon: FileText },
  { id: "financial", label: "Financial Proposal", desc: "Cost breakdown, material estimates, labor, equipment, margin analysis", icon: Zap },
];

const STEPS = [
  { n: 1, label: "Select tender",       done: true  },
  { n: 2, label: "Review AI analysis",  done: true  },
  { n: 3, label: "Choose proposal type",done: false },
  { n: 4, label: "Customize sections",  done: false },
  { n: 5, label: "Export",             done: false },
];

export default function ProposalPage() {
  const readyTenders = mockTenders.filter((t) => t.status === "ready" || t.status === "analyzing");

  return (
    <div className="mx-auto max-w-[1200px] px-8 py-10">

      <div className="mb-8">
        <p className="text-xs font-medium uppercase tracking-widest mb-1" style={{ color: "var(--color-text-3)" }}>AI Generation</p>
        <h1 className="text-3xl font-semibold" style={{ color: "var(--color-text-1)" }}>Proposal Workspace</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--color-text-2)" }}>Generate technical or financial proposals from analyzed tenders</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">

        {/* Steps sidebar */}
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-widest mb-4" style={{ color: "var(--color-text-3)" }}>Progress</p>
          {STEPS.map((step, idx) => (
            <div key={step.n} className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <div
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                  style={step.done
                    ? { background: "var(--color-success)", color: "white" }
                    : step.n === 3
                      ? { background: "var(--color-accent)", color: "white" }
                      : { background: "var(--color-panel)", color: "var(--color-text-3)", border: "1px solid var(--color-border)" }}
                >
                  {step.done ? <CheckCircle className="h-3.5 w-3.5" strokeWidth={2} /> : step.n}
                </div>
                {idx < STEPS.length - 1 && (
                  <div className="w-px flex-1 my-1" style={{ background: step.done ? "var(--color-success)" : "var(--color-border)", minHeight: "16px" }} />
                )}
              </div>
              <p
                className="text-sm pt-0.5 pb-4"
                style={{ color: step.n === 3 ? "var(--color-text-1)" : step.done ? "var(--color-success)" : "var(--color-text-3)", fontWeight: step.n === 3 ? 600 : 400 }}
              >
                {step.label}
              </p>
            </div>
          ))}
        </div>

        {/* Main workspace */}
        <div className="lg:col-span-2 space-y-6">

          {/* Tender selector */}
          <div className="card p-6">
            <p className="text-xs font-medium uppercase tracking-widest mb-4" style={{ color: "var(--color-text-3)" }}>1. Select Tender</p>
            <div className="space-y-2">
              {readyTenders.map((t, idx) => (
                <label
                  key={t.id}
                  className="flex items-center justify-between rounded-[14px] px-4 py-3 cursor-pointer transition-colors"
                  style={idx === 0
                    ? { background: "var(--color-accent-muted)", border: "1.5px solid var(--color-accent)" }
                    : { background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
                >
                  <div className="flex items-center gap-3">
                    <input type="radio" name="tender" defaultChecked={idx === 0} className="accent-accent" />
                    <div>
                      <p className="text-sm font-medium" style={{ color: "var(--color-text-1)" }}>{t.title}</p>
                      <p className="text-xs" style={{ color: "var(--color-text-3)" }}>{t.client}</p>
                    </div>
                  </div>
                  <span className={`badge ${t.status === "ready" ? "badge-success" : "badge-ai"}`}>
                    {t.status === "ready" ? "Ready" : "Analyzing"}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Proposal type */}
          <div className="card p-6">
            <p className="text-xs font-medium uppercase tracking-widest mb-4" style={{ color: "var(--color-text-3)" }}>2. Proposal Type</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {PROPOSAL_TYPES.map(({ id, label, desc, icon: Icon }, idx) => (
                <label
                  key={id}
                  className="rounded-[16px] p-5 cursor-pointer transition-colors"
                  style={idx === 0
                    ? { background: "var(--color-accent-muted)", border: "1.5px solid var(--color-accent)" }
                    : { background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
                >
                  <div className="flex items-start gap-3">
                    <input type="radio" name="type" defaultChecked={idx === 0} className="mt-1" />
                    <div>
                      <div className="flex h-8 w-8 items-center justify-center rounded-[10px] mb-3" style={{ background: "var(--color-accent-muted)" }}>
                        <Icon className="h-4 w-4" strokeWidth={1.5} style={{ color: "var(--color-accent)" }} />
                      </div>
                      <p className="text-sm font-semibold mb-1" style={{ color: "var(--color-text-1)" }}>{label}</p>
                      <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-3)" }}>{desc}</p>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Sections preview */}
          <div className="card p-6">
            <p className="text-xs font-medium uppercase tracking-widest mb-4" style={{ color: "var(--color-text-3)" }}>3. Sections (AI-generated)</p>
            <div className="space-y-2">
              {["Executive Summary", "Company Profile", "Technical Approach", "Method Statement", "Scope of Work", "Execution Plan", "Team & Resources", "Quality & HSE"].map((s, i) => (
                <div key={s} className="flex items-center justify-between rounded-[10px] px-4 py-2.5" style={{ background: i < 3 ? "var(--color-ai-sub)" : "var(--color-panel)" }}>
                  <div className="flex items-center gap-2.5">
                    {i < 3
                      ? <CheckCircle className="h-3.5 w-3.5" strokeWidth={1.5} style={{ color: "var(--color-ai)" }} />
                      : <Clock className="h-3.5 w-3.5" strokeWidth={1.5} style={{ color: "var(--color-text-3)" }} />
                    }
                    <span className="text-xs font-medium" style={{ color: "var(--color-text-1)" }}>{s}</span>
                  </div>
                  {i < 3 && <span className="badge badge-ai">AI ready</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Generate CTA */}
          <div className="flex items-center justify-between rounded-[20px] px-6 py-5" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--color-text-1)" }}>Ready to generate</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--color-text-3)" }}>Al Wasl Road — Technical Proposal · Est. 45 seconds</p>
            </div>
            <div className="flex gap-3">
              <button className="btn-secondary gap-2">
                <Download className="h-4 w-4" strokeWidth={1.5} />
                Preview
              </button>
              <button className="btn-primary gap-2">
                <Zap className="h-4 w-4" strokeWidth={1.5} />
                Generate Proposal
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
