"use client";

import { useLocale } from "@/lib/i18n";
import { Languages } from "lucide-react";

export function LanguageSwitcher() {
  const { lang, setLang, t } = useLocale();

  return (
    <div className="flex items-center gap-1 rounded-[var(--radius-sm)] p-0.5 bg-surface border border-black/[0.06]">
      <Languages className="h-3.5 w-3.5 mx-1.5 text-foreground-subtle" strokeWidth={1.5} />
      <button
        onClick={() => setLang("en")}
        className="px-2.5 py-1 rounded-[7px] text-xs font-medium transition-colors"
        style={lang === "en"
          ? { background: "rgb(var(--primary))", color: "white" }
          : { background: "transparent", color: "rgb(var(--foreground-muted))" }}
        aria-label={t("language.english")}
        title={t("language.english")}
      >
        {t("language.enShort")}
      </button>
      <button
        onClick={() => setLang("ar")}
        className="px-2.5 py-1 rounded-[7px] text-xs font-medium transition-colors"
        style={lang === "ar"
          ? { background: "rgb(var(--primary))", color: "white" }
          : { background: "transparent", color: "rgb(var(--foreground-muted))" }}
        aria-label={t("language.arabic")}
        title={t("language.arabic")}
      >
        {t("language.arShort")}
      </button>
    </div>
  );
}
