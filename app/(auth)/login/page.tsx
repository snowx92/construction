"use client";

import { Suspense, useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, ArrowRight, ArrowLeft, AlertCircle } from "lucide-react";
import { useLocale } from "@/lib/i18n";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginPageInner />
    </Suspense>
  );
}

function LoginPageInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next");
  const { t, dir } = useLocale();
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
      await signInWithEmailAndPassword(auth, email, password);
      router.push(next || "/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message.replace("Firebase: ", "") : t("auth.submitLogin"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8" dir={dir}>
      <div className="space-y-2">
        <span className="inline-block rounded-full bg-[rgb(var(--primary-soft))] px-3 py-1 text-xs font-medium text-[rgb(var(--primary))]">
          {t("auth.loginWelcome")}
        </span>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {t("auth.loginHeadline")}
        </h1>
        <p className="text-sm text-foreground-muted">
          {t("auth.loginNoAccount")}{" "}
          <Link href="/signup" className="font-medium text-[rgb(var(--primary))] hover:underline">
            {t("auth.loginCta")}
          </Link>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-foreground-muted">{t("auth.emailLabel")}</label>
          <div className="relative">
            <Mail className={`pointer-events-none absolute top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-subtle ${dir === "rtl" ? "right-3" : "left-3"}`} />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("auth.emailPlaceholder")}
              className={`w-full rounded-xl border border-[rgb(var(--border)/0.1)] bg-white py-3 text-sm text-foreground outline-none transition focus:border-[rgb(var(--primary))] focus:ring-4 focus:ring-[rgb(var(--primary-soft))] ${dir === "rtl" ? "pr-10 pl-4" : "pl-10 pr-4"}`}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-foreground-muted">{t("auth.passwordLabel")}</label>
            <Link href="#" className="text-xs text-[rgb(var(--primary))] hover:underline">
              {t("auth.forgotPassword")}
            </Link>
          </div>
          <div className="relative">
            <Lock className={`pointer-events-none absolute top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-subtle ${dir === "rtl" ? "right-3" : "left-3"}`} />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={`w-full rounded-xl border border-[rgb(var(--border)/0.1)] bg-white py-3 text-sm text-foreground outline-none transition focus:border-[rgb(var(--primary))] focus:ring-4 focus:ring-[rgb(var(--primary-soft))] ${dir === "rtl" ? "pr-10 pl-4" : "pl-10 pr-4"}`}
            />
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
          disabled={loading}
          className="group flex w-full items-center justify-center gap-2 rounded-xl bg-[rgb(var(--primary))] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[rgb(var(--primary)/0.25)] transition hover:bg-[rgb(var(--primary-hover))] disabled:opacity-50"
        >
          {loading ? t("auth.signingIn") : t("auth.submitLogin")}
          {!loading && <Arrow className="h-4 w-4 transition group-hover:translate-x-0.5" />}
        </button>
      </form>

      <p className="text-center text-xs text-foreground-subtle">
        {t("auth.loginLegal")}
      </p>
    </div>
  );
}
