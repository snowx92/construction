"use client";

import { useEffect, useState } from "react";
import { showToast } from "@/lib/toast";
import { useT } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import { updateMyProfile } from "@/lib/api/users";
import { ApiError } from "@/lib/api/client";
import { initials } from "@/lib/initials";
import { CheckCircle, Loader2 } from "lucide-react";

interface FieldDef {
  key: "displayName" | "email" | "jobTitle" | "department" | "phone";
  labelKey: string;
  type: string;
}

const FIELDS: FieldDef[] = [
  { key: "displayName", labelKey: "profile.fieldName",  type: "text"  },
  { key: "email",       labelKey: "profile.fieldEmail", type: "email" },
  { key: "jobTitle",    labelKey: "profile.fieldRole",  type: "text"  },
  { key: "department",  labelKey: "onboarding.department", type: "text" },
  { key: "phone",       labelKey: "profile.fieldPhone", type: "tel"   },
];

export default function ProfilePage() {
  const t = useT();
  const { profile, refreshProfile } = useAuth();
  const [form, setForm] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({
        displayName: profile.displayName ?? "",
        email:       profile.email ?? "",
        jobTitle:    profile.jobTitle ?? "",
        department:  profile.department ?? "",
        phone:       profile.phone ?? "",
      });
      setDirty(false);
    }
  }, [profile]);

  function update(key: string, value: string) {
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
        // email change requires currentPassword; skip via this form for now
      });
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
        email:       profile.email ?? "",
        jobTitle:    profile.jobTitle ?? "",
        department:  profile.department ?? "",
        phone:       profile.phone ?? "",
      });
      setDirty(false);
    }
  }

  if (!profile) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-foreground-subtle" />
      </div>
    );
  }

  const mockFeatures = ["unlimited_tenders", "ai_insights", "pdf_generation", "team_collaboration"];

  return (
    <div className="mx-auto max-w-[900px] px-8 py-10">
      <div className="mb-8">
        <p className="text-xs font-medium uppercase tracking-widest text-foreground-subtle mb-1">{t("profile.eyebrow")}</p>
        <h1 className="text-3xl font-semibold text-foreground">{t("nav.profile")}</h1>
      </div>

      <div className="card p-8 mb-6">
        <div className="flex items-start gap-6 mb-8">
          {profile.photoURL ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.photoURL} alt="" className="h-16 w-16 shrink-0 rounded-[20px] object-cover" />
          ) : (
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[20px] text-xl font-bold text-white bg-primary">
              {initials(profile.displayName, profile.email)}
            </div>
          )}
          <div className="flex-1">
            <h2 className="text-xl font-semibold mb-0.5 text-foreground">{profile.displayName || profile.email}</h2>
            <p className="text-sm mb-3 text-foreground-muted">{profile.jobTitle || profile.email}</p>
            <div className="flex flex-wrap gap-2">
              {profile.emailVerified && <span className="badge badge-success">Email verified</span>}
              {profile.activeCompanyId && <span className="badge badge-neutral">Workspace active</span>}
            </div>
          </div>
        </div>

        {/* Editable fields */}
        <div className="grid gap-4 sm:grid-cols-2 mb-8">
          {FIELDS.map(({ key, labelKey, type }) => (
            <div key={key} className="rounded-[12px] px-4 py-3 bg-surface-2">
              <label className="text-xs text-foreground-subtle">{t(labelKey)}</label>
              <input
                type={type}
                value={form[key] ?? ""}
                onChange={(e) => update(key, e.target.value)}
                disabled={key === "email"}
                className="mt-1 w-full bg-transparent text-sm font-medium text-foreground outline-none disabled:text-foreground-muted"
              />
            </div>
          ))}
        </div>

        {/* Save row */}
        <div className="flex justify-end gap-3 pt-2">
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

      {/* Plan features (still placeholder until billing API exists) */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-foreground">
            {t("profile.planFeatures", { plan: t("profile.planPro") })}
          </h2>
          <button className="btn-primary text-sm">{t("profile.upgrade")}</button>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {mockFeatures.map((f) => (
            <div key={f} className="flex items-center gap-2.5">
              <CheckCircle className="h-4 w-4 shrink-0 text-success" strokeWidth={1.5} />
              <span className="text-sm capitalize text-foreground-muted">{f.replace(/_/g, " ")}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
