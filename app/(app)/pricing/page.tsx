"use client";

import { useMemo, useState } from "react";
import { TrendingUp, TrendingDown, Minus, RefreshCw, Loader2, AlertCircle } from "lucide-react";
import { COUNTRIES, COUNTRY_LIST, type CountryCode } from "@/lib/countries";
import { useT } from "@/lib/i18n";
import { useMarketPrices } from "@/lib/use-market-prices";
import { cn } from "@/lib/utils";
import type { MarketPrice } from "@/lib/api/types";

function MiniSparkline({ trend }: { trend: MarketPrice["trend"] }) {
  const color = trend === "up" ? "rgb(var(--danger))" : trend === "down" ? "rgb(var(--success))" : "rgb(var(--foreground-subtle))";
  return (
    <svg width={80} height={28} className="overflow-visible">
      <polyline
        points={trend === "up" ? "0,24 40,12 80,4" : trend === "down" ? "0,4 40,16 80,24" : "0,14 40,14 80,14"}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function apiCountry(code: CountryCode): string {
  return code === "om" ? "OM" : "EG";
}

export default function LivePricingPage() {
  const t = useT();
  const CATEGORIES = [
    t("pricingPage.catAll"),
    t("pricingPage.catSteel"),
    t("pricingPage.catCement"),
    t("pricingPage.catElectrical"),
    t("pricingPage.catConcrete"),
    t("pricingPage.catFuel"),
    t("pricingPage.catPipes"),
    t("pricingPage.catCladding"),
  ];
  const CATEGORY_MAP: Record<string, string> = {
    [t("pricingPage.catSteel")]: "Steel",
    [t("pricingPage.catCement")]: "Cement",
    [t("pricingPage.catElectrical")]: "Electrical",
    [t("pricingPage.catConcrete")]: "Concrete",
    [t("pricingPage.catFuel")]: "Fuel",
    [t("pricingPage.catPipes")]: "Pipes",
    [t("pricingPage.catCladding")]: "Cladding",
  };

  const [country, setCountry] = useState<CountryCode>("om");
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0]);

  const cfg = COUNTRIES[country];
  const { prices, loading, error } = useMarketPrices(apiCountry(country), 50);

  const lastUpdated = useMemo(() => {
    const dates = prices.map((p) => p.updatedAt).filter(Boolean) as string[];
    if (!dates.length) return null;
    return dates.sort().reverse()[0];
  }, [prices]);

  const filtered = useMemo(() => {
    if (activeCategory === CATEGORIES[0]) return prices;
    const cat = CATEGORY_MAP[activeCategory];
    return prices.filter((p) => p.category === cat);
  }, [prices, activeCategory, CATEGORIES, CATEGORY_MAP]);

  const movers = useMemo(
    () => [...prices].filter((p) => p.trend !== "stable").sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent)),
    [prices],
  );

  return (
    <div className="mx-auto max-w-[1200px] px-8 py-10">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest mb-1 text-foreground-subtle">{t("pricingPage.subtitle")}</p>
          <h1 className="text-3xl font-semibold text-foreground">{t("pricingPage.title")}</h1>
          <p className="mt-1 text-sm text-foreground-muted">
            {prices.length} {t("pricingPage.materials")} · {cfg.flag} {cfg.name} {t("pricingPage.market")} ({cfg.currency})
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-foreground-subtle">
            <RefreshCw className="h-3 w-3" strokeWidth={1.5} />
            {lastUpdated
              ? new Date(lastUpdated).toLocaleString()
              : t("pricingPage.lastUpdated")}
          </div>
        </div>
      </div>

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

      {error && (
        <div className="mb-6 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-foreground-subtle" />
        </div>
      ) : (
        <>
          <div className="mb-8">
            <p className="text-xs font-medium uppercase tracking-widest mb-4 text-foreground-subtle">
              {t("pricingPage.significantMovers")} · {cfg.currency}
            </p>
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
                      {p.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-[10px] text-foreground-subtle">{p.currency || cfg.currency} / {p.unit}</p>
                  </div>
                  <MiniSparkline trend={p.trend} />
                </div>
              ))}
            </div>
          </div>

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

          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/[0.05]">
                  {[t("pricingPage.material"), t("project.financial.category"), `${t("pricingPage.currentPrice")} (${cfg.currency})`, t("pricingPage.change"), t("pricingPage.trend"), t("pricingPage.updated")].map((h) => (
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
                      {p.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
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
                    <td className="px-5 py-3.5 text-xs text-foreground-subtle">
                      {p.updatedAt ? new Date(p.updatedAt).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
