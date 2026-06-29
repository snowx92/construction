"use client";

import { useState } from "react";
import { mockPrices } from "@/data/mock";
import { TrendingUp, TrendingDown, Minus, RefreshCw, Zap } from "lucide-react";
import { COUNTRIES, COUNTRY_LIST, convertFromAED, type CountryCode } from "@/lib/countries";
import { useT } from "@/lib/i18n";
import { useLocalizedPrices } from "@/lib/i18n/use-localized-data";
import { cn } from "@/lib/utils";

function MiniSparkline({ data, trend }: { data: { price: number }[]; trend: "up" | "down" | "stable" }) {
  const prices = data.map((d) => d.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  const w = 80; const h = 28;
  const pts = prices
    .map((p, i) => `${(i / (prices.length - 1)) * w},${h - ((p - min) / range) * h}`)
    .join(" ");
  const color = trend === "up" ? "rgb(var(--danger))" : trend === "down" ? "rgb(var(--success))" : "rgb(var(--foreground-subtle))";
  return (
    <svg width={w} height={h} className="overflow-visible">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function LivePricingPage() {
  const t = useT();
  const CATEGORIES = [t("pricingPage.catAll"), t("pricingPage.catSteel"), t("pricingPage.catCement"), t("pricingPage.catElectrical"), t("pricingPage.catConcrete"), t("pricingPage.catFuel"), t("pricingPage.catPipes"), t("pricingPage.catCladding")];
  const [country, setCountry] = useState<CountryCode>("eg");
  const [activeCategory, setActiveCategory] = useState("All");

  const cfg = COUNTRIES[country];

  // Apply Arabic name/category translations when locale is AR
  const arPrices = useLocalizedPrices(mockPrices);

  // Convert base AED prices to selected market currency
  const localised = arPrices.map((p) => ({
    ...p,
    currentPrice: Math.round(convertFromAED(p.currentPrice, country) * 100) / 100,
    marketPrice:  Math.round(convertFromAED(p.marketPrice,  country) * 100) / 100,
    sparkline:    p.sparkline.map((s) => ({ ...s, price: convertFromAED(s.price, country) })),
  }));

  const filtered = activeCategory === "All" ? localised : localised.filter((p) => p.category === activeCategory);
  const movers = localised.filter((p) => p.trend !== "stable").sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent));

  return (
    <div className="mx-auto max-w-[1200px] px-8 py-10">

      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest mb-1 text-foreground-subtle">{t("pricingPage.subtitle")}</p>
          <h1 className="text-3xl font-semibold text-foreground">{t("pricingPage.title")}</h1>
          <p className="mt-1 text-sm text-foreground-muted">
            {mockPrices.length} {t("pricingPage.materials")} · {cfg.flag} {cfg.name} {t("pricingPage.market")} ({cfg.currency})
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-foreground-subtle">
            <RefreshCw className="h-3 w-3" strokeWidth={1.5} />
            {t("pricingPage.lastUpdated")}
          </div>
          <button className="inline-flex items-center gap-2 h-10 px-5 rounded-[var(--radius-pill)] bg-primary text-white text-sm font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] transition-all duration-500 ease-out hover:bg-primary-hover hover:scale-[1.02]">
            <Zap className="h-4 w-4" strokeWidth={1.5} />
            {t("pricingPage.aiPriceReport")}
          </button>
        </div>
      </div>

      {/* Market switcher */}
      <div className="mb-6 flex items-center justify-between gap-4 rounded-[14px] p-3 bg-surface-2 border border-black/[0.06]">
        <div className="flex items-center gap-3 px-2">
          <p className="text-xs font-medium text-foreground-muted">{t("common.market")}</p>
          <p className="text-[10px] text-foreground-subtle">
            {cfg.currency} · {cfg.sources[0]}
          </p>
        </div>
        <div className="flex gap-1 rounded-[10px] p-1 bg-surface border border-black/[0.05]">
          {COUNTRY_LIST.map((c) => {
            const active = country === c.code;
            return (
              <button
                key={c.code}
                onClick={() => setCountry(c.code)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-xs font-medium transition-all",
                  active ? "bg-primary text-white" : "text-foreground-muted"
                )}
              >
                <span className="text-sm leading-none">{c.flag}</span>
                {c.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* AI alert banner */}
      <div className="mb-8 rounded-[16px] px-5 py-4 flex items-start gap-4 bg-primary-soft" style={{ border: "1px solid rgb(var(--primary) / 0.2)" }}>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-soft border border-primary">
          <Zap className="h-4 w-4 text-primary" strokeWidth={1.5} />
        </div>
        <div>
          <p className="text-sm font-semibold mb-0.5 text-foreground">{t("pricingPage.alertTitle", { country: cfg.name })}</p>
          <p className="text-sm text-foreground-muted">
            {t("pricingPage.alertBody")}
          </p>
        </div>
      </div>

      {/* Movers */}
      <div className="mb-8">
        <p className="text-xs font-medium uppercase tracking-widest mb-4 text-foreground-subtle">{t("pricingPage.significantMovers")} · {cfg.currency}</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {movers.slice(0, 4).map((p) => (
            <div key={p.id} className="card p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-xs font-medium mb-0.5 text-foreground">{p.name}</p>
                  <p className="text-xs text-foreground-subtle">{p.unit} · {p.category}</p>
                </div>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 shrink-0 rounded-[var(--radius-pill)] px-2.5 py-0.5 text-xs font-medium",
                    p.trend === "up" ? "bg-danger-soft text-danger" : "bg-success-soft text-success"
                  )}
                >
                  {p.changePercent > 0 ? "+" : ""}{p.changePercent.toFixed(1)}%
                </span>
              </div>
              <div className="mb-3">
                <p className="text-2xl font-semibold text-foreground">
                  {p.currentPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </p>
                <p className="text-[10px] text-foreground-subtle">{cfg.currency} / {p.unit}</p>
              </div>
              <MiniSparkline data={p.sparkline} trend={p.trend} />
            </div>
          ))}
        </div>
      </div>

      {/* Category filter */}
      <div className="mb-5 flex gap-2 flex-wrap">
        {CATEGORIES.map((cat) => {
          const active = activeCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "inline-flex items-center gap-1 rounded-[var(--radius-pill)] px-3.5 py-1.5 text-xs font-medium cursor-pointer transition-colors border",
                active ? "bg-primary text-white border-primary" : "bg-surface-2 text-foreground-muted border-black/[0.06]"
              )}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Full table */}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-black/[0.05]">
              {[t("pricingPage.material"), t("project.financial.category"), `${t("pricingPage.currentPrice")} (${cfg.currency})`, `${t("pricingPage.marketPrice")} (${cfg.currency})`, t("pricingPage.change"), t("pricingPage.trend"), t("pricingPage.updated")].map((h) => (
                <th key={h} className="px-5 py-3.5 text-left text-xs font-medium text-foreground-subtle">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-black/[0.05]">
            {filtered.map((p) => (
              <tr key={p.id} className="hover:bg-black/[0.025]">
                <td className="px-5 py-3.5">
                  <p className="text-xs font-medium text-foreground">{p.name}</p>
                  <p className="text-xs text-foreground-subtle">{p.unit}</p>
                </td>
                <td className="px-5 py-3.5">
                  <span className="inline-flex items-center gap-1 rounded-[var(--radius-pill)] px-2.5 py-0.5 text-xs font-medium bg-surface-2 text-foreground-muted border border-black/[0.06]">{p.category}</span>
                </td>
                <td className="px-5 py-3.5 text-xs font-mono font-medium text-foreground">
                  {p.currentPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </td>
                <td className="px-5 py-3.5 text-xs font-mono text-foreground-muted">
                  {p.marketPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </td>
                <td className="px-5 py-3.5">
                  <span
                    className={cn(
                      "text-xs font-semibold",
                      p.changePercent > 0 ? "text-danger" : p.changePercent < 0 ? "text-success" : "text-foreground-subtle"
                    )}
                  >
                    {p.changePercent > 0 ? "+" : ""}{p.changePercent.toFixed(1)}%
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  {p.trend === "up"     && <TrendingUp   className="h-4 w-4 text-danger" strokeWidth={1.5} />}
                  {p.trend === "down"   && <TrendingDown className="h-4 w-4 text-success" strokeWidth={1.5} />}
                  {p.trend === "stable" && <Minus        className="h-4 w-4 text-foreground-subtle" strokeWidth={1.5} />}
                </td>
                <td className="px-5 py-3.5 text-xs text-foreground-subtle">{p.lastUpdated}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
