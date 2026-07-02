"use client";

import { CheckCircle2, Circle, Loader2, ArrowRight, ArrowLeft, FolderOpen, Tag, Zap, ListChecks } from "lucide-react";
import { useT, useLocale } from "@/lib/i18n";
import { useDocuments } from "@/lib/use-documents";
import { usePricingRuns } from "@/lib/use-pricing";
import { useProposals } from "@/lib/use-proposals";
import { useExports } from "@/lib/use-exports";
import { cn } from "@/lib/utils";

type StepState = "todo" | "in_progress" | "done";

interface Step {
  key: "documents" | "pricing" | "proposals" | "submission";
  labelKey: string;
  hintKey: string;
  icon: typeof FolderOpen;
  state: StepState;
  countLabel?: string;
}

interface Props {
  projectId: string;
  activeTab: string;
  onNavigate: (tab: "documents" | "pricing" | "proposals" | "submission") => void;
}

export function ProjectStepper({ projectId, activeTab, onNavigate }: Props) {
  const t = useT();
  const { dir } = useLocale();
  const { documents } = useDocuments(projectId);
  const { runs }      = usePricingRuns(projectId);
  const { proposals } = useProposals(projectId);
  const { exports }   = useExports(projectId);

  const Arrow = dir === "rtl" ? ArrowLeft : ArrowRight;

  // Step 1 — Documents
  const readyDocs = documents.filter((d) => d.status === "ready" || d.currentStep === "document_ready");
  const processingDocs = documents.filter((d) => {
    const s = d.status;
    return s === "pending" || s === "uploaded" || s === "processing";
  });
  const docsState: StepState =
    documents.length === 0 ? "todo"
    : readyDocs.length === documents.length ? "done"
    : "in_progress";

  // Step 2 — Pricing
  const lockedRuns = runs.filter((r) => r.status === "locked");
  const inFlightRuns = runs.filter((r) => r.status === "estimating" || r.status === "review" || r.status === "draft");
  const pricingState: StepState =
    docsState !== "done" ? "todo"
    : lockedRuns.length > 0 ? "done"
    : inFlightRuns.length > 0 ? "in_progress"
    : "todo";

  // Step 3 — Proposal
  const lockedProposals = proposals.filter((p) => p.status === "locked");
  const inFlightProposals = proposals.filter((p) =>
    p.status === "draft" || p.status === "generating" || p.status === "review" || p.status === "approved"
  );
  const proposalsState: StepState =
    pricingState !== "done" ? "todo"
    : lockedProposals.length > 0 ? "done"
    : inFlightProposals.length > 0 ? "in_progress"
    : "todo";

  // Step 4 — Submission
  const readyExports = exports.filter((e) => e.status === "ready");
  const inFlightExports = exports.filter((e) => e.status === "queued" || e.status === "processing");
  const submissionState: StepState =
    proposalsState !== "done" ? "todo"
    : readyExports.length > 0 ? "done"
    : inFlightExports.length > 0 ? "in_progress"
    : "todo";

  const steps: Step[] = [
    {
      key: "documents",
      labelKey: "stepper.docs",
      hintKey: docsState === "done"
        ? "stepper.docsDone"
        : docsState === "in_progress"
          ? "stepper.docsProcessing"
          : "stepper.docsTodo",
      icon: FolderOpen,
      state: docsState,
      countLabel: documents.length > 0 ? `${readyDocs.length}/${documents.length}` : undefined,
    },
    {
      key: "pricing",
      labelKey: "stepper.pricing",
      hintKey: pricingState === "done"
        ? "stepper.pricingDone"
        : pricingState === "in_progress"
          ? "stepper.pricingInProgress"
          : docsState === "done" ? "stepper.pricingTodo" : "stepper.pricingWaiting",
      icon: Tag,
      state: pricingState,
    },
    {
      key: "proposals",
      labelKey: "stepper.proposal",
      hintKey: proposalsState === "done"
        ? "stepper.proposalDone"
        : proposalsState === "in_progress"
          ? "stepper.proposalInProgress"
          : pricingState === "done" ? "stepper.proposalTodo" : "stepper.proposalWaiting",
      icon: Zap,
      state: proposalsState,
    },
    {
      key: "submission",
      labelKey: "stepper.submission",
      hintKey: submissionState === "done"
        ? "stepper.submissionDone"
        : submissionState === "in_progress"
          ? "stepper.submissionInProgress"
          : proposalsState === "done" ? "stepper.submissionTodo" : "stepper.submissionWaiting",
      icon: ListChecks,
      state: submissionState,
    },
  ];

  // First non-"done" step is the next action; if all done, no CTA.
  const nextStep = steps.find((s) => s.state !== "done");
  const isOnNextStep = nextStep && activeTab === nextStep.key;
  const allDone = !nextStep;

  return (
    <div className="mb-6 rounded-2xl border border-black/[0.06] bg-card p-4">
      {/* Steps row */}
      <div className="flex items-center gap-2 overflow-x-auto">
        {steps.map((step, i) => {
          const isActive = activeTab === step.key;
          const Icon = step.icon;
          const stateIcon =
            step.state === "done" ? CheckCircle2
            : step.state === "in_progress" ? Loader2
            : Circle;
          const stateColor =
            step.state === "done" ? "text-emerald-600"
            : step.state === "in_progress" ? "text-primary"
            : "text-foreground-subtle";
          const bgColor =
            step.state === "done" ? "bg-emerald-50"
            : step.state === "in_progress" ? "bg-primary-soft"
            : "bg-surface-2";

          return (
            <div key={step.key} className="flex items-center gap-2 min-w-0 shrink-0">
              <button
                onClick={() => onNavigate(step.key)}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl border px-3 py-2 transition-all",
                  isActive
                    ? "border-primary bg-primary-soft shadow-sm"
                    : "border-black/[0.06] bg-card hover:border-black/[0.12]"
                )}
              >
                <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full", bgColor)}>
                  {step.state === "in_progress" ? (
                    <Loader2 className={cn("h-3.5 w-3.5 animate-spin", stateColor)} />
                  ) : (
                    <Icon className={cn("h-3.5 w-3.5", stateColor)} strokeWidth={1.5} />
                  )}
                </div>
                <div className="min-w-0 text-left">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-semibold text-foreground truncate">
                      {t(step.labelKey)}
                    </p>
                    {step.countLabel && (
                      <span className="rounded-full bg-black/[0.06] px-1.5 py-0.5 text-[9px] font-medium text-foreground-subtle">
                        {step.countLabel}
                      </span>
                    )}
                    <span
                      className={cn(
                        "flex h-3.5 w-3.5 items-center justify-center",
                        stateColor
                      )}
                    >
                      {step.state === "done" && <CheckCircle2 className="h-3.5 w-3.5" />}
                    </span>
                  </div>
                  <p className="text-[10px] text-foreground-subtle truncate max-w-[180px]">
                    {t(step.hintKey)}
                  </p>
                </div>
              </button>

              {i < steps.length - 1 && (
                <Arrow className="h-3.5 w-3.5 shrink-0 text-foreground-subtle/50" />
              )}
            </div>
          );
        })}
      </div>

      {/* Do this next CTA */}
      {!allDone && nextStep && !isOnNextStep && (
        <div className="mt-3 flex items-center justify-between rounded-xl bg-primary-soft px-4 py-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <p className="text-xs font-medium text-primary truncate">
              <span className="opacity-70">{t("stepper.doNext")}:</span>{" "}
              {t(nextStep.hintKey)}
            </p>
          </div>
          <button
            onClick={() => onNavigate(nextStep.key)}
            className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-hover"
          >
            {t(`stepper.goto_${nextStep.key}`)}
            <Arrow className="h-3 w-3" />
          </button>
        </div>
      )}

      {allDone && (
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2.5">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-700" />
          <p className="text-xs font-medium text-emerald-800">
            {t("stepper.allDone")}
          </p>
        </div>
      )}
    </div>
  );
}
