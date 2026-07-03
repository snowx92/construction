"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle, ArrowLeft, ArrowRight, Archive, RotateCcw,
  Loader2, Pencil, Save, X, FileText, FolderOpen, Tag, Zap, ListChecks, Info,
  MessageSquare, RefreshCw,
} from "lucide-react";
import { useT, useLocale } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import { getProject, reconcileProject } from "@/lib/api/projects";
import { reconcileProposal } from "@/lib/api/proposals";
import { useProjects } from "@/lib/use-projects";
import { showToast } from "@/lib/toast";
import { ApiError } from "@/lib/api/client";
import { STATUS_BADGE, timeAgoFromIso } from "@/lib/project-status";
import { DocumentsTab } from "./documents-tab";
import { PricingTab } from "./pricing-tab";
import { ProposalsTab } from "./proposals-tab";
import { ExportsTab } from "./exports-tab";
import { CopilotTab } from "./copilot-tab";
import { ProjectStepper } from "./project-stepper";
import { OverviewIntelligence } from "./overview-intelligence";
import { cn } from "@/lib/utils";
import type { ContractType, Project, TenderType } from "@/lib/api/types";

type Tab = "overview" | "documents" | "pricing" | "proposals" | "submission" | "copilot";

const TENDER_TYPES: TenderType[] = ["open", "limited", "single_source", "framework", "emergency"];
const CONTRACT_TYPES: ContractType[] = ["lump_sum", "admeasurement", "cost_plus", "turnkey", "framework"];

export function ApiProjectDetail({ projectId }: { projectId: string }) {
  const t = useT();
  const { dir } = useLocale();
  const router = useRouter();
  const { profile } = useAuth();
  const { update, archive, restore } = useProjects();
  const companyId = profile?.activeCompanyId;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);
  const [reconciling, setReconciling] = useState(false);
  const [tab, setTab] = useState<Tab>("overview");

  const [form, setForm] = useState<{
    name: string; client: string; location: string;
    tenderType: TenderType | ""; contractType: ContractType | ""; deadline: string;
  }>({ name: "", client: "", location: "", tenderType: "", contractType: "", deadline: "" });

  const Arrow = dir === "rtl" ? ArrowLeft : ArrowRight;

  useEffect(() => {
    if (!companyId) return;
    setLoading(true);
    setError("");
    getProject(projectId, companyId)
      .then((p) => {
        setProject(p);
        setForm({
          name: p.name,
          client: p.client ?? "",
          location: p.location ?? "",
          tenderType: p.tenderType ?? "",
          contractType: p.contractType ?? "",
          deadline: typeof p.submissionDeadline === "string" ? p.submissionDeadline.slice(0, 16) : "",
        });
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [projectId, companyId]);

  async function handleSave() {
    setSaving(true);
    try {
      await update(projectId, {
        name: form.name.trim(),
        client: form.client.trim() || undefined,
        location: form.location.trim() || undefined,
        tenderType: form.tenderType || undefined,
        contractType: form.contractType || undefined,
        submissionDeadline: form.deadline ? new Date(form.deadline).toISOString() : undefined,
      });
      showToast(t("common.save"), "success");
      // Refetch
      if (companyId) {
        const fresh = await getProject(projectId, companyId);
        setProject(fresh);
      }
      setEditing(false);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Failed", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleReconcile() {
    if (!companyId || !project) return;
    setReconciling(true);
    try {
      const res = await reconcileProject(projectId, companyId);
      if (project.status === "generating_proposal") {
        await reconcileProposal(companyId, projectId).catch(() => { /* optional */ });
      }
      const fresh = await getProject(projectId, companyId);
      setProject(fresh);
      showToast(`Reconciled — status: ${res.status ?? fresh.status}`, "success");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Reconcile failed", "error");
    } finally {
      setReconciling(false);
    }
  }

  const stuckStatuses = new Set(["processing", "needs_review", "pricing", "generating_proposal", "uploading"]);
  const showReconcile = stuckStatuses.has(project?.status ?? "");

  async function handleArchive() {
    if (!project) return;
    setBusy(true);
    try {
      if (project.status === "archived") {
        await restore(projectId);
        showToast(t("common.ready"), "success");
      } else {
        await archive(projectId);
        showToast(t("projects.archived"), "success");
      }
      router.push("/projects");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Failed", "error");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-foreground-subtle" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="mx-auto max-w-[680px] px-8 py-12">
        <Link href="/projects" className="mb-6 inline-flex items-center gap-1 text-xs text-foreground-muted hover:underline">
          <Arrow className="h-3 w-3 rotate-180" /> {t("nav.allProjects")}
        </Link>
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4" />
          <span>{error || "Project not found"}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1000px] px-8 py-10">
      {/* Breadcrumb */}
      <Link href="/projects" className="mb-4 inline-flex items-center gap-1 text-xs text-foreground-muted hover:underline">
        <Arrow className="h-3 w-3 rotate-180" /> {t("nav.allProjects")}
      </Link>

      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {editing ? (
            <input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              className="input text-2xl font-semibold"
            />
          ) : (
            <h1 className="text-3xl font-semibold text-foreground">{project.name}</h1>
          )}
          <div className="mt-2 flex items-center gap-3 text-sm text-foreground-muted">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_BADGE[project.status]}`}>
              {t(`projects.status_${project.status}`)}
            </span>
            <span>·</span>
            <span>{t("projects.updated")} {timeAgoFromIso(project.updatedAt)}</span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {editing ? (
            <>
              <button
                onClick={() => setEditing(false)}
                className="rounded-lg border border-black/[0.08] bg-white px-3 py-2 text-sm hover:bg-black/[0.03]"
              >
                <X className="h-4 w-4" />
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {t("common.save")}
              </button>
            </>
          ) : (
            <>
              {showReconcile && (
                <button
                  onClick={handleReconcile}
                  disabled={reconciling}
                  title="Retry stuck jobs and sync project state"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 hover:bg-amber-100 disabled:opacity-50"
                >
                  {reconciling ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                  Reconcile
                </button>
              )}
              <button
                onClick={() => setEditing(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-black/[0.08] bg-white px-3 py-2 text-sm hover:bg-black/[0.03]"
              >
                <Pencil className="h-3.5 w-3.5" /> {t("common.edit")}
              </button>
              <button
                onClick={handleArchive}
                disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-lg border border-black/[0.08] bg-white px-3 py-2 text-sm hover:bg-black/[0.03] disabled:opacity-50"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : project.status === "archived" ? <RotateCcw className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
                {project.status === "archived" ? t("projects.restore") : t("projects.archive")}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Guided progress stepper */}
      <ProjectStepper
        projectId={projectId}
        activeTab={tab}
        onNavigate={(t) => setTab(t)}
      />

      {/* Tab strip */}
      <div className="mb-6 flex gap-1 border-b border-black/[0.06]">
        {([
          { key: "overview",   label: t("project.tabs.overview"),   icon: FileText,   phase: null },
          { key: "documents",  label: t("documents.title"),         icon: FolderOpen, phase: null },
          { key: "pricing",    label: t("project.tabs.pricing"),    icon: Tag,        phase: null },
          { key: "proposals",  label: t("project.tabs.proposals"),  icon: Zap,        phase: null },
          { key: "submission", label: t("exportsTab.title"),         icon: ListChecks, phase: null },
          { key: "copilot",    label: t("copilotTab.title"),         icon: MessageSquare, phase: null },
        ] as { key: Tab; label: string; icon: typeof FileText; phase: string | null }[]).map(({ key, label, icon: Icon, phase }) => {
          const active = tab === key;
          return (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                "relative flex items-center gap-1.5 px-4 py-3 text-sm font-medium transition-colors",
                active ? "text-primary" : "text-foreground-muted hover:text-foreground"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
              {phase && (
                <span className="ml-1 rounded-full bg-amber-50 px-1.5 py-0.5 text-[9px] font-medium text-amber-700">
                  {phase}
                </span>
              )}
              {active && <span className="absolute inset-x-0 -bottom-px h-0.5 bg-primary" />}
            </button>
          );
        })}
      </div>

      {tab === "documents"  && <DocumentsTab projectId={projectId} />}
      {tab === "pricing"    && <PricingTab   projectId={projectId} />}
      {tab === "proposals"  && <ProposalsTab projectId={projectId} />}
      {tab === "submission" && <ExportsTab   projectId={projectId} />}
      {tab === "copilot"    && <CopilotTab   projectId={projectId} />}

      {tab === "overview" && (
      <>
      {companyId && <OverviewIntelligence projectId={projectId} companyId={companyId} />}
      {/* Metadata card */}
      <div className="card p-6 mb-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={t("newProject.client")}>
            {editing ? (
              <input
                value={form.client}
                onChange={(e) => setForm((p) => ({ ...p, client: e.target.value }))}
                className="input"
              />
            ) : (
              <p className="text-sm text-foreground">{project.client || "—"}</p>
            )}
          </Field>
          <Field label={t("projects.fieldLocation")}>
            {editing ? (
              <input
                value={form.location}
                onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
                className="input"
              />
            ) : (
              <p className="text-sm text-foreground">{project.location || "—"}</p>
            )}
          </Field>
          <Field label={t("projects.fieldTenderType")}>
            {editing ? (
              <select
                value={form.tenderType}
                onChange={(e) => setForm((p) => ({ ...p, tenderType: e.target.value as TenderType | "" }))}
                className="input bg-transparent"
              >
                <option value="">—</option>
                {TENDER_TYPES.map((tt) => (
                  <option key={tt} value={tt}>{t(`projects.tender_${tt}`)}</option>
                ))}
              </select>
            ) : (
              <p className="text-sm text-foreground">
                {project.tenderType ? t(`projects.tender_${project.tenderType}`) : "—"}
              </p>
            )}
          </Field>
          <Field label={t("projects.fieldContractType")}>
            {editing ? (
              <select
                value={form.contractType}
                onChange={(e) => setForm((p) => ({ ...p, contractType: e.target.value as ContractType | "" }))}
                className="input bg-transparent"
              >
                <option value="">—</option>
                {CONTRACT_TYPES.map((ct) => (
                  <option key={ct} value={ct}>{t(`projects.contract_${ct}`)}</option>
                ))}
              </select>
            ) : (
              <p className="text-sm text-foreground">
                {project.contractType ? t(`projects.contract_${project.contractType}`) : "—"}
              </p>
            )}
          </Field>
          <Field label={t("projects.fieldDeadline")}>
            {editing ? (
              <input
                type="datetime-local"
                value={form.deadline}
                onChange={(e) => setForm((p) => ({ ...p, deadline: e.target.value }))}
                className="input"
              />
            ) : (
              <p className="text-sm text-foreground">
                {typeof project.submissionDeadline === "string"
                  ? new Date(project.submissionDeadline).toLocaleString()
                  : "—"}
              </p>
            )}
          </Field>
          <Field label={t("projects.fieldDisciplines")}>
            <div className="flex flex-wrap gap-1.5">
              {(project.disciplines || []).map((d) => (
                <span key={d} className="rounded-full bg-primary-soft px-2 py-0.5 text-[10px] font-medium text-primary capitalize">
                  {d.replace("_", " ")}
                </span>
              ))}
              {(!project.disciplines || project.disciplines.length === 0) && (
                <span className="text-sm text-foreground-subtle">—</span>
              )}
            </div>
          </Field>
        </div>
      </div>

      </>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium uppercase tracking-widest text-foreground-subtle">{label}</p>
      {children}
    </div>
  );
}
