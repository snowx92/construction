"use client";

import { useState } from "react";
import {
  Loader2, AlertCircle, Plus, X, Lock, CheckCircle2, ChevronRight, ArrowLeft,
} from "lucide-react";
import { useT, useLocale } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import { useIsOneOf } from "@/lib/use-role";
import { showToast } from "@/lib/toast";
import { ApiError } from "@/lib/api/client";
import { approvePricingRun, overrideRate, startPricingRun } from "@/lib/api/pricing";
import { usePricingItems, usePricingRun, usePricingRuns } from "@/lib/use-pricing";
import { timeAgoFromIso } from "@/lib/project-status";
import type { PricingLineItem, PricingRunStatus, PricingRunType } from "@/lib/api/types";

const STATUS_BADGE: Record<PricingRunStatus, string> = {
  estimating: "bg-primary-soft text-primary",
  review:     "bg-amber-50 text-amber-700",
  draft:      "bg-foreground-subtle/10 text-foreground-muted",
  locked:     "bg-emerald-50 text-emerald-700",
};

export function PricingTab({ projectId }: { projectId: string }) {
  const t = useT();
  const { runs, loading, error } = usePricingRuns(projectId);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [showStart, setShowStart] = useState(false);

  if (activeRunId) {
    return (
      <RunDetail
        projectId={projectId}
        pricingRunId={activeRunId}
        onBack={() => setActiveRunId(null)}
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
          {runs.map((r) => (
            <button
              key={r.pricingRunId}
              onClick={() => setActiveRunId(r.pricingRunId)}
              className="flex w-full items-center gap-4 rounded-xl border border-black/[0.06] bg-card px-4 py-3 text-left transition-colors hover:bg-black/[0.02]"
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
                  {r.totals && <> · {r.totals.total.toLocaleString()} {r.totals.currency}</>}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-foreground-subtle" />
            </button>
          ))}
        </div>
      )}

      {showStart && (
        <StartRunModal
          projectId={projectId}
          onClose={() => setShowStart(false)}
          onStarted={(runId) => { setShowStart(false); setActiveRunId(runId); }}
        />
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
  projectId, pricingRunId, onBack,
}: { projectId: string; pricingRunId: string; onBack: () => void }) {
  const t = useT();
  const { dir } = useLocale();
  const { profile } = useAuth();
  const companyId = profile?.activeCompanyId;
  const canApprove = useIsOneOf("estimator", "finance", "admin", "company_owner");

  const { run } = usePricingRun(projectId, pricingRunId);
  const { items, loading } = usePricingItems(projectId, pricingRunId);
  const [approving, setApproving] = useState(false);

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

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1 text-xs text-foreground-muted hover:underline"
        >
          <BackArrow className="h-3 w-3" /> {t("pricingTab.title")}
        </button>
        {run && (
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_BADGE[run.status]}`}>
            {t(`pricingTab.status_${run.status}`)}
          </span>
        )}
      </div>

      {/* Locked banner */}
      {locked && (
        <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <Lock className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{t("pricingTab.lockedHint")}</span>
        </div>
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
                  currency={run?.totals?.currency || run?.currency}
                  locked={locked}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Totals + approve */}
      {run?.totals && (
        <div className="rounded-2xl border border-black/[0.06] bg-card p-5">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <Totals label={t("pricingTab.subtotal")} value={run.totals.subtotal} currency={run.totals.currency} />
            <Totals label={t("pricingTab.margin")}   value={run.totals.margin}   currency={run.totals.currency} />
            <Totals label={t("pricingTab.total")}    value={run.totals.total}    currency={run.totals.currency} accent />
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
  const canEdit = useIsOneOf("estimator", "tender_manager", "admin", "company_owner") && !locked;

  const initial = item.finalRate ?? item.manualRate ?? item.aiRate ?? 0;
  const [val, setVal] = useState<number | "">(initial);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  async function handleSave() {
    if (!companyId || val === "" || !item.boqItemId) return;
    setSaving(true);
    try {
      await overrideRate(pricingRunId, {
        companyId,
        projectId,
        boqItemId: item.boqItemId,
        finalRate: Number(val),
      });
      showToast(t("pricingTab.saveRate"), "success");
      setDirty(false);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Failed", "error");
    } finally {
      setSaving(false);
    }
  }

  const qty = item.quantity ?? 0;
  const rate = (val === "" ? 0 : Number(val));
  const amount = qty * rate;

  return (
    <tr className="border-t border-black/[0.05]">
      <td className="px-4 py-2.5 align-top">
        <p className="text-sm text-foreground">{item.description || "—"}</p>
        {item.category && <p className="text-[10px] text-foreground-subtle">{item.category}</p>}
      </td>
      <td className="px-4 py-2.5 text-right text-sm text-foreground">{qty.toLocaleString()}</td>
      <td className="px-4 py-2.5 text-sm text-foreground-muted">{item.unit || "—"}</td>
      <td className="px-4 py-2.5 text-right text-sm text-foreground-subtle">
        {item.aiRate != null ? item.aiRate.toLocaleString() : "—"}
      </td>
      <td className="px-4 py-2.5 text-right">
        {canEdit ? (
          <div className="flex items-center justify-end gap-1">
            <input
              type="number"
              min={0} step={0.01}
              value={val}
              onChange={(e) => { setVal(e.target.value === "" ? "" : Number(e.target.value)); setDirty(true); }}
              className="w-24 rounded-md border border-black/[0.08] bg-white px-2 py-1 text-right text-sm"
            />
            {dirty && (
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-md bg-primary px-2 py-1 text-[10px] font-medium text-white disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : "Save"}
              </button>
            )}
          </div>
        ) : (
          <span className="text-sm text-foreground">{initial.toLocaleString()}</span>
        )}
      </td>
      <td className="px-4 py-2.5 text-right text-sm font-medium text-foreground">
        {amount.toLocaleString()} {currency || ""}
      </td>
    </tr>
  );
}

function Totals({ label, value, currency, accent }: { label: string; value: number; currency: string; accent?: boolean }) {
  return (
    <div className={`rounded-xl px-4 py-3 ${accent ? "bg-primary-soft" : "bg-surface-2"}`}>
      <p className="text-[10px] font-medium uppercase tracking-widest text-foreground-subtle">{label}</p>
      <p className={`mt-0.5 text-lg font-semibold ${accent ? "text-primary" : "text-foreground"}`}>
        {value.toLocaleString()} <span className="text-xs font-normal">{currency}</span>
      </p>
    </div>
  );
}
