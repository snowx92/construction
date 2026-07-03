"use client";

import { useState, useEffect } from "react";
import {
  Loader2, AlertCircle, Plus, X, Lock, CheckCircle2, ChevronRight, ArrowLeft, ChevronDown, Trash2,
} from "lucide-react";
import { useT, useLocale } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import { useIsOneOf } from "@/lib/use-role";
import { showToast } from "@/lib/toast";
import { ApiError } from "@/lib/api/client";
import { approvePricingRun, deletePricingRun, listPricingHistory, startPricingRun, updatePricingLineItem, updatePricingRun } from "@/lib/api/pricing";
import { usePricingItems, usePricingRun, usePricingRuns } from "@/lib/use-pricing";
import { formatPricingTotal, pricingCurrency, pricingGrandTotal, pricingMarginAmount } from "@/lib/pricing-helpers";
import { timeAgoFromIso } from "@/lib/project-status";
import type { PricingLineItem, PricingRun, PricingRunStatus, PricingRunType } from "@/lib/api/types";

const STATUS_BADGE: Record<PricingRunStatus, string> = {
  estimating: "bg-primary-soft text-primary",
  review:     "bg-amber-50 text-amber-700",
  draft:      "bg-foreground-subtle/10 text-foreground-muted",
  locked:     "bg-emerald-50 text-emerald-700",
};

export function PricingTab({ projectId }: { projectId: string }) {
  const t = useT();
  const { profile } = useAuth();
  const companyId = profile?.activeCompanyId;
  const canManage = useIsOneOf("estimator", "finance", "tender_manager", "admin", "company_owner");
  const { runs, loading, error } = usePricingRuns(projectId);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [showStart, setShowStart] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [history, setHistory] = useState<PricingRun[]>([]);

  useEffect(() => {
    if (!companyId) return;
    listPricingHistory(companyId, projectId)
      .then(setHistory)
      .catch(() => setHistory([]));
  }, [companyId, projectId, runs.length]);

  async function handleDeleteRun(run: PricingRun, e?: React.MouseEvent) {
    e?.stopPropagation();
    if (!companyId) return;
    if (run.status === "estimating") {
      showToast(t("pricingTab.cannotDeleteWhileProcessing"), "error");
      return;
    }
    if (!confirm(t("pricingTab.deleteConfirm"))) return;
    setDeletingId(run.pricingRunId);
    try {
      await deletePricingRun(run.pricingRunId, { companyId, projectId });
      showToast(t("pricingTab.deleted"), "success");
      if (activeRunId === run.pricingRunId) setActiveRunId(null);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Delete failed", "error");
    } finally {
      setDeletingId(null);
    }
  }

  if (activeRunId) {
    return (
      <RunDetail
        projectId={projectId}
        pricingRunId={activeRunId}
        onBack={() => setActiveRunId(null)}
        onDelete={(run) => handleDeleteRun(run)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">{t("pricingTab.title")}</h2>
          <p className="mt-0.5 text-xs text-foreground-subtle">{t("pricingTab.subtitle")}</p>
        </div>
        <button
          onClick={() => setShowStart(true)}
          className="inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] bg-primary px-4 py-2 text-xs font-medium text-white hover:bg-primary-hover"
        >
          <Plus className="h-3.5 w-3.5" /> {t("pricingTab.startCta")}
        </button>
      </div>

      {loading ? (
        <div className="flex h-24 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-foreground-subtle" />
        </div>
      ) : error ? (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4" /> <span>{error}</span>
        </div>
      ) : runs.length === 0 ? (
        <p className="py-8 text-center text-sm text-foreground-subtle">{t("pricingTab.noRuns")}</p>
      ) : (
        <div className="space-y-2">
          {runs.map((r) => {
            const totalLabel = formatPricingTotal(r);
            return (
            <div
              key={r.pricingRunId}
              role="button"
              tabIndex={0}
              onClick={() => setActiveRunId(r.pricingRunId)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setActiveRunId(r.pricingRunId); }}
              className="flex w-full cursor-pointer items-center gap-4 rounded-xl border border-black/[0.06] bg-card px-4 py-3 text-left transition-colors hover:bg-black/[0.02]"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground">
                    {r.runType ? t(`pricingTab.type_${r.runType}`) : "—"}
                  </p>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_BADGE[r.status]}`}>
                    {t(`pricingTab.status_${r.status}`)}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-foreground-subtle">
                  {timeAgoFromIso(r.createdAt)}
                  {totalLabel && <> · {totalLabel}</>}
                </p>
              </div>
              {canManage && (
                <button
                  type="button"
                  onClick={(e) => handleDeleteRun(r, e)}
                  disabled={deletingId === r.pricingRunId || r.status === "estimating"}
                  title={r.status === "estimating" ? t("pricingTab.cannotDeleteWhileProcessing") : t("pricingTab.delete")}
                  className="rounded-md p-1.5 text-foreground-subtle hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                >
                  {deletingId === r.pricingRunId
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <Trash2 className="h-3.5 w-3.5" />}
                </button>
              )}
              <ChevronRight className="h-4 w-4 shrink-0 text-foreground-subtle" />
            </div>
            );
          })}
        </div>
      )}

      {showStart && (
        <StartRunModal
          projectId={projectId}
          onClose={() => setShowStart(false)}
          onStarted={(runId) => { setShowStart(false); setActiveRunId(runId); }}
        />
      )}

      {history.length > 0 && (
        <div className="rounded-xl border border-black/[0.06] bg-card p-4">
          <h3 className="text-sm font-semibold text-foreground">{t("pricingTab.historyTitle")}</h3>
          <p className="mt-0.5 text-xs text-foreground-subtle">{t("pricingTab.historySubtitle")}</p>
          <ul className="mt-3 divide-y divide-black/[0.04] text-xs">
            {history.slice(0, 10).map((h) => (
              <li key={h.pricingRunId} className="flex items-center justify-between py-2">
                <span className="text-foreground-muted">
                  {h.runType ? t(`pricingTab.type_${h.runType}`) : "—"}
                  {" · "}
                  {timeAgoFromIso(h.createdAt)}
                </span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_BADGE[h.status]}`}>
                  {t(`pricingTab.status_${h.status}`)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function StartRunModal({
  projectId, onClose, onStarted,
}: { projectId: string; onClose: () => void; onStarted: (runId: string) => void }) {
  const t = useT();
  const { profile } = useAuth();
  const companyId = profile?.activeCompanyId;
  const [runType, setRunType]       = useState<PricingRunType>("ai_assisted");
  const [currency, setCurrency]     = useState("OMR");
  const [margin, setMargin]         = useState<number | "">(12);
  const [risk, setRisk]             = useState<number | "">(5);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState("");

  async function handleStart(e: React.FormEvent) {
    e.preventDefault();
    if (!companyId) return;
    setError("");
    setSubmitting(true);
    try {
      const res = await startPricingRun({
        companyId,
        projectId,
        currency,
        runType,
        marginPolicy: {
          targetMarginPct: margin === "" ? undefined : Number(margin),
          riskContingencyPct: risk === "" ? undefined : Number(risk),
        },
      });
      onStarted(res.pricingRunId);
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
          <h3 className="text-base font-semibold text-foreground">{t("pricingTab.startCta")}</h3>
          <button onClick={onClose} className="rounded-md p-1 text-foreground-subtle hover:bg-black/[0.05]">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleStart} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground-muted">{t("pricingTab.runType")}</label>
            <select
              value={runType}
              onChange={(e) => setRunType(e.target.value as PricingRunType)}
              className="w-full rounded-xl border border-black/[0.08] bg-white px-3 py-2 text-sm"
            >
              <option value="ai_assisted">{t("pricingTab.type_ai_assisted")}</option>
              <option value="manual">{t("pricingTab.type_manual")}</option>
              <option value="benchmark">{t("pricingTab.type_benchmark")}</option>
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground-muted">{t("pricingTab.currency")}</label>
              <input
                type="text"
                value={currency}
                onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                className="w-full rounded-xl border border-black/[0.08] bg-white px-3 py-2 text-sm"
                maxLength={4}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground-muted">{t("pricingTab.targetMargin")}</label>
              <input
                type="number"
                min={0} step={0.5}
                value={margin}
                onChange={(e) => setMargin(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full rounded-xl border border-black/[0.08] bg-white px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground-muted">{t("pricingTab.riskContingency")}</label>
              <input
                type="number"
                min={0} step={0.5}
                value={risk}
                onChange={(e) => setRisk(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full rounded-xl border border-black/[0.08] bg-white px-3 py-2 text-sm"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4" /> <span>{error}</span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-black/[0.08] bg-white px-3 py-2 text-sm hover:bg-black/[0.03]"
            >
              {t("pricingTab.cancel")}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {t("pricingTab.start")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RunDetail({
  projectId, pricingRunId, onBack, onDelete,
}: { projectId: string; pricingRunId: string; onBack: () => void; onDelete: (run: PricingRun) => void }) {
  const t = useT();
  const { dir } = useLocale();
  const { profile } = useAuth();
  const companyId = profile?.activeCompanyId;
  const canApprove = useIsOneOf("estimator", "finance", "admin", "company_owner");
  const canManage = useIsOneOf("estimator", "finance", "tender_manager", "admin", "company_owner");

  const { run } = usePricingRun(projectId, pricingRunId);
  const { items, loading } = usePricingItems(projectId, pricingRunId);
  const [approving, setApproving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const BackArrow = dir === "rtl" ? ChevronRight : ArrowLeft;
  const locked = run?.status === "locked";

  async function handleApprove() {
    if (!companyId) return;
    if (!confirm(t("pricingTab.approveConfirm"))) return;
    setApproving(true);
    try {
      await approvePricingRun(pricingRunId, { companyId, projectId });
      showToast(t("pricingTab.approving"), "success");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Failed", "error");
    } finally {
      setApproving(false);
    }
  }

  async function handleDelete() {
    if (!run) return;
    setDeleting(true);
    try {
      await onDelete(run);
      onBack();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1 text-xs text-foreground-muted hover:underline"
        >
          <BackArrow className="h-3 w-3" /> {t("pricingTab.title")}
        </button>
        <div className="flex items-center gap-2">
          {run && (
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_BADGE[run.status]}`}>
              {t(`pricingTab.status_${run.status}`)}
            </span>
          )}
          {canManage && run && run.status !== "estimating" && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              title={t("pricingTab.delete")}
              className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2 py-1 text-[10px] font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              {deleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
              {t("pricingTab.delete")}
            </button>
          )}
        </div>
      </div>

      {/* Locked banner */}
      {locked && (
        <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <Lock className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{t("pricingTab.lockedHint")}</span>
        </div>
      )}

      {/* Margin policy */}
      {run && !locked && (
        <MarginPolicyEditor
          run={run}
          projectId={projectId}
          pricingRunId={pricingRunId}
          companyId={companyId}
        />
      )}

      {/* Items table */}
      <div className="overflow-hidden rounded-xl border border-black/[0.06]">
        {loading ? (
          <div className="flex h-24 items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-foreground-subtle" />
          </div>
        ) : items.length === 0 ? (
          <p className="py-8 text-center text-sm text-foreground-subtle">{t("pricingTab.noItems")}</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-surface-2 text-xs font-medium text-foreground-subtle">
              <tr>
                <th className="px-4 py-2.5 text-left">{t("pricingTab.itemDescription")}</th>
                <th className="px-4 py-2.5 text-right">{t("pricingTab.itemQty")}</th>
                <th className="px-4 py-2.5 text-left">{t("pricingTab.itemUnit")}</th>
                <th className="px-4 py-2.5 text-right">{t("pricingTab.itemAiRate")}</th>
                <th className="px-4 py-2.5 text-right">{t("pricingTab.itemRate")}</th>
                <th className="px-4 py-2.5 text-right">{t("pricingTab.itemAmount")}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <ItemRow
                  key={it.itemId}
                  item={it}
                  projectId={projectId}
                  pricingRunId={pricingRunId}
                  currency={run ? pricingCurrency(run) : undefined}
                  locked={locked}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Totals + approve */}
      {run?.totals && pricingGrandTotal(run.totals) != null && (
        <div className="rounded-2xl border border-black/[0.06] bg-card p-5">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <Totals label={t("pricingTab.subtotal")} value={run.totals.subtotal ?? 0} currency={pricingCurrency(run)} />
            <Totals label={t("pricingTab.margin")}   value={pricingMarginAmount(run.totals)} currency={pricingCurrency(run)} />
            <Totals label={t("pricingTab.total")}    value={pricingGrandTotal(run.totals) ?? 0} currency={pricingCurrency(run)} accent />
          </div>

          {!locked && (
            <button
              onClick={handleApprove}
              disabled={!canApprove || approving}
              title={!canApprove ? t("pricingTab.noPermApprove") : undefined}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-50"
            >
              {approving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              {approving ? t("pricingTab.approving") : t("pricingTab.approveCta")}
            </button>
          )}
          {!canApprove && !locked && (
            <p className="mt-2 text-center text-xs text-foreground-subtle">{t("pricingTab.noPermApprove")}</p>
          )}
        </div>
      )}
    </div>
  );
}

function MarginPolicyEditor({
  run, projectId, pricingRunId, companyId,
}: {
  run: PricingRun;
  projectId: string;
  pricingRunId: string;
  companyId?: string | null;
}) {
  const t = useT();
  const canEdit = useIsOneOf("estimator", "finance", "tender_manager", "admin", "company_owner");
  const policy = run.marginPolicy || {};
  const [overhead, setOverhead] = useState(policy.overheadPercent ?? 12);
  const [profit, setProfit] = useState(policy.profitPercent ?? 8);
  const [contingency, setContingency] = useState(policy.contingencyPercent ?? 5);
  const [risk, setRisk] = useState(policy.riskPercent ?? 3);
  const [saving, setSaving] = useState(false);

  const dirty =
    overhead !== (policy.overheadPercent ?? 12) ||
    profit !== (policy.profitPercent ?? 8) ||
    contingency !== (policy.contingencyPercent ?? 5) ||
    risk !== (policy.riskPercent ?? 3);

  async function handleSave() {
    if (!companyId || !canEdit) return;
    setSaving(true);
    try {
      await updatePricingRun(pricingRunId, {
        companyId,
        projectId,
        marginPolicy: {
          overheadPercent: Number(overhead),
          profitPercent: Number(profit),
          contingencyPercent: Number(contingency),
          riskPercent: Number(risk),
        },
      });
      showToast(t("pricingTab.saveMargin"), "success");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Failed", "error");
    } finally {
      setSaving(false);
    }
  }

  if (!canEdit) return null;

  return (
    <div className="rounded-xl border border-black/[0.06] bg-card p-4">
      <p className="mb-3 text-xs font-medium text-foreground-muted">{t("pricingTab.marginPolicy")}</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {([
          [t("pricingTab.overhead"), overhead, setOverhead],
          [t("pricingTab.profit"), profit, setProfit],
          [t("pricingTab.contingency"), contingency, setContingency],
          [t("pricingTab.risk"), risk, setRisk],
        ] as const).map(([label, val, setVal]) => (
          <label key={label} className="space-y-1">
            <span className="text-[10px] text-foreground-subtle">{label} %</span>
            <input
              type="number"
              min={0}
              max={100}
              step={0.5}
              value={val}
              onChange={(e) => setVal(e.target.value === "" ? 0 : Number(e.target.value))}
              className="input w-full text-sm"
            />
          </label>
        ))}
      </div>
      {dirty && (
        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
          {t("pricingTab.saveMargin")}
        </button>
      )}
    </div>
  );
}

function ItemRow({
  item, projectId, pricingRunId, currency, locked,
}: {
  item: PricingLineItem;
  projectId: string;
  pricingRunId: string;
  currency?: string;
  locked: boolean;
}) {
  const t = useT();
  const { profile } = useAuth();
  const companyId = profile?.activeCompanyId;
  const canEdit = useIsOneOf("estimator", "finance", "tender_manager", "admin", "company_owner") && !locked;
  const boqItemId = item.boqItemId || item.itemId;

  const [expanded, setExpanded] = useState(false);
  const [description, setDescription] = useState(item.description ?? "");
  const [qty, setQty] = useState<number | "">(item.quantity ?? "");
  const [unit, setUnit] = useState(item.unit ?? "");
  const [rate, setRate] = useState<number | "">(item.finalRate ?? item.manualRate ?? item.aiRate ?? "");
  const [material, setMaterial] = useState<number | "">(item.material ?? "");
  const [labor, setLabor] = useState<number | "">(item.labor ?? "");
  const [equipment, setEquipment] = useState<number | "">(item.equipment ?? "");
  const [subcontract, setSubcontract] = useState<number | "">(item.subcontract ?? "");
  const [notes, setNotes] = useState(item.notes ?? "");
  const [saving, setSaving] = useState(false);

  const dirty =
    description !== (item.description ?? "") ||
    qty !== (item.quantity ?? "") ||
    unit !== (item.unit ?? "") ||
    rate !== (item.finalRate ?? item.manualRate ?? item.aiRate ?? "") ||
    material !== (item.material ?? "") ||
    labor !== (item.labor ?? "") ||
    equipment !== (item.equipment ?? "") ||
    subcontract !== (item.subcontract ?? "") ||
    notes !== (item.notes ?? "");

  async function handleSave() {
    if (!companyId || rate === "") return;
    setSaving(true);
    try {
      await updatePricingLineItem(pricingRunId, {
        companyId,
        projectId,
        boqItemId,
        description,
        quantity: qty === "" ? undefined : Number(qty),
        unit: unit || undefined,
        finalRate: Number(rate),
        material: material === "" ? undefined : Number(material),
        labor: labor === "" ? undefined : Number(labor),
        equipment: equipment === "" ? undefined : Number(equipment),
        subcontract: subcontract === "" ? undefined : Number(subcontract),
        notes: notes || undefined,
      });
      showToast(t("pricingTab.saveRate"), "success");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Failed", "error");
    } finally {
      setSaving(false);
    }
  }

  const qtyNum = qty === "" ? 0 : Number(qty);
  const rateNum = rate === "" ? 0 : Number(rate);
  const amount = qtyNum * rateNum;

  return (
    <>
      <tr className="border-t border-black/[0.05]">
        <td className="px-4 py-2.5 align-top">
          {canEdit ? (
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full min-w-[200px] rounded-md border border-black/[0.08] bg-white px-2 py-1 text-sm"
            />
          ) : (
            <p className="text-sm text-foreground">{item.description || "—"}</p>
          )}
        </td>
        <td className="px-4 py-2.5 text-right">
          {canEdit ? (
            <input
              type="number"
              min={0}
              step={0.01}
              value={qty}
              onChange={(e) => setQty(e.target.value === "" ? "" : Number(e.target.value))}
              className="w-20 rounded-md border border-black/[0.08] bg-white px-2 py-1 text-right text-sm"
            />
          ) : (
            <span className="text-sm text-foreground">{qtyNum.toLocaleString()}</span>
          )}
        </td>
        <td className="px-4 py-2.5">
          {canEdit ? (
            <input
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-16 rounded-md border border-black/[0.08] bg-white px-2 py-1 text-sm"
            />
          ) : (
            <span className="text-sm text-foreground-muted">{item.unit || "—"}</span>
          )}
        </td>
        <td className="px-4 py-2.5 text-right text-sm text-foreground-subtle">
          {item.aiRate != null ? item.aiRate.toLocaleString() : "—"}
        </td>
        <td className="px-4 py-2.5 text-right">
          {canEdit ? (
            <input
              type="number"
              min={0}
              step={0.01}
              value={rate}
              onChange={(e) => setRate(e.target.value === "" ? "" : Number(e.target.value))}
              className="w-24 rounded-md border border-black/[0.08] bg-white px-2 py-1 text-right text-sm"
            />
          ) : (
            <span className="text-sm text-foreground">{rateNum.toLocaleString()}</span>
          )}
        </td>
        <td className="px-4 py-2.5 text-right">
          <div className="flex items-center justify-end gap-1">
            <span className="text-sm font-medium text-foreground">
              {amount.toLocaleString()} {currency || ""}
            </span>
            {canEdit && (
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="rounded p-0.5 text-foreground-subtle hover:bg-black/[0.04]"
                title={t("pricingTab.costBreakdown")}
              >
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} />
              </button>
            )}
          </div>
        </td>
      </tr>
      {canEdit && expanded && (
        <tr className="border-t border-black/[0.03] bg-surface-2/50">
          <td colSpan={6} className="px-4 py-3">
            <div className="grid gap-3 sm:grid-cols-4">
              {([
                [t("pricingTab.material"), material, setMaterial],
                [t("pricingTab.labor"), labor, setLabor],
                [t("pricingTab.equipment"), equipment, setEquipment],
                [t("pricingTab.subcontract"), subcontract, setSubcontract],
              ] as const).map(([label, val, setVal]) => (
                <label key={label} className="space-y-1">
                  <span className="text-[10px] text-foreground-subtle">{label}</span>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={val}
                    onChange={(e) => setVal(e.target.value === "" ? "" : Number(e.target.value))}
                    className="input w-full text-sm"
                  />
                </label>
              ))}
            </div>
            <label className="mt-3 block space-y-1">
              <span className="text-[10px] text-foreground-subtle">{t("pricingTab.ratesNote")}</span>
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="input w-full text-sm"
              />
            </label>
            {dirty && (
              <button
                onClick={handleSave}
                disabled={saving}
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                {t("pricingTab.saveRate")}
              </button>
            )}
          </td>
        </tr>
      )}
      {canEdit && dirty && !expanded && (
        <tr>
          <td colSpan={6} className="px-4 pb-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-2 py-1 text-[10px] font-medium text-white disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
              {t("pricingTab.saveRate")}
            </button>
          </td>
        </tr>
      )}
    </>
  );
}

function Totals({ label, value, currency, accent }: { label: string; value: number; currency?: string; accent?: boolean }) {
  return (
    <div className={`rounded-xl px-4 py-3 ${accent ? "bg-primary-soft" : "bg-surface-2"}`}>
      <p className="text-[10px] font-medium uppercase tracking-widest text-foreground-subtle">{label}</p>
      <p className={`mt-0.5 text-lg font-semibold ${accent ? "text-primary" : "text-foreground"}`}>
        {value.toLocaleString()} <span className="text-xs font-normal">{currency}</span>
      </p>
    </div>
  );
}
