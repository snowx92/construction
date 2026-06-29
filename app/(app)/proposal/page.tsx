"use client";

import { mockTenders } from "@/data/mock";
import { Zap, FileText, Download, CheckCircle, Clock, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";

const PROPOSAL_TYPES = [
  { id: "technical", labelKey: "proposal.typeTechnical", descKey: "proposal.typeTechnicalDesc", icon: FileText },
  { id: "financial", labelKey: "proposal.typeFinancial", descKey: "proposal.typeFinancialDesc", icon: Zap },
];

const STEPS = [
  { n: 1, labelKey: "proposal.stepSelectTender",       done: true  },
  { n: 2, labelKey: "proposal.stepReviewAnalysis",     done: true  },
  { n: 3, labelKey: "proposal.stepChooseType",          done: false },
  { n: 4, labelKey: "proposal.stepCustomize",           done: false },
  { n: 5, labelKey: "proposal.stepExport",              done: false },
];

const SECTIONS = [
  "proposal.sectionExecutiveSummary",
  "proposal.sectionCompanyProfile",
  "proposal.sectionTechnicalApproach",
  "proposal.sectionMethodStatement",
  "proposal.sectionScopeOfWork",
  "proposal.sectionExecutionPlan",
  "proposal.sectionTeamResources",
  "proposal.sectionQualityHSE",
];

export default function ProposalPage() {
  const t = useT();
  const readyTenders = mockTenders.filter((tender) => tender.status === "ready" || tender.status === "analyzing");

  return (
    <div className="mx-auto max-w-[1200px] px-8 py-10">

      <div className="mb-8">
        <p className="text-xs font-medium uppercase tracking-widest mb-1 text-foreground-subtle">{t("proposal.eyebrow")}</p>
        <h1 className="text-3xl font-semibold text-foreground">{t("proposal.title")}</h1>
        <p className="mt-1 text-sm text-foreground-muted">{t("proposal.subtitle")}</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">

        {/* Steps sidebar */}
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-widest mb-4 text-foreground-subtle">{t("proposal.progress")}</p>
          {STEPS.map((step, idx) => (
            <div key={step.n} className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                    step.done
                      ? "bg-success text-white"
                      : step.n === 3
                        ? "bg-primary text-white"
                        : "bg-surface-2 text-foreground-subtle border border-black/[0.06]"
                  )}
                >
                  {step.done ? <CheckCircle className="h-3.5 w-3.5" strokeWidth={2} /> : step.n}
                </div>
                {idx < STEPS.length - 1 && (
                  <div className={cn("w-px flex-1 my-1 min-h-[16px]", step.done ? "bg-success" : "bg-black/[0.06]")} />
                )}
              </div>
              <p
                className={cn(
                  "text-sm pt-0.5 pb-4",
                  step.n === 3 ? "text-foreground font-semibold" : step.done ? "text-success font-normal" : "text-foreground-subtle font-normal"
                )}
              >
                {t(step.labelKey)}
              </p>
            </div>
          ))}
        </div>

        {/* Main workspace */}
        <div className="lg:col-span-2 space-y-6">

          {/* Tender selector */}
          <div className="card p-6">
            <p className="text-xs font-medium uppercase tracking-widest mb-4 text-foreground-subtle">{t("proposal.step1Heading")}</p>
            <div className="space-y-2">
              {readyTenders.map((tender, idx) => (
                <label
                  key={tender.id}
                  className={cn(
                    "flex items-center justify-between rounded-[14px] px-4 py-3 cursor-pointer transition-colors",
                    idx === 0 ? "bg-primary-soft border-[1.5px] border-primary" : "bg-surface border border-black/[0.06]"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <input type="radio" name="tender" defaultChecked={idx === 0} className="accent-primary" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{tender.title}</p>
                      <p className="text-xs text-foreground-subtle">{tender.client}</p>
                    </div>
                  </div>
                  <span className={cn(
                    "inline-flex items-center gap-1 rounded-[var(--radius-pill)] px-2.5 py-0.5 text-xs font-medium",
                    tender.status === "ready" ? "bg-success-soft text-success" : "bg-primary-soft text-primary"
                  )}>
                    {tender.status === "ready" ? t("common.ready") : t("tender.statusAnalyzing")}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Proposal type */}
          <div className="card p-6">
            <p className="text-xs font-medium uppercase tracking-widest mb-4 text-foreground-subtle">{t("proposal.step2Heading")}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {PROPOSAL_TYPES.map(({ id, labelKey, descKey, icon: Icon }, idx) => (
                <label
                  key={id}
                  className={cn(
                    "rounded-[16px] p-5 cursor-pointer transition-colors",
                    idx === 0 ? "bg-primary-soft border-[1.5px] border-primary" : "bg-surface border border-black/[0.06]"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <input type="radio" name="type" defaultChecked={idx === 0} className="mt-1" />
                    <div>
                      <div className="flex h-8 w-8 items-center justify-center rounded-[10px] mb-3 bg-primary-soft">
                        <Icon className="h-4 w-4 text-primary" strokeWidth={1.5} />
                      </div>
                      <p className="text-sm font-semibold mb-1 text-foreground">{t(labelKey)}</p>
                      <p className="text-xs leading-relaxed text-foreground-subtle">{t(descKey)}</p>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Sections preview */}
          <div className="card p-6">
            <p className="text-xs font-medium uppercase tracking-widest mb-4 text-foreground-subtle">{t("proposal.step3Heading")}</p>
            <div className="space-y-2">
              {SECTIONS.map((sectionKey, i) => (
                <div key={sectionKey} className={cn(
                  "flex items-center justify-between rounded-[10px] px-4 py-2.5",
                  i < 3 ? "bg-primary-soft" : "bg-surface-2"
                )}>
                  <div className="flex items-center gap-2.5">
                    {i < 3
                      ? <CheckCircle className="h-3.5 w-3.5 text-primary" strokeWidth={1.5} />
                      : <Clock className="h-3.5 w-3.5 text-foreground-subtle" strokeWidth={1.5} />
                    }
                    <span className="text-xs font-medium text-foreground">{t(sectionKey)}</span>
                  </div>
                  {i < 3 && <span className="inline-flex items-center gap-1 rounded-[var(--radius-pill)] px-2.5 py-0.5 text-xs font-medium bg-primary-soft text-primary">{t("proposal.aiReady")}</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Generate CTA */}
          <div className="flex items-center justify-between rounded-[20px] px-6 py-5 bg-surface border border-black/[0.06]">
            <div>
              <p className="text-sm font-semibold text-foreground">{t("proposal.readyToGenerate")}</p>
              <p className="text-xs mt-0.5 text-foreground-subtle">{t("proposal.generateEstimate")}</p>
            </div>
            <div className="flex gap-3">
              <button className="inline-flex items-center gap-2 h-10 px-5 rounded-[var(--radius-pill)] bg-surface text-foreground border border-black/[0.06] text-sm font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] transition-all duration-500 ease-out hover:bg-black/[0.035]">
                <Download className="h-4 w-4" strokeWidth={1.5} />
                {t("proposal.preview")}
              </button>
              <button className="inline-flex items-center gap-2 h-10 px-5 rounded-[var(--radius-pill)] bg-primary text-white text-sm font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] transition-all duration-500 ease-out hover:bg-primary-hover hover:scale-[1.02]">
                <Zap className="h-4 w-4" strokeWidth={1.5} />
                {t("proposal.generate")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
