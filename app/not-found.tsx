"use client";

import Link from "next/link";
import { Home } from "lucide-react";
import { useT } from "@/lib/i18n";

export default function NotFound() {
  const t = useT();
  return (
    <div className="flex min-h-screen items-center justify-center px-6 bg-background">
      <div className="text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full mx-auto mb-6 bg-danger-soft">
          <span className="text-3xl font-bold text-danger">404</span>
        </div>
        <h1 className="text-3xl font-bold mb-2 text-foreground">{t("notFound.title")}</h1>
        <p className="text-base mb-6 text-foreground-muted">
          {t("notFound.subtitle")}
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-5 h-10 rounded-[var(--radius-pill)] bg-primary text-white text-sm font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] transition-all duration-500 ease-out hover:bg-primary-hover hover:scale-[1.02]"
        >
          <Home className="h-4 w-4" strokeWidth={1.5} />
          {t("notFound.backToDashboard")}
        </Link>
      </div>
    </div>
  );
}
