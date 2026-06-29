"use client";

import { useEffect, useState } from "react";
import { showToast } from "@/lib/toast";
import { useAuth } from "@/lib/auth-context";
import { updateMyProfile } from "@/lib/api/users";
import { ApiError } from "@/lib/api/client";
import { useT, useLocale } from "@/lib/i18n";
import { Loader2 } from "lucide-react";

const TIMEZONES = [
  "Asia/Muscat",
  "Asia/Dubai",
  "Africa/Cairo",
  "Asia/Riyadh",
  "Europe/London",
  "UTC",
];

export function SettingsForm() {
  const t = useT();
  const { lang, setLang } = useLocale();
  const { profile, refreshProfile } = useAuth();

  const [form, setForm] = useState({
    displayName: "",
    jobTitle: "",
    department: "",
    phone: "",
    locale: "en" as "en" | "ar",
    timezone: "Asia/Muscat",
  });
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({
        displayName: profile.displayName ?? "",
        jobTitle:    profile.jobTitle ?? "",
        department:  profile.department ?? "",
        phone:       profile.phone ?? "",
        locale:      profile.locale ?? "en",
        timezone:    profile.timezone ?? "Asia/Muscat",
      });
      setDirty(false);
    }
  }, [profile]);

  function update<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm((p) => ({ ...p, [key]: value }));
    setDirty(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await updateMyProfile({
        displayName: form.displayName || undefined,
        jobTitle:    form.jobTitle || undefined,
        department:  form.department || undefined,
        phone:       form.phone || undefined,
        locale:      form.locale,
        timezone:    form.timezone || undefined,
      });
      if (form.locale !== lang) setLang(form.locale);
      await refreshProfile();
      showToast(t("profile.toastUpdated"), "success");
      setDirty(false);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Update failed", "error");
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    if (profile) {
      setForm({
        displayName: profile.displayName ?? "",
        jobTitle:    profile.jobTitle ?? "",
        department:  profile.department ?? "",
        phone:       profile.phone ?? "",
        locale:      profile.locale ?? "en",
        timezone:    profile.timezone ?? "Asia/Muscat",
      });
      setDirty(false);
    }
  }

  if (!profile) {
    return (
      <div className="card p-6 flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-foreground-subtle" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <h2 className="text-base font-semibold mb-5 text-foreground">
          {t("profile.eyebrow")}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium mb-1.5 text-foreground-muted">
              {t("onboarding.fullName")}
            </label>
            <input
              type="text"
              value={form.displayName}
              onChange={(e) => update("displayName", e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5 text-foreground-muted">
              {t("profile.fieldEmail")}
            </label>
            <input type="email" value={profile.email} disabled className="input opacity-60" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5 text-foreground-muted">
              {t("onboarding.jobTitle")}
            </label>
            <input
              type="text"
              value={form.jobTitle}
              onChange={(e) => update("jobTitle", e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5 text-foreground-muted">
              {t("onboarding.department")}
            </label>
            <input
              type="text"
              value={form.department}
              onChange={(e) => update("department", e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5 text-foreground-muted">
              {t("onboarding.phone")}
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              className="input"
            />
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-base font-semibold mb-5 text-foreground">
          {t("language.label")} & {t("settings.sectionAppearance")}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium mb-1.5 text-foreground-muted">
              {t("language.label")}
            </label>
            <select
              value={form.locale}
              onChange={(e) => update("locale", e.target.value as "en" | "ar")}
              className="input"
            >
              <option value="en">{t("language.english")}</option>
              <option value="ar">{t("language.arabic")}</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5 text-foreground-muted">
              Timezone
            </label>
            <select
              value={form.timezone}
              onChange={(e) => update("timezone", e.target.value)}
              className="input"
            >
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-black/[0.05]">
        {dirty && (
          <button
            onClick={handleReset}
            type="button"
            className="inline-flex items-center gap-2 h-10 px-5 rounded-[var(--radius-pill)] bg-surface text-foreground border border-black/[0.06] text-sm font-medium hover:bg-black/[0.035]"
          >
            {t("common.cancel")}
          </button>
        )}
        <button
          onClick={handleSave}
          disabled={!dirty || saving}
          className="inline-flex items-center gap-2 h-10 px-5 rounded-[var(--radius-pill)] bg-primary text-white text-sm font-medium hover:bg-primary-hover disabled:opacity-50"
        >
          {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {saving ? t("common.loading") : t("common.save")}
        </button>
      </div>
    </div>
  );
}
