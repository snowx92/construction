"use client";

import { useLocale } from "@/lib/i18n";
import { Languages } from "lucide-react";

export function LanguageSwitcher() {
  const { lang, setLang } = useLocale();

  return (
    <div className="flex items-center gap-1 rounded-[10px] p-0.5" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
      <Languages className="h-3.5 w-3.5 mx-1.5" strokeWidth={1.5} style={{ color: "var(--color-text-3)" }} />
      <button
        onClick={() => setLang("en")}
        className="px-2.5 py-1 rounded-[7px] text-xs font-medium transition-colors"
        style={lang === "en"
          ? { background: "var(--color-accent)", color: "white" }
          : { background: "transparent", color: "var(--color-text-2)" }}
        aria-label="English"
        title="English"
      >
        EN
      </button>
      <button
        onClick={() => setLang("ar")}
        className="px-2.5 py-1 rounded-[7px] text-xs font-medium transition-colors"
        style={lang === "ar"
          ? { background: "var(--color-accent)", color: "white" }
          : { background: "transparent", color: "var(--color-text-2)" }}
        aria-label="العربية"
        title="العربية"
      >
        ع
      </button>
    </div>
  );
}
