"use client";

import { useState, useEffect } from "react";
import {
  Loader2, AlertCircle, Plus, X, Lock, CheckCircle2, ChevronRight, ArrowLeft,
  RefreshCw, FileText, ShieldCheck, Calendar, Pencil, Trash2,
} from "lucide-react";
import { useT, useLocale } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import { useIsOneOf } from "@/lib/use-role";
import { showToast } from "@/lib/toast";
import { ApiError } from "@/lib/api/client";
import {
  approveProposal, deleteProposal, generateComplianceChecklist, generateProposal, generateSchedule,
  lockProposal, regenerateSection, updateProposal, updateProposalSection,
} from "@/lib/api/proposals";
import { useProposal, useProposals, useProposalSections } from "@/lib/use-proposals";
import { usePricingRuns } from "@/lib/use-pricing";
import { formatPricingTotal } from "@/lib/pricing-helpers";
import { useJob } from "@/lib/use-job";
import { CommercialArtifactsPanel } from "./commercial-artifacts";
import { proposalSectionText, truncateProposalSectionText } from "@/lib/proposal-section-content";
import { sectionStatusLabelKey } from "@/lib/normalize-status";
import { timeAgoFromIso } from "@/lib/project-status";
import type { Proposal, ProposalSection, ProposalSectionKey, ProposalStatus } from "@/lib/api/types";

const STATUS_BADGE: Record<ProposalStatus, string> = {
  draft:      "bg-foreground-subtle/10 text-foreground-muted",
  generating: "bg-primary-soft text-primary",
  review:     "bg-amber-50 text-amber-700",
  approved:   "bg-blue-50 text-blue-700",
  exported:   "bg-purple-50 text-purple-700",
  locked:     "bg-emerald-50 text-emerald-700",
};

const KNOWN_SECTION_KEYS: ProposalSectionKey[] = [
  "executive_summary", "methodology", "pricing", "schedule", "compliance", "team",
];

export function ProposalsTab({ projectId }: { projectId: string }) {
  const t = useT();
  const { profile } = useAuth();
  const companyId = profile?.activeCompanyId;
  const canDelete = useIsOneOf("tender_manager", "admin", "company_owner");
  const { proposals, loading, error } = useProposals(projectId);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showGen, setShowGen]   = useState(false);
  const [genComp, setGenComp]   = useState(false);
  const [genSched, setGenSched] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [compJobId, setCompJobId] = useState<string | null>(null);
  const [schedJobId, setSchedJobId] = useState<string | null>(null);
  const [artifactsRefresh, setArtifactsRefresh] = useState(0);

  const { job: compJob } = useJob(compJobId, projectId);
  const { job: schedJob } = useJob(schedJobId, projectId);

  useEffect(() => {
    if (compJob?.status === "completed") {
      setCompJobId(null);
      setArtifactsRefresh((n) => n + 1);
    }
  }, [compJob?.status]);

  useEffect(() => {
    if (schedJob?.status === "completed") {
      setSchedJobId(null);
      setArtifactsRefresh((n) => n + 1);
    }
  }, [schedJob?.status]);

  async function handleDeleteProposal(proposal: Proposal, e?: React.MouseEvent) {
    e?.stopPropagation();
    if (!companyId) return;
    if (proposal.status === "generating") {
      showToast(t("proposalsTab.cannotDeleteWhileProcessing"), "error");
      return;
    }
    if (!confirm(t("proposalsTab.deleteConfirm"))) return;
    setDeletingId(proposal.proposalId);
    try {
      await deleteProposal(proposal.proposalId, { companyId, projectId });
      showToast(t("proposalsTab.deleted"), "success");
      if (activeId === proposal.proposalId) setActiveId(null);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Delete failed", "error");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleGenCompliance() {
    if (!companyId) return;
    setGenComp(true);
    try {
      const res = await generateComplianceChecklist({ companyId, projectId });
      if (res.jobId) setCompJobId(res.jobId);
      setArtifactsRefresh((n) => n + 1);
      showToast(t("proposalsCommercial.queued"), "success");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Failed", "error");
    } finally { setGenComp(false); }
  }

  async function handleGenSchedule() {
    if (!companyId) return;
    setGenSched(true);
    try {
      const res = await generateSchedule({ companyId, projectId });
      if (res.jobId) setSchedJobId(res.jobId);
      setArtifactsRefresh((n) => n + 1);
      showToast(t("proposalsCommercial.queued"), "success");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Failed", "error");
    } finally { setGenSched(false); }
  }

  if (activeId) {
    return (
      <ProposalDetail
        projectId={projectId}
        proposalId={activeId}
        onBack={() => setActiveId(null)}
        onDelete={(p) => handleDeleteProposal(p)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">{t("proposalsTab.title")}</h2>
          <p className="mt-0.5 text-xs text-foreground-subtle">{t("proposalsTab.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleGenCompliance}
            disabled={genComp}
            title={t("proposalsCommercial.compliance")}
            className="inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] border border-black/[0.08] bg-white px-3 py-2 text-xs font-medium hover:bg-black/[0.03] disabled:opacity-50"
          >
            {genComp ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
            {t("proposalsCommercial.compliance")}
          </button>
          <button
            onClick={handleGenSchedule}
            disabled={genSched}
            title={t("proposalsCommercial.schedule")}
            className="inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] border border-black/[0.08] bg-white px-3 py-2 text-xs font-medium hover:bg-black/[0.03] disabled:opacity-50"
          >
            {genSched ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Calendar className="h-3.5 w-3.5" />}
            {t("proposalsCommercial.schedule")}
          </button>
          <button
            onClick={() => setShowGen(true)}
            className="inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] bg-primary px-4 py-2 text-xs font-medium text-white hover:bg-primary-hover"
          >
            <Plus className="h-3.5 w-3.5" /> {t("proposalsTab.generateCta")}
          </button>
        </div>
      </div>

      {companyId && (
        <CommercialArtifactsPanel
          projectId={projectId}
          companyId={companyId}
          refreshKey={artifactsRefresh}
        />
      )}

      {loading ? (
        <div className="flex h-24 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-foreground-subtle" />
        </div>
      ) : error ? (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4" /> <span>{error}</span>
        </div>
      ) : proposals.length === 0 ? (
        <p className="py-8 text-center text-sm text-foreground-subtle">{t("proposalsTab.noProposals")}</p>
      ) : (
        <div className="space-y-2">
          {proposals.map((p) => (
            <div
              key={p.proposalId}
              role="button"
              tabIndex={0}
              onClick={() => setActiveId(p.proposalId)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setActiveId(p.proposalId); }}
              className="flex w-full cursor-pointer items-center gap-4 rounded-xl border border-black/[0.06] bg-card px-4 py-3 text-left transition-colors hover:bg-black/[0.02]"
            >
              <FileText className="h-4 w-4 shrink-0 text-foreground-subtle" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium text-foreground">
                    {p.title || p.proposalId.slice(0, 12)}
                  </p>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_BADGE[p.status]}`}>
                    {t(`proposalsTab.status_${p.status}`)}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-foreground-subtle">{timeAgoFromIso(p.createdAt)}</p>
              </div>
              {canDelete && (
                <button
                  type="button"
                  onClick={(e) => handleDeleteProposal(p, e)}
                  disabled={deletingId === p.proposalId || p.status === "generating"}
                  title={p.status === "generating" ? t("proposalsTab.cannotDeleteWhileProcessing") : t("proposalsTab.delete")}
                  className="rounded-md p-1.5 text-foreground-subtle hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                >
                  {deletingId === p.proposalId
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <Trash2 className="h-3.5 w-3.5" />}
                </button>
              )}
              <ChevronRight className="h-4 w-4 shrink-0 text-foreground-subtle" />
            </div>
          ))}
        </div>
      )}

      {showGen && (
        <GenerateModal
          projectId={projectId}
          onClose={() => setShowGen(false)}
          onGenerated={(id) => { setShowGen(false); setActiveId(id); }}
        />
      )}
    </div>
  );
}

function GenerateModal({
  projectId, onClose, onGenerated,
}: { projectId: string; onClose: () => void; onGenerated: (id: string) => void }) {
  const t = useT();
  const { profile } = useAuth();
  const companyId = profile?.activeCompanyId;
  const { runs } = usePricingRuns(projectId);

  const lockedRuns = runs.filter((r) => r.status === "locked");
  const defaultRun = lockedRuns[0]?.pricingRunId ?? "";

  const [title, setTitle]         = useState("");
  const [pricingRunId, setPRun]   = useState<string>(defaultRun);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]         = useState("");
  const [genJobId, setGenJobId]   = useState<string | null>(null);
  useJob(genJobId, projectId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!companyId) return;
    setError("");
    setSubmitting(true);
    try {
      const res = await generateProposal({
        companyId,
        projectId,
        title: title.trim() || undefined,
        pricingRunId: pricingRunId || undefined,
      });
      if (res.jobId) setGenJobId(res.jobId);
      onGenerated(res.proposalId);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to start");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between">
          <h3 className="text-base font-semibold text-foreground">{t("proposalsTab.generateCta")}</h3>
          <button onClick={onClose} className="rounded-md p-1 text-foreground-subtle hover:bg-black/[0.05]">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground-muted">{t("proposalsTab.proposalTitle")}</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("proposalsTab.proposalTitlePh")}
              className="w-full rounded-xl border border-black/[0.08] bg-white px-3 py-2 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground-muted">{t("proposalsTab.pricingRun")}</label>
            {runs.length === 0 ? (
              <p className="text-xs text-foreground-subtle">{t("proposalsTab.pricingRunNone")}</p>
            ) : (
              <select
                value={pricingRunId}
                onChange={(e) => setPRun(e.target.value)}
                className="w-full rounded-xl border border-black/[0.08] bg-white px-3 py-2 text-sm"
              >
                <option value="">{t("proposalsTab.pricingRunLatest")}</option>
                {runs.map((r) => (
                  <option key={r.pricingRunId} value={r.pricingRunId}>
                    {r.pricingRunId.slice(0, 8)} · {r.status}
                    {formatPricingTotal(r) ? ` · ${formatPricingTotal(r)}` : ""}
                  </option>
                ))}
              </select>
            )}
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4" /> <span>{error}</span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="rounded-lg border border-black/[0.08] bg-white px-3 py-2 text-sm hover:bg-black/[0.03]">
              {t("proposalsTab.cancel")}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {t("proposalsTab.generate")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ProposalDetail({
  projectId, proposalId, onBack, onDelete,
}: { projectId: string; proposalId: string; onBack: () => void; onDelete: (p: Proposal) => void }) {
  const t = useT();
  const { dir } = useLocale();
  const { profile } = useAuth();
  const companyId = profile?.activeCompanyId;
  const canApprove = useIsOneOf("tender_manager", "legal", "admin", "company_owner");
  const canLock    = useIsOneOf("legal", "admin", "company_owner");
  const canDelete  = useIsOneOf("tender_manager", "admin", "company_owner");

  const proposal = useProposal(projectId, proposalId);
  const { sections, loading } = useProposalSections(projectId, proposalId);

  const [approving, setApproving] = useState(false);
  const [locking, setLocking]     = useState(false);
  const [deleting, setDeleting]   = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [savingTitle, setSavingTitle] = useState(false);
  const canEdit = useIsOneOf("tender_manager", "estimator", "finance", "admin", "company_owner");

  const BackArrow = dir === "rtl" ? ChevronRight : ArrowLeft;
  const status = proposal?.status;
  const locked   = status === "locked";
  const approved = status === "approved" || status === "exported" || status === "locked";

  async function handleSaveTitle() {
    if (!companyId || !titleDraft.trim()) return;
    setSavingTitle(true);
    try {
      await updateProposal(proposalId, { companyId, projectId, title: titleDraft.trim() });
      showToast(t("proposalsTab.saveTitle"), "success");
      setEditingTitle(false);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Failed", "error");
    } finally {
      setSavingTitle(false);
    }
  }

  async function handleApprove() {
    if (!companyId) return;
    setApproving(true);
    try {
      await approveProposal(proposalId, { companyId, projectId });
      showToast(t("proposalsTab.approving"), "success");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Failed", "error");
    } finally {
      setApproving(false);
    }
  }

  async function handleLock() {
    if (!companyId) return;
    if (!confirm(t("proposalsTab.lockConfirm"))) return;
    setLocking(true);
    try {
      await lockProposal(proposalId, { companyId, projectId });
      showToast(t("proposalsTab.locking"), "success");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Failed", "error");
    } finally {
      setLocking(false);
    }
  }

  async function handleDelete() {
    if (!proposal) return;
    setDeleting(true);
    try {
      await onDelete(proposal);
      onBack();
    } finally {
      setDeleting(false);
    }
  }

  // Build display sections: prefer real, fall back to known keys with "pending"
  const displaySections: ProposalSection[] = (() => {
    if (sections.length > 0) return sections;
    return KNOWN_SECTION_KEYS.map((k) => ({
      sectionId: k,
      sectionKey: k,
      status: "pending" as const,
    }));
  })();

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="inline-flex items-center gap-1 text-xs text-foreground-muted hover:underline">
          <BackArrow className="h-3 w-3" /> {t("proposalsTab.title")}
        </button>
        <div className="flex items-center gap-2">
          {status && (
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_BADGE[status]}`}>
              {t(`proposalsTab.status_${status}`)}
            </span>
          )}
          {canDelete && proposal && proposal.status !== "generating" && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              title={t("proposalsTab.delete")}
              className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2 py-1 text-[10px] font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              {deleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
              {t("proposalsTab.delete")}
            </button>
          )}
        </div>
      </div>

      {proposal && (
        <div>
          {editingTitle && canEdit && !locked ? (
            <div className="flex items-center gap-2">
              <input
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                className="input flex-1 text-xl font-semibold"
              />
              <button
                onClick={handleSaveTitle}
                disabled={savingTitle}
                className="rounded-lg bg-primary px-3 py-2 text-xs font-medium text-white disabled:opacity-50"
              >
                {savingTitle ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : t("common.save")}
              </button>
              <button
                onClick={() => setEditingTitle(false)}
                className="rounded-lg border border-black/[0.08] px-3 py-2 text-xs"
              >
                {t("common.cancel")}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold text-foreground">{proposal.title || proposal.proposalId}</h2>
              {canEdit && !locked && (
                <button
                  onClick={() => { setTitleDraft(proposal.title || ""); setEditingTitle(true); }}
                  className="rounded p-1 text-foreground-subtle hover:bg-black/[0.04]"
                  title={t("proposalsTab.editTitle")}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}
          {proposal.pricingRunId && (
            <p className="mt-0.5 text-xs text-foreground-subtle">
              {t("proposalsTab.pricingRun")}: {proposal.pricingRunId.slice(0, 12)}
            </p>
          )}
        </div>
      )}

      {/* Banners */}
      {locked && (
        <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <Lock className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{t("proposalsTab.lockedHint")}</span>
        </div>
      )}
      {approved && !locked && (
        <div className="flex items-start gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{t("proposalsTab.approvedHint", { by: proposal?.approvedBy?.slice(0, 8) ?? "—" })}</span>
        </div>
      )}

      {/* Sections */}
      {loading ? (
        <div className="flex h-24 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-foreground-subtle" />
        </div>
      ) : (
        <div className="space-y-3">
          {displaySections.map((s) => (
            <SectionCard
              key={s.sectionId}
              section={s}
              projectId={projectId}
              proposalId={proposalId}
              locked={locked}
            />
          ))}
        </div>
      )}

      {/* Approve / Lock actions */}
      {!locked && (
        <div className="rounded-2xl border border-black/[0.06] bg-card p-5">
          {!approved ? (
            <button
              onClick={handleApprove}
              disabled={!canApprove || approving}
              title={!canApprove ? t("proposalsTab.noPermApprove") : undefined}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-50"
            >
              {approving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              {approving ? t("proposalsTab.approving") : t("proposalsTab.approveCta")}
            </button>
          ) : (
            <button
              onClick={handleLock}
              disabled={!canLock || locking}
              title={!canLock ? t("proposalsTab.noPermLock") : undefined}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {locking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
              {locking ? t("proposalsTab.locking") : t("proposalsTab.lockCta")}
            </button>
          )}
          {!approved && !canApprove && (
            <p className="mt-2 text-center text-xs text-foreground-subtle">{t("proposalsTab.noPermApprove")}</p>
          )}
          {approved && !canLock && (
            <p className="mt-2 text-center text-xs text-foreground-subtle">{t("proposalsTab.noPermLock")}</p>
          )}
        </div>
      )}
    </div>
  );
}

function SectionCard({
  section, projectId, proposalId, locked,
}: {
  section: ProposalSection;
  projectId: string;
  proposalId: string;
  locked: boolean;
}) {
  const t = useT();
  const { profile } = useAuth();
  const companyId = profile?.activeCompanyId;
  const canEdit = useIsOneOf("tender_manager", "estimator", "finance", "admin", "company_owner") && !locked;
  const canRegenerate = canEdit;
  const [regenerating, setRegenerating] = useState(false);
  const [regenJobId, setRegenJobId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  useJob(regenJobId, projectId);

  const key = section.sectionKey;
  const titleKey = key && `proposalsTab.section_${key}`;
  const displayTitle = section.title || (titleKey ? t(titleKey) : section.sectionId);
  const status = section.status ?? "pending";

  const rawContent = section.content ?? section.body ?? "";
  const readableContent = proposalSectionText(rawContent, key);
  const [titleDraft, setTitleDraft] = useState(displayTitle);
  const [contentDraft, setContentDraft] = useState(readableContent);

  async function handleRegen() {
    if (!companyId) return;
    setRegenerating(true);
    try {
      const res = await regenerateSection(proposalId, {
        companyId,
        projectId,
        sectionId: section.sectionId.length > 8 ? section.sectionId : undefined,
        sectionKey: KNOWN_SECTION_KEYS.includes(key as ProposalSectionKey) ? (key as ProposalSectionKey) : undefined,
      });
      if (res.jobId) setRegenJobId(res.jobId);
      showToast(t("proposalsTab.regenerating"), "success");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Failed", "error");
    } finally {
      setRegenerating(false);
    }
  }

  async function handleSave() {
    if (!companyId || section.sectionId.length < 8) return;
    setSaving(true);
    try {
      await updateProposalSection(proposalId, section.sectionId, {
        companyId,
        projectId,
        title: titleDraft,
        content: contentDraft,
      });
      showToast(t("proposalsTab.saveSection"), "success");
      setEditing(false);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Failed", "error");
    } finally {
      setSaving(false);
    }
  }

  const labelStatus = sectionStatusLabelKey(status);
  const statusBadge = {
    pending:    "bg-foreground-subtle/10 text-foreground-subtle",
    generating: "bg-primary-soft text-primary",
    ready:      "bg-emerald-50 text-emerald-700",
    complete:   "bg-emerald-50 text-emerald-700",
    failed:     "bg-red-50 text-red-700",
  }[labelStatus] ?? "bg-foreground-subtle/10 text-foreground-subtle";

  return (
    <div className="rounded-xl border border-black/[0.06] bg-card p-4">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {editing ? (
            <input
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              className="input flex-1 text-sm font-medium"
            />
          ) : (
            <p className="text-sm font-medium text-foreground">{displayTitle}</p>
          )}
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusBadge}`}>
            {t(`proposalsTab.sectionStatus_${labelStatus}`)}
          </span>
          {section.wordCount && !editing && (
            <span className="text-[10px] text-foreground-subtle">
              {t("proposalsTab.words", { count: section.wordCount })}
            </span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {canEdit && status !== "generating" && (
            <button
              onClick={() => {
                if (editing) {
                  setEditing(false);
                  setTitleDraft(displayTitle);
                  setContentDraft(readableContent);
                } else {
                  setTitleDraft(displayTitle);
                  setContentDraft(readableContent);
                  setEditing(true);
                }
              }}
              className="inline-flex items-center gap-1 rounded-md border border-black/[0.08] bg-white px-2 py-1 text-[10px] font-medium text-foreground-muted hover:bg-black/[0.03]"
            >
              <Pencil className="h-3 w-3" />
              {editing ? t("common.cancel") : t("proposalsTab.editSection")}
            </button>
          )}
          {!locked && status !== "generating" && (
            <button
              onClick={handleRegen}
              disabled={!canRegenerate || regenerating}
              title={!canRegenerate ? t("proposalsTab.noPermApprove") : undefined}
              className="inline-flex items-center gap-1 rounded-md border border-black/[0.08] bg-white px-2 py-1 text-[10px] font-medium text-foreground-muted hover:bg-black/[0.03] disabled:opacity-50"
            >
              {regenerating ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
              {t("proposalsTab.regenerate")}
            </button>
          )}
        </div>
      </div>
      {editing ? (
        <div className="space-y-2">
          <textarea
            value={contentDraft}
            onChange={(e) => setContentDraft(e.target.value)}
            rows={12}
            className="w-full rounded-lg border border-black/[0.08] bg-white px-3 py-2 text-sm leading-relaxed"
          />
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            {t("proposalsTab.saveSection")}
          </button>
        </div>
      ) : readableContent ? (
        <p className="whitespace-pre-wrap text-sm text-foreground-muted leading-relaxed">
          {truncateProposalSectionText(readableContent, 1200)}
        </p>
      ) : null}
    </div>
  );
}
