"use client";

import { useState, useEffect } from "react";
import { Loader2, AlertCircle, Building2 } from "lucide-react";
import { useT } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import { useIsAdmin } from "@/lib/use-role";
import { getCompanySettings, updateCompanySettings } from "@/lib/api/companies";
import { showToast } from "@/lib/toast";
import { ApiError } from "@/lib/api/client";
import type { SupportedCountry } from "@/lib/api/types";

export function CompanyDefaultsForm() {
  const t = useT();
  const { profile } = useAuth();
  const isAdmin = useIsAdmin();
  const companyId = profile?.activeCompanyId;

  const [country, setCountry]         = useState<SupportedCountry>("OM");
  const [currency, setCurrency]       = useState("OMR");
  const [maxProjects, setMaxProjects] = useState<number | "">("");
  const [maxUsers, setMaxUsers]       = useState<number | "">("");
  const [maxStorage, setMaxStorage]   = useState<number | "">("");
  const [maxAi, setMaxAi]             = useState<number | "">("");
  const [maxConcurrent, setMaxConc]   = useState<number | "">("");
  const [saving, setSaving]           = useState(false);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");

  useEffect(() => {
    if (!companyId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    getCompanySettings(companyId)
      .then((s) => {
        if (s.country) setCountry(s.country as SupportedCountry);
        if (s.defaultCurrency) setCurrency(s.defaultCurrency);
        if (s.quotas?.maxProjects != null) setMaxProjects(s.quotas.maxProjects);
        if (s.quotas?.maxUsers != null) setMaxUsers(s.quotas.maxUsers);
        if (s.quotas?.maxStorageBytes != null) setMaxStorage(s.quotas.maxStorageBytes);
        if (s.quotas?.maxAiRequestsPerMonth != null) setMaxAi(s.quotas.maxAiRequestsPerMonth);
        if (s.quotas?.maxConcurrentJobs != null) setMaxConc(s.quotas.maxConcurrentJobs);
      })
      .catch(() => { /* use defaults */ })
      .finally(() => setLoading(false));
  }, [companyId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!companyId) return;
    setError("");
    setSaving(true);
    try {
      await updateCompanySettings({
        companyId,
        settings: {
          country,
          defaultCurrency: currency || undefined,
          quotas: {
            maxProjects:            maxProjects === ""   ? undefined : Number(maxProjects),
            maxUsers:               maxUsers === ""      ? undefined : Number(maxUsers),
            maxStorageBytes:        maxStorage === ""    ? undefined : Number(maxStorage),
            maxAiRequestsPerMonth:  maxAi === ""         ? undefined : Number(maxAi),
            maxConcurrentJobs:      maxConcurrent === "" ? undefined : Number(maxConcurrent),
          },
        },
      });
      showToast(t("companyDefaults.saved"), "success");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card p-6">
      <div className="mb-5 flex items-center gap-2">
        <Building2 className="h-4 w-4 text-foreground-subtle" />
        <div>
          <h2 className="text-base font-semibold text-foreground">{t("companyDefaults.title")}</h2>
          <p className="text-xs text-foreground-subtle">{t("companyDefaults.subtitle")}</p>
        </div>
      </div>

      {!isAdmin && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
          <AlertCircle className="mt-0.5 h-4 w-4" /> <span>{t("companyDefaults.noPermGate")}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5" onChangeCapture={() => setError("")}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground-muted">{t("companyDefaults.country")}</label>
            <select
              disabled={!isAdmin}
              value={country}
              onChange={(e) => setCountry(e.target.value as SupportedCountry)}
              className="input bg-transparent"
            >
              <option value="OM">🇴🇲 Oman</option>
              <option value="EG">🇪🇬 Egypt</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground-muted">{t("companyDefaults.currency")}</label>
            <input
              disabled={!isAdmin}
              value={currency}
              onChange={(e) => setCurrency(e.target.value.toUpperCase())}
              maxLength={4}
              className="input"
            />
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-widest text-foreground-subtle">
            {t("companyDefaults.quotas")}
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            <NumberField label={t("companyDefaults.maxProjects")}   value={maxProjects}   onChange={setMaxProjects} disabled={!isAdmin} />
            <NumberField label={t("companyDefaults.maxUsers")}      value={maxUsers}      onChange={setMaxUsers}    disabled={!isAdmin} />
            <NumberField label={t("companyDefaults.maxStorage")}    value={maxStorage}    onChange={setMaxStorage}  disabled={!isAdmin} />
            <NumberField label={t("companyDefaults.maxAi")}         value={maxAi}         onChange={setMaxAi}       disabled={!isAdmin} />
            <NumberField label={t("companyDefaults.maxConcurrent")} value={maxConcurrent} onChange={setMaxConc}     disabled={!isAdmin} />
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4" /> <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={saving || !isAdmin}
          className="inline-flex items-center gap-2 rounded-[var(--radius-pill)] bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {t("companyDefaults.saveCta")}
        </button>
      </form>
    </div>
  );
}

function NumberField({
  label, value, onChange, disabled,
}: {
  label: string;
  value: number | "";
  onChange: (v: number | "") => void;
  disabled: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-foreground-muted">{label}</label>
      <input
        type="number"
        min={0}
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
        className="input"
      />
    </div>
  );
}
