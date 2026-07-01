"use client";

import { useState } from "react";
import { Loader2, AlertCircle, Lock } from "lucide-react";
import { useT } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import { changeMyPassword } from "@/lib/api/users";
import { showToast } from "@/lib/toast";
import { ApiError } from "@/lib/api/client";

export function PasswordForm() {
  const t = useT();
  const { profile } = useAuth();
  const hasPassword = profile?.hasPassword !== false;

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (next !== confirm) {
      setError(t("security.mismatch"));
      return;
    }
    if (next.length < 8) {
      setError(t("security.minLength"));
      return;
    }
    setSaving(true);
    try {
      await changeMyPassword({
        currentPassword: hasPassword ? current || undefined : undefined,
        newPassword: next,
      });
      showToast(t("security.passwordUpdated"), "success");
      setCurrent(""); setNext(""); setConfirm("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card p-6">
      <div className="mb-5 flex items-center gap-2">
        <Lock className="h-4 w-4 text-foreground-subtle" />
        <div>
          <h2 className="text-base font-semibold text-foreground">{t("security.title")}</h2>
          <p className="text-xs text-foreground-subtle">{t("security.subtitle")}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-md space-y-4">
        {hasPassword && (
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground-muted">{t("security.currentPassword")}</label>
            <input
              type="password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              className="input"
            />
          </div>
        )}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-foreground-muted">{t("security.newPassword")}</label>
          <input
            type="password"
            required
            minLength={8}
            value={next}
            onChange={(e) => setNext(e.target.value)}
            className="input"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-foreground-muted">{t("security.confirmPassword")}</label>
          <input
            type="password"
            required
            minLength={8}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="input"
          />
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4" /> <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={saving || !next}
          className="inline-flex items-center gap-2 rounded-[var(--radius-pill)] bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {saving ? t("security.changing") : t("security.changeCta")}
        </button>
      </form>
    </div>
  );
}
