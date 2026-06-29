"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, AlertCircle, CheckCircle2, ArrowRight, ArrowLeft } from "lucide-react";
import { useT, useLocale } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import { acceptInvite } from "@/lib/api/team";
import { ApiError } from "@/lib/api/client";

function AcceptInviteInner() {
  const t = useT();
  const { dir } = useLocale();
  const router = useRouter();
  const sp = useSearchParams();
  const { user, loading, refreshProfile, refreshClaims } = useAuth();

  const companyId = sp.get("companyId") ?? "";
  const inviteId  = sp.get("inviteId")  ?? "";
  const company   = sp.get("company")   ?? "";

  const [accepting, setAccepting] = useState(false);
  const [error, setError]         = useState("");
  const [done, setDone]           = useState(false);

  const Arrow = dir === "rtl" ? ArrowLeft : ArrowRight;

  useEffect(() => {
    if (!loading && !user) {
      const next = `/accept-invite?${sp.toString()}`;
      router.replace(`/login?next=${encodeURIComponent(next)}`);
    }
  }, [loading, user, router, sp]);

  async function handleAccept() {
    if (!companyId || !inviteId) {
      setError("Invite link is missing required parameters.");
      return;
    }
    setAccepting(true);
    setError("");
    try {
      await acceptInvite({ companyId, inviteId });
      await refreshProfile();
      await refreshClaims();
      setDone(true);
      setTimeout(() => router.replace("/dashboard"), 1200);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("team.acceptError"));
    } finally {
      setAccepting(false);
    }
  }

  if (loading || !user) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-foreground-subtle" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-md space-y-6" dir={dir}>
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {t("team.acceptTitle", { company: company || "the workspace" })}
        </h1>
        <p className="text-sm text-foreground-muted">{t("team.acceptBody")}</p>
      </div>

      {done ? (
        <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-700">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{t("team.acceptSuccess")}</span>
        </div>
      ) : (
        <>
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <button
            onClick={handleAccept}
            disabled={accepting}
            className="group flex w-full items-center justify-center gap-2 rounded-xl bg-[rgb(var(--primary))] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[rgb(var(--primary)/0.25)] transition hover:bg-[rgb(var(--primary-hover))] disabled:opacity-50"
          >
            {accepting && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("team.acceptCta")}
            {!accepting && <Arrow className="h-4 w-4" />}
          </button>
          <p className="text-center text-xs text-foreground-subtle">
            <Link href="/dashboard" className="hover:underline">← {t("nav.dashboard")}</Link>
          </p>
        </>
      )}
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={<Loader2 className="h-5 w-5 animate-spin text-foreground-subtle" />}>
      <AcceptInviteInner />
    </Suspense>
  );
}
