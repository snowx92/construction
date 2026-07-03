"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useT } from "@/lib/i18n";
import { showToast } from "@/lib/toast";
import { ApiError } from "@/lib/api/client";
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  type NotificationPreferences,
} from "@/lib/api/notification-preferences";

const EVENT_KEYS = ["deadlines", "pricing", "teamActivity", "exports"] as const;

export function NotificationPreferencesForm() {
  const t = useT();
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getNotificationPreferences()
      .then((d) => setPrefs(d.preferences))
      .catch(() => setPrefs({ email: {}, inApp: {}, digestFrequency: "daily" }))
      .finally(() => setLoading(false));
  }, []);

  function toggle(channel: "email" | "inApp", key: string) {
    setPrefs((p) => ({
      ...p,
      [channel]: { ...p?.[channel], [key]: !p?.[channel]?.[key] },
    }));
  }

  async function handleSave() {
    if (!prefs) return;
    setSaving(true);
    try {
      await updateNotificationPreferences(prefs);
      showToast(t("settings.prefsSaved"), "success");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Failed", "error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-24 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-foreground-subtle" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium text-foreground-muted mb-3">{t("settings.emailNotifications")}</p>
        <div className="space-y-2">
          {EVENT_KEYS.map((key) => (
            <label key={`email-${key}`} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={Boolean(prefs?.email?.[key])}
                onChange={() => toggle("email", key)}
              />
              {t(`settings.event_${key}`)}
            </label>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs font-medium text-foreground-muted mb-3">{t("settings.inAppNotifications")}</p>
        <div className="space-y-2">
          {EVENT_KEYS.map((key) => (
            <label key={`inapp-${key}`} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={Boolean(prefs?.inApp?.[key])}
                onChange={() => toggle("inApp", key)}
              />
              {t(`settings.event_${key}`)}
            </label>
          ))}
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-foreground-muted">{t("settings.digestFrequency")}</label>
        <select
          className="mt-1.5 w-full max-w-xs rounded-xl border border-black/[0.08] bg-white px-3 py-2 text-sm"
          value={prefs?.digestFrequency ?? "daily"}
          onChange={(e) => setPrefs((p) => ({ ...p, digestFrequency: e.target.value as NotificationPreferences["digestFrequency"] }))}
        >
          <option value="off">{t("settings.digestOff")}</option>
          <option value="daily">{t("settings.digestDaily")}</option>
          <option value="weekly">{t("settings.digestWeekly")}</option>
        </select>
      </div>
      <button
        onClick={handleSave}
        disabled={saving}
        className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
        {t("common.save")}
      </button>
    </div>
  );
}
