"use client";

/**
 * Locale-aware accessors for mock data.
 *
 * In English mode these are pass-throughs. In Arabic mode they overlay
 * AR translations (from `data/mock-ar.ts`) onto the base English object,
 * keyed by ID. Only translatable fields are overridden — non-translatable
 * fields (IDs, dates, numeric prices, file sizes) remain untouched.
 */

import { useMemo } from "react";
import { useLocale } from "./index";
import {
  tenderArOverrides,
  workspaceArOverrides,
  vendorArOverrides,
  insightArOverrides,
  priceArOverrides,
  materialArOverrides,
  unitArOverrides,
} from "@/data/mock-ar";
import type {
  Tender, ProjectWorkspace, Vendor, AIInsight, MaterialPrice,
} from "@/types";

/* Generic shallow-merge localizer. For nested fields with AR overrides
 * (e.g. tender.analysis), we deep-merge that specific field. */
function localizeTender(t: Tender): Tender {
  const ar = tenderArOverrides[t.id];
  if (!ar) return t;
  const { analysis: arAnalysis, ...arTop } = ar;
  const merged: Tender = { ...t, ...arTop };
  if (t.analysis && arAnalysis) {
    merged.analysis = { ...t.analysis, ...arAnalysis };
  }
  return merged;
}

function localizeWorkspace(w: ProjectWorkspace): ProjectWorkspace {
  const ar = workspaceArOverrides[w.id];
  return ar ? { ...w, ...ar } : w;
}

function localizeVendor(v: Vendor): Vendor {
  const ar = vendorArOverrides[v.id];
  const base = ar ? { ...v, ...ar } : v;
  return {
    ...base,
    priceItems: base.priceItems.map((p) => ({
      ...p,
      material: materialArOverrides[p.material] ?? p.material,
      unit:     unitArOverrides[p.unit] ?? p.unit,
    })),
  };
}

function localizeInsight(i: AIInsight): AIInsight {
  const ar = insightArOverrides[i.id];
  return ar ? { ...i, ...ar } : i;
}

function localizePrice(p: MaterialPrice): MaterialPrice {
  const ar = priceArOverrides[p.id];
  return ar ? { ...p, ...ar } : p;
}

/* ── Hooks ───────────────────────────────────────────────────────── */

export function useLocalizedTenders(tenders: Tender[]): Tender[] {
  const { lang } = useLocale();
  return useMemo(
    () => (lang === "ar" ? tenders.map(localizeTender) : tenders),
    [tenders, lang]
  );
}

export function useLocalizedTender(tender: Tender | null | undefined): Tender | null | undefined {
  const { lang } = useLocale();
  return useMemo(() => {
    if (!tender || lang !== "ar") return tender;
    return localizeTender(tender);
  }, [tender, lang]);
}

export function useLocalizedWorkspaces(ws: ProjectWorkspace[]): ProjectWorkspace[] {
  const { lang } = useLocale();
  return useMemo(
    () => (lang === "ar" ? ws.map(localizeWorkspace) : ws),
    [ws, lang]
  );
}

export function useLocalizedWorkspace(ws: ProjectWorkspace | null | undefined): ProjectWorkspace | null | undefined {
  const { lang } = useLocale();
  return useMemo(() => {
    if (!ws || lang !== "ar") return ws;
    return localizeWorkspace(ws);
  }, [ws, lang]);
}

export function useLocalizedVendors(vendors: Vendor[]): Vendor[] {
  const { lang } = useLocale();
  return useMemo(
    () => (lang === "ar" ? vendors.map(localizeVendor) : vendors),
    [vendors, lang]
  );
}

export function useLocalizedInsights(insights: AIInsight[]): AIInsight[] {
  const { lang } = useLocale();
  return useMemo(
    () => (lang === "ar" ? insights.map(localizeInsight) : insights),
    [insights, lang]
  );
}

export function useLocalizedPrices(prices: MaterialPrice[]): MaterialPrice[] {
  const { lang } = useLocale();
  return useMemo(
    () => (lang === "ar" ? prices.map(localizePrice) : prices),
    [prices, lang]
  );
}
