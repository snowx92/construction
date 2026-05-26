"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { dictionaries, type Lang } from "./translations";

interface LocaleContextValue {
  lang: Lang;
  dir:  "ltr" | "rtl";
  setLang: (l: Lang) => void;
  /** Translate a dotted key like "project.tabs.overview". Falls back to the key. */
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const LocaleContext = createContext<LocaleContextValue>({
  lang: "en",
  dir:  "ltr",
  setLang: () => {},
  t: (k) => k,
});

function resolve(dict: any, key: string): unknown {
  const parts = key.split(".");
  let cur: any = dict;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
}

function format(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, k) => (vars[k] != null ? String(vars[k]) : `{${k}}`));
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  // Read stored preference on mount
  useEffect(() => {
    const stored = localStorage.getItem("cs-lang") as Lang | null;
    if (stored === "en" || stored === "ar") setLangState(stored);
  }, []);

  // Sync to <html> attributes
  useEffect(() => {
    const dir = lang === "ar" ? "rtl" : "ltr";
    if (typeof document !== "undefined") {
      document.documentElement.lang = lang;
      document.documentElement.dir = dir;
    }
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") localStorage.setItem("cs-lang", l);
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>): string => {
      const found = resolve(dictionaries[lang], key);
      const fallback = lang === "ar" ? resolve(dictionaries.en, key) : undefined;
      const tmpl = typeof found === "string" ? found : typeof fallback === "string" ? fallback : key;
      return format(tmpl, vars);
    },
    [lang]
  );

  const dir = lang === "ar" ? "rtl" : "ltr";

  return (
    <LocaleContext.Provider value={{ lang, dir, setLang, t }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  return useContext(LocaleContext);
}

/** Convenience hook returning just the translation function. */
export function useT() {
  return useLocale().t;
}
