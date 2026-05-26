"use client";

import { useState } from "react";
import { mockPrices } from "@/data/mock";
import { TrendingUp, TrendingDown, Minus, RefreshCw, Zap } from "lucide-react";
import { COUNTRIES, COUNTRY_LIST, convertFromAED, type CountryCode } from "@/lib/countries";
import { useT } from "@/lib/i18n";
import { useLocalizedPrices } from "@/lib/i18n/use-localized-data";

function MiniSparkline({ data, trend }: { data: { price: number }[]; trend: "up" | "down" | "stable" }) {
  const prices = data.map((d) => d.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  const w = 80; const h = 28;
  const pts = prices
    .map((p, i) => `${(i / (prices.length - 1)) * w},${h - ((p - min) / range) * h}`)
    .join(" ");
  const color = trend === "up" ? "var(--color-danger)" : trend === "down" ? "var(--color-success)" : "var(--color-text-3)";
  return (
    <svg width={w} height={h} className="overflow-visible">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const CATEGORIES = ["All", "Steel", "Cement", "Electrical", "Concrete", "Fuel", "Pipes", "Cladding"];

export default function LivePricingPage() {
  const t = useT();
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
          <p className="text-xs font-medium uppercase tracking-widest mb-1" style={{ color: "var(--color-text-3)" }}>{t("pricingPage.subtitle")}</p>
          <h1 className="text-3xl font-semibold" style={{ color: "var(--color-text-1)" }}>{t("pricingPage.title")}</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--color-text-2)" }}>
            {mockPrices.length} {t("pricingPage.materials")} · {cfg.flag} {cfg.name} {t("pricingPage.market")} ({cfg.currency})
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--color-text-3)" }}>
            <RefreshCw className="h-3 w-3" strokeWidth={1.5} />
            {t("pricingPage.lastUpdated")}
          </div>
          <button className="btn-primary text-sm">
            <Zap className="h-4 w-4" strokeWidth={1.5} />
            {t("pricingPage.aiPriceReport")}
          </button>
        </div>
      </div>

      {/* Market switcher */}
      <div className="mb-6 flex items-center justify-between gap-4 rounded-[14px] p-3" style={{ background: "var(--color-panel)", border: "1px solid var(--color-border)" }}>
        <div className="flex items-center gap-3 px-2">
          <p className="text-xs font-medium" style={{ color: "var(--color-text-2)" }}>{t("common.market")}</p>
          <p className="text-[10px]" style={{ color: "var(--color-text-3)" }}>
            {cfg.currency} · {cfg.sources[0]}
          </p>
        </div>
        <div className="flex gap-1 rounded-[10px] p-1" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border-sub)" }}>
          {COUNTRY_LIST.map((c) => {
            const active = country === c.code;
            return (
              <button
                key={c.code}
                onClick={() => setCountry(c.code)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-xs font-medium transition-all"
                style={active
                  ? { background: "var(--color-accent)", color: "white" }
                  : { background: "transparent", color: "var(--color-text-2)" }}
              >
                <span className="text-sm leading-none">{c.flag}</span>
                {c.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* AI alert banner */}
      <div className="mb-8 rounded-[16px] px-5 py-4 flex items-start gap-4" style={{ background: "var(--color-ai-sub)", border: "1px solid oklch(70% 0.06 260 / 0.2)" }}>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full" style={{ background: "var(--color-ai-sub)", border: "1px solid var(--color-ai)" }}>
          <Zap className="h-4 w-4" strokeWidth={1.5} style={{ color: "var(--color-ai)" }} />
        </div>
        <div>
          <p className="text-sm font-semibold mb-0.5" style={{ color: "var(--color-text-1)" }}>{t("pricingPage.alertTitle", { country: cfg.name })}</p>
          <p className="text-sm" style={{ color: "var(--color-text-2)" }}>
            {t("pricingPage.alertBody")}
          </p>
        </div>
      </div>

      {/* Movers */}
      <div className="mb-8">
        <p className="text-xs font-medium uppercase tracking-widest mb-4" style={{ color: "var(--color-text-3)" }}>{t("pricingPage.significantMovers")} · {cfg.currency}</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {movers.slice(0, 4).map((p) => (
            <div key={p.id} className="card p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-xs font-medium mb-0.5" style={{ color: "var(--color-text-1)" }}>{p.name}</p>
                  <p className="text-xs" style={{ color: "var(--color-text-3)" }}>{p.unit} · {p.category}</p>
                </div>
                <span
                  className="badge shrink-0"
                  style={{
                    background: p.trend === "up" ? "var(--color-danger-sub)" : "var(--color-success-sub)",
                    color:      p.trend === "up" ? "var(--color-danger)"     : "var(--color-success)",
                  }}
                >
                  {p.changePercent > 0 ? "+" : ""}{p.changePercent.toFixed(1)}%
                </span>
              </div>
              <div className="mb-3">
                <p className="text-2xl font-semibold" style={{ color: "var(--color-text-1)" }}>
                  {p.currentPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </p>
                <p className="text-[10px]" style={{ color: "var(--color-text-3)" }}>{cfg.currency} / {p.unit}</p>
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
              className="badge cursor-pointer transition-colors"
              style={{
                padding: "6px 14px",
                fontSize: "0.75rem",
                background: active ? "var(--color-accent)" : "var(--color-panel)",
                color:      active ? "white" : "var(--color-text-2)",
                border: `1px solid ${active ? "var(--color-accent)" : "var(--color-border)"}`,
              }}
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
            <tr style={{ borderBottom: "1px solid var(--color-border-sub)" }}>
              {[t("pricingPage.material"), t("project.financial.category"), `${t("pricingPage.currentPrice")} (${cfg.currency})`, `${t("pricingPage.marketPrice")} (${cfg.currency})`, t("pricingPage.change"), t("pricingPage.trend"), t("pricingPage.updated")].map((h) => (
                <th key={h} className="px-5 py-3.5 text-left text-xs font-medium" style={{ color: "var(--color-text-3)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: "var(--color-border-sub)" }}>
            {filtered.map((p) => (
              <tr key={p.id} className="hover:bg-sand-50/40">
                <td className="px-5 py-3.5">
                  <p className="text-xs font-medium" style={{ color: "var(--color-text-1)" }}>{p.name}</p>
                  <p className="text-xs" style={{ color: "var(--color-text-3)" }}>{p.unit}</p>
                </td>
                <td className="px-5 py-3.5">
                  <span className="badge badge-neutral text-xs">{p.category}</span>
                </td>
                <td className="px-5 py-3.5 text-xs font-mono font-medium" style={{ color: "var(--color-text-1)" }}>
                  {p.currentPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </td>
                <td className="px-5 py-3.5 text-xs font-mono" style={{ color: "var(--color-text-2)" }}>
                  {p.marketPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </td>
                <td className="px-5 py-3.5">
                  <span
                    className="text-xs font-semibold"
                    style={{ color: p.changePercent > 0 ? "var(--color-danger)" : p.changePercent < 0 ? "var(--color-success)" : "var(--color-text-3)" }}
                  >
                    {p.changePercent > 0 ? "+" : ""}{p.changePercent.toFixed(1)}%
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  {p.trend === "up"     && <TrendingUp   className="h-4 w-4" style={{ color: "var(--color-danger)"  }} strokeWidth={1.5} />}
                  {p.trend === "down"   && <TrendingDown className="h-4 w-4" style={{ color: "var(--color-success)"}} strokeWidth={1.5} />}
                  {p.trend === "stable" && <Minus        className="h-4 w-4" style={{ color: "var(--color-text-3)"}} strokeWidth={1.5} />}
                </td>
                <td className="px-5 py-3.5 text-xs" style={{ color: "var(--color-text-3)" }}>{p.lastUpdated}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
