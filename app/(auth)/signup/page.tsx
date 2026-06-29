"use client";

import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, User, ArrowRight, ArrowLeft, AlertCircle, CheckCircle2 } from "lucide-react";
import { useLocale } from "@/lib/i18n";

export default function SignupPage() {
  const router = useRouter();
  const { t, dir } = useLocale();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const Arrow = dir === "rtl" ? ArrowLeft : ArrowRight;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message.replace("Firebase: ", "") : t("auth.submitSignup"));
    } finally {
      setLoading(false);
    }
  }

  const passwordChecks = [
    { ok: password.length >= 6, text: t("auth.passwordHint1") },
    { ok: /[A-Z]/.test(password) || /[0-9]/.test(password), text: t("auth.passwordHint2") },
  ];

  const inputCls = (side: "rtl" | "ltr") =>
    `w-full rounded-xl border border-[rgb(var(--border)/0.1)] bg-white py-3 text-sm text-foreground outline-none transition focus:border-[rgb(var(--primary))] focus:ring-4 focus:ring-[rgb(var(--primary-soft))] ${side === "rtl" ? "pr-10 pl-4" : "pl-10 pr-4"}`;

  const iconCls = `pointer-events-none absolute top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-subtle ${dir === "rtl" ? "right-3" : "left-3"}`;

  return (
    <div className="space-y-7" dir={dir}>
      <div className="space-y-2">
        <span className="inline-block rounded-full bg-[rgb(var(--accent-amber))] px-3 py-1 text-xs font-medium text-[rgb(var(--primary-active))]">
          {t("auth.signupBadge")}
        </span>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {t("auth.signupHeadline")}
        </h1>
        <p className="text-sm text-foreground-muted">
          {t("auth.signupHasAccount")}{" "}
          <Link href="/login" className="font-medium text-[rgb(var(--primary))] hover:underline">
            {t("auth.signupSignIn")}
          </Link>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-foreground-muted">{t("auth.nameLabel")}</label>
          <div className="relative">
            <User className={iconCls} />
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("auth.namePlaceholder")}
              className={inputCls(dir)}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-foreground-muted">{t("auth.workEmailLabel")}</label>
          <div className="relative">
            <Mail className={iconCls} />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("auth.emailPlaceholder")}
              className={inputCls(dir)}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-foreground-muted">{t("auth.passwordLabel")}</label>
          <div className="relative">
            <Lock className={iconCls} />
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={inputCls(dir)}
            />
          </div>
          {password.length > 0 && (
            <div className="flex flex-wrap gap-3 pt-1">
              {passwordChecks.map((c) => (
                <div key={c.text} className={`flex items-center gap-1.5 text-xs ${c.ok ? "text-emerald-600" : "text-foreground-subtle"}`}>
                  <CheckCircle2 className={`h-3.5 w-3.5 ${c.ok ? "opacity-100" : "opacity-40"}`} />
                  {c.text}
                </div>
              ))}
            </div>
          )}
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="group flex w-full items-center justify-center gap-2 rounded-xl bg-[rgb(var(--primary))] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[rgb(var(--primary)/0.25)] transition hover:bg-[rgb(var(--primary-hover))] disabled:opacity-50"
        >
          {loading ? t("auth.creatingAccount") : t("auth.submitSignup")}
          {!loading && <Arrow className="h-4 w-4 transition group-hover:translate-x-0.5" />}
        </button>
      </form>

      <p className="text-center text-xs text-foreground-subtle">
        {t("auth.signupLegal")}
      </p>
    </div>
  );
}
