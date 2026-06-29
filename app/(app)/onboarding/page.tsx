"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowLeft, Building2, CheckCircle2, AlertCircle, User as UserIcon } from "lucide-react";
import { useLocale } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import { createCompany } from "@/lib/api/companies";
import { updateMyProfile } from "@/lib/api/users";
import { ApiError } from "@/lib/api/client";
import type { SupportedCountry } from "@/lib/api/types";

type Step = 1 | 2;

const TRADE_KEYS = [
  ["civil", "onboarding.tradeCivil"],
  ["mechanical", "onboarding.tradeMechanical"],
  ["electrical", "onboarding.tradeElectrical"],
  ["plumbing", "onboarding.tradePlumbing"],
  ["finishing", "onboarding.tradeFinishing"],
  ["infrastructure", "onboarding.tradeInfra"],
] as const;

const CURRENCY_BY_COUNTRY: Record<SupportedCountry, string> = { OM: "OMR", EG: "EGP" };

export default function OnboardingPage() {
  const { t, dir, lang } = useLocale();
  const { profile, refreshProfile } = useAuth();
  const router = useRouter();
  const Arrow = dir === "rtl" ? ArrowLeft : ArrowRight;

  const [step, setStep] = useState<Step>(1);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Company step
  const [companyName, setCompanyName] = useState("");
  const [country, setCountry] = useState<SupportedCountry>("OM");
  const [trades, setTrades] = useState<Set<string>>(new Set());

  // Profile step
  const [displayName, setDisplayName] = useState(profile?.displayName ?? "");
  const [jobTitle, setJobTitle] = useState(profile?.jobTitle ?? "");
  const [department, setDepartment] = useState(profile?.department ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");

  function toggleTrade(t: string) {
    setTrades((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t); else next.add(t);
      return next;
    });
  }

  async function handleCompanySubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await createCompany({
        name: companyName.trim(),
        country,
        defaultCurrency: CURRENCY_BY_COUNTRY[country],
        tradeCategories: Array.from(trades),
      });
      await refreshProfile();
      setStep(2);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create company");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await updateMyProfile({
        displayName: displayName.trim() || undefined,
        jobTitle: jobTitle.trim() || undefined,
        department: department.trim() || undefined,
        phone: phone.trim() || undefined,
        locale: lang,
      });
      await refreshProfile();
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update profile");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-12" dir={dir}>
      <div className="w-full max-w-xl">
        {/* Logo + step indicator */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[rgb(var(--primary))]">
              <Building2 className="h-4 w-4 text-white" />
            </div>
            Tender.ai
          </div>
          <div className="text-xs text-foreground-muted">{t("onboarding.step", { n: step, total: 2 })}</div>
        </div>

        {/* Progress bar */}
        <div className="mb-8 flex gap-2">
          <div className="h-1.5 flex-1 rounded-full bg-[rgb(var(--primary))]" />
          <div className={`h-1.5 flex-1 rounded-full ${step === 2 ? "bg-[rgb(var(--primary))]" : "bg-black/[0.08]"}`} />
        </div>

        <div className="rounded-2xl border border-[rgb(var(--border)/0.08)] bg-card p-8 shadow-sm">
          {step === 1 ? (
            <form onSubmit={handleCompanySubmit} className="space-y-6">
              <div className="space-y-1">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("onboarding.companyTitle")}</h1>
                <p className="text-sm text-foreground-muted">{t("onboarding.companySubtitle")}</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground-muted">{t("onboarding.companyName")}</label>
                <input
                  type="text"
                  required
                  minLength={2}
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder={t("onboarding.companyNamePh")}
                  className="w-full rounded-xl border border-[rgb(var(--border)/0.1)] bg-white px-4 py-3 text-sm text-foreground outline-none focus:border-[rgb(var(--primary))] focus:ring-4 focus:ring-[rgb(var(--primary-soft))]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground-muted">{t("onboarding.country")}</label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value as SupportedCountry)}
                    className="w-full rounded-xl border border-[rgb(var(--border)/0.1)] bg-white px-4 py-3 text-sm text-foreground outline-none focus:border-[rgb(var(--primary))]"
                  >
                    <option value="OM">{t("onboarding.countryOM")}</option>
                    <option value="EG">{t("onboarding.countryEG")}</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground-muted">{t("onboarding.currency")}</label>
                  <input
                    type="text"
                    readOnly
                    value={CURRENCY_BY_COUNTRY[country]}
                    className="w-full rounded-xl border border-[rgb(var(--border)/0.1)] bg-[rgb(var(--accent-warm))] px-4 py-3 text-sm text-foreground"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-foreground-muted">{t("onboarding.tradeCategories")}</label>
                <div className="flex flex-wrap gap-2">
                  {TRADE_KEYS.map(([key, label]) => {
                    const active = trades.has(key);
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => toggleTrade(key)}
                        className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition ${
                          active
                            ? "border-[rgb(var(--primary))] bg-[rgb(var(--primary-soft))] text-[rgb(var(--primary))]"
                            : "border-[rgb(var(--border)/0.12)] bg-white text-foreground-muted hover:border-[rgb(var(--primary))]"
                        }`}
                      >
                        {active && <CheckCircle2 className="h-3.5 w-3.5" />}
                        {t(label)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-[rgb(var(--primary))] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[rgb(var(--primary)/0.25)] transition hover:bg-[rgb(var(--primary-hover))] disabled:opacity-50"
              >
                {submitting ? t("onboarding.saving") : t("onboarding.continue")}
                {!submitting && <Arrow className="h-4 w-4 transition group-hover:translate-x-0.5" />}
              </button>
            </form>
          ) : (
            <form onSubmit={handleProfileSubmit} className="space-y-6">
              <div className="space-y-1">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("onboarding.profileTitle")}</h1>
                <p className="text-sm text-foreground-muted">{t("onboarding.profileSubtitle")}</p>
              </div>

              <div className="flex items-center gap-3 rounded-xl bg-[rgb(var(--primary-soft))] px-4 py-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[rgb(var(--primary))] text-white">
                  <UserIcon className="h-4 w-4" />
                </div>
                <div className="text-xs text-foreground-muted">
                  <div className="font-medium text-foreground">{profile?.email}</div>
                  <div>{profile?.companyIds?.length} workspace</div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground-muted">{t("onboarding.fullName")}</label>
                <input
                  type="text"
                  required
                  minLength={2}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder={t("auth.namePlaceholder")}
                  className="w-full rounded-xl border border-[rgb(var(--border)/0.1)] bg-white px-4 py-3 text-sm text-foreground outline-none focus:border-[rgb(var(--primary))] focus:ring-4 focus:ring-[rgb(var(--primary-soft))]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground-muted">{t("onboarding.jobTitle")}</label>
                  <input
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder={t("onboarding.jobTitlePh")}
                    className="w-full rounded-xl border border-[rgb(var(--border)/0.1)] bg-white px-4 py-3 text-sm text-foreground outline-none focus:border-[rgb(var(--primary))] focus:ring-4 focus:ring-[rgb(var(--primary-soft))]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground-muted">{t("onboarding.department")}</label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder={t("onboarding.departmentPh")}
                    className="w-full rounded-xl border border-[rgb(var(--border)/0.1)] bg-white px-4 py-3 text-sm text-foreground outline-none focus:border-[rgb(var(--primary))] focus:ring-4 focus:ring-[rgb(var(--primary-soft))]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground-muted">{t("onboarding.phone")}</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+968 9XXX XXXX"
                  className="w-full rounded-xl border border-[rgb(var(--border)/0.1)] bg-white px-4 py-3 text-sm text-foreground outline-none focus:border-[rgb(var(--primary))] focus:ring-4 focus:ring-[rgb(var(--primary-soft))]"
                />
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-[rgb(var(--primary))] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[rgb(var(--primary)/0.25)] transition hover:bg-[rgb(var(--primary-hover))] disabled:opacity-50"
              >
                {submitting ? t("onboarding.saving") : t("onboarding.finish")}
                {!submitting && <Arrow className="h-4 w-4 transition group-hover:translate-x-0.5" />}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
