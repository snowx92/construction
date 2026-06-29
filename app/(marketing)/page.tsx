"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowRight, Zap, TrendingUp, FileSearch, Users, ShieldCheck, Cpu, Check, Upload, Brain, Trophy } from "lucide-react";
import { useT } from "@/lib/i18n";

const FEATURE_KEYS = [
  { icon: FileSearch, labelKey: "landing.feature1Label",      descKey: "landing.feature1Desc" },
  { icon: Zap,        labelKey: "landing.feature2Label",      descKey: "landing.feature2Desc" },
  { icon: TrendingUp, labelKey: "landing.feature3Label",      descKey: "landing.feature3Desc" },
  { icon: Users,      labelKey: "landing.feature4Label",      descKey: "landing.feature4Desc" },
  { icon: ShieldCheck,labelKey: "landing.feature5Label",      descKey: "landing.feature5Desc" },
  { icon: Cpu,        labelKey: "landing.feature6Label",      descKey: "landing.feature6Desc" },
];

const NAV_ITEM_KEYS = ["landing.navFeatures", "landing.navPricing", "landing.navAbout"];

const HERO_CARDS = [
  { labelKey: "landing.heroCard1Label", valueKey: "landing.heroCard1Value", badgeKey: "landing.heroCard1Badge", badgeCls: "bg-primary-soft text-primary" },
  { labelKey: "landing.heroCard2Label", valueKey: "landing.heroCard2Value", badgeKey: "landing.heroCard2Badge", badgeCls: "bg-danger-soft text-danger" },
  { labelKey: "landing.heroCard3Label", valueKey: "landing.heroCard3Value", badgeKey: "landing.heroCard3Badge", badgeCls: "bg-success-soft text-success" },
];

const STEPS = [
  { icon: Upload,    key: "1" },
  { icon: Brain,     key: "2" },
  { icon: Trophy,    key: "3" },
];

const PLANS = [
  {
    key: "starter",
    nameKey: "landing.planStarterName",
    priceKey: "landing.planStarterPrice",
    priceAnnualKey: "landing.planStarterPriceAnnual",
    descKey: "landing.planStarterDesc",
    features: ["landing.planStarterFeature1", "landing.planStarterFeature2", "landing.planStarterFeature3", "landing.planStarterFeature4"],
    ctaKey: "landing.planStarterCta",
    popular: false,
  },
  {
    key: "pro",
    nameKey: "landing.planProName",
    priceKey: "landing.planProPrice",
    priceAnnualKey: "landing.planProPriceAnnual",
    descKey: "landing.planProDesc",
    features: ["landing.planProFeature1", "landing.planProFeature2", "landing.planProFeature3", "landing.planProFeature4", "landing.planProFeature5"],
    ctaKey: "landing.planProCta",
    popular: true,
  },
  {
    key: "enterprise",
    nameKey: "landing.planEnterpriseName",
    priceKey: "landing.planEnterprisePrice",
    priceAnnualKey: "landing.planEnterprisePrice",
    descKey: "landing.planEnterpriseDesc",
    features: ["landing.planEnterpriseFeature1", "landing.planEnterpriseFeature2", "landing.planEnterpriseFeature3", "landing.planEnterpriseFeature4", "landing.planEnterpriseFeature5"],
    ctaKey: "landing.planEnterpriseCta",
    popular: false,
  },
];

function useInView(threshold = 0.15): [React.RefObject<HTMLDivElement>, boolean] {
  const ref = useRef<HTMLDivElement>(null!);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.unobserve(el);
        }
      },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);
  return [ref, inView];
}

function AnimatedSection({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const [ref, inView] = useInView(0.1);
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${inView ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

function AnimatedPricingCard({
  plan,
  annual,
  t,
  index,
}: {
  plan: (typeof PLANS)[number];
  annual: boolean;
  t: (key: string) => string;
  index: number;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotate, setRotate] = useState({ x: 0, y: 0 });

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setRotate({
      x: ((y - rect.height / 2) / rect.height) * -12,
      y: ((x - rect.width / 2) / rect.width) * 12,
    });
  }, []);

  const handleMouseLeave = useCallback(() => setRotate({ x: 0, y: 0 }), []);

  return (
    <div style={{ animationDelay: `${index * 150}ms` }} className="animate-slide-up opacity-0">
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: `perspective(1200px) rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)`,
          transition: "transform 0.15s ease-out",
        }}
        className={`relative flex flex-col rounded-[var(--radius-xl)] p-8 transition-all duration-300 ${
          plan.popular
            ? "border-2 border-primary bg-primary/[0.03] shadow-[0_0_30px_-5px_rgba(59,130,246,0.15)] hover:shadow-[0_0_40px_-5px_rgba(59,130,246,0.25)] scale-[1.02]"
            : "border border-black/[0.06] bg-surface hover:border-black/[0.12] hover:shadow-lg"
        }`}
      >
        {plan.popular && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 animate-pulse-soft">
            <span className="inline-flex items-center gap-1 rounded-[var(--radius-pill)] bg-primary px-4 py-1 text-xs font-semibold text-white shadow-sm">
              {t("landing.popular")}
            </span>
          </div>
        )}

        <div className={`${plan.popular ? "mt-2" : ""}`}>
          <h3 className="text-lg font-semibold text-foreground">{t(plan.nameKey)}</h3>
          <p className="mt-1 text-sm text-foreground-muted">{t(plan.descKey)}</p>

          <div className="mt-6 flex items-baseline gap-1">
            <span className="text-4xl font-bold text-foreground tracking-tight">
              {annual && plan.priceAnnualKey ? t(plan.priceAnnualKey) : t(plan.priceKey)}
            </span>
            {plan.key !== "enterprise" && (
              <span className="text-sm text-foreground-subtle">
                {annual ? "/yr" : "/mo"}
              </span>
            )}
          </div>

          {plan.key !== "enterprise" && annual && (
            <p className="mt-1 text-xs text-success font-medium">Save ~17%</p>
          )}
        </div>

        <div className="mt-8 space-y-3">
          {plan.features.map((fk) => (
            <div key={fk} className="flex items-start gap-3">
              <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Check className="h-3 w-3 text-primary" strokeWidth={3} />
              </div>
              <span className="text-sm text-foreground-muted">{t(fk)}</span>
            </div>
          ))}
        </div>

        <div className="mt-8">
          <Link
            href="/dashboard"
            className={`inline-flex w-full items-center justify-center gap-2 h-11 rounded-[var(--radius-pill)] text-sm font-medium transition-all duration-300 ${
              plan.popular
                ? "bg-primary text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] hover:bg-primary-hover hover:scale-[1.02]"
                : "border border-black/[0.08] bg-white text-foreground hover:bg-black/[0.03] hover:border-black/[0.15]"
            }`}
          >
            {t(plan.ctaKey)}
            <ArrowRight className={`h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5 ${plan.popular ? "" : ""}`} />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const t = useT();
  const [annual, setAnnual] = useState(false);

  return (
    <div className="min-h-screen bg-background">

      <header className="sticky top-5 z-50 mx-auto max-w-5xl px-4">
        <nav className="glass-strong flex items-center justify-between rounded-[var(--radius-pill)] px-6 py-3 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-[var(--radius-sm)] bg-primary">
              <span className="text-[10px] font-bold text-white">T</span>
            </div>
            <span className="text-sm font-semibold text-foreground">{t("landing.brand")}</span>
          </div>

          <div className="hidden items-center gap-6 md:flex">
            {NAV_ITEM_KEYS.map((key) => (
              <a key={key} href="#" className="text-sm text-foreground-muted transition-colors hover:text-foreground">
                {t(key)}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-sm font-medium text-foreground-muted">
              {t("landing.signIn")}
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 h-9 px-4 rounded-[var(--radius-pill)] bg-primary text-white text-sm font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] transition-all duration-500 ease-out hover:bg-primary-hover hover:scale-[1.02]"
            >
              {t("landing.getStarted")}
            </Link>
          </div>
        </nav>
      </header>

      <section className="mx-auto max-w-5xl px-6 pb-24 pt-24 text-center">
        <AnimatedSection delay={0}>
          <div className="inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] px-2.5 py-0.5 text-xs font-medium bg-primary-soft text-primary mx-auto mb-6 w-fit animate-pulse-soft">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-soft" />
            {t("landing.heroBadge")}
          </div>
        </AnimatedSection>

        <AnimatedSection delay={150}>
          <h1 className="mx-auto max-w-3xl text-balance text-5xl font-semibold leading-tight text-foreground tracking-tight">
            {t("landing.heroTitle1")}
            <br />
            <span className="bg-gradient-to-r from-primary to-[#8b5cf6] bg-clip-text text-transparent">{t("landing.heroTitle2")}</span>
          </h1>
        </AnimatedSection>

        <AnimatedSection delay={300}>
          <p className="mx-auto mt-6 max-w-xl text-lg text-foreground-muted leading-relaxed">
            {t("landing.heroSub")}
          </p>
        </AnimatedSection>

        <AnimatedSection delay={450}>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/dashboard"
              className="group inline-flex items-center gap-2 h-12 px-7 text-base rounded-[var(--radius-pill)] bg-primary text-white font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] transition-all duration-500 ease-out hover:bg-primary-hover hover:scale-[1.02]"
            >
              {t("landing.startFreeTrial")}
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/dashboard"
              className="group inline-flex items-center gap-2 h-12 px-7 text-base rounded-[var(--radius-pill)] bg-surface text-foreground border border-black/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] transition-all duration-500 ease-out hover:bg-black/[0.035]"
            >
              {t("landing.seeDemo")}
            </Link>
          </div>
        </AnimatedSection>

        <AnimatedSection delay={600}>
          <p className="mt-4 text-sm text-foreground-subtle">
            {t("landing.freeTrialNote")}
          </p>
        </AnimatedSection>

        <AnimatedSection delay={750}>
          <div className="mt-16 overflow-hidden rounded-[var(--radius-lg)] text-left glass border border-black/[0.06] transition-all duration-500 hover:shadow-lg">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-black/[0.05]">
              <div className="flex gap-1.5">
                {["#f87171","#fbbf24","#34d399"].map((c) => <div key={c} className="h-3 w-3 rounded-full" style={{ background: c }} />)}
              </div>
              <span className="text-xs font-medium text-foreground-subtle">{t("landing.heroFileName")}</span>
            </div>
            <div className="grid md:grid-cols-3 divide-x divide-black/[0.05]">
              {HERO_CARDS.map(({ labelKey, valueKey, badgeKey, badgeCls }, i) => (
                <div key={labelKey} className="px-6 py-5 transition-all duration-300 hover:bg-black/[0.02]" style={{ animationDelay: `${900 + i * 100}ms` }}>
                  <p className="eyebrow mb-1">{t(labelKey)}</p>
                  <p className="text-xl font-semibold mb-2 text-foreground">{t(valueKey)}</p>
                  <span className={`inline-flex items-center gap-1 rounded-[var(--radius-pill)] px-2.5 py-0.5 text-xs font-medium ${badgeCls}`}>{t(badgeKey)}</span>
                </div>
              ))}
            </div>
          </div>
        </AnimatedSection>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-32">
        <AnimatedSection>
          <p className="eyebrow text-center mb-2">{t("landing.featuresEyebrow")}</p>
          <h2 className="mb-14 text-center text-3xl font-semibold text-balance text-foreground">
            {t("landing.featuresTitle")}
          </h2>
        </AnimatedSection>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {FEATURE_KEYS.map(({ icon: Icon, labelKey, descKey }, i) => (
            <AnimatedSection key={labelKey} delay={i * 100}>
              <div className="card p-6 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
                <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] bg-accent-warm">
                  <Icon className="h-4.5 w-4.5 text-primary" strokeWidth={1.5} />
                </div>
                <h3 className="mb-2 text-base font-semibold text-foreground">{t(labelKey)}</h3>
                <p className="text-sm leading-relaxed text-foreground-muted">{t(descKey)}</p>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-32">
        <AnimatedSection>
          <p className="eyebrow text-center mb-2">{t("landing.sectionHowItWorks")}</p>
          <h2 className="mb-16 text-center text-3xl font-semibold text-balance text-foreground">
            {t("landing.sectionHowItWorks")} <span className="text-primary">— 3 simple steps</span>
          </h2>
        </AnimatedSection>

        <div className="relative grid gap-8 md:grid-cols-3">
          <div className="absolute left-0 right-0 top-16 hidden h-0.5 bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20 md:block" />

          {STEPS.map(({ icon: Icon, key }, i) => {
            const num = Number(key);
            return (
              <AnimatedSection key={key} delay={i * 200}>
                <div className="relative flex flex-col items-center text-center">
                  <div className="relative z-10 mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 border-2 border-primary/20 transition-all duration-300 hover:border-primary/50 hover:scale-110">
                    <Icon className="h-6 w-6 text-primary" strokeWidth={1.5} />
                  </div>
                  <div className="absolute top-0 -z-10 h-14 w-14 rounded-full bg-primary/5" />
                  <h3 className="mb-2 text-lg font-semibold text-foreground">{t(`landing.step${num}Title`)}</h3>
                  <p className="max-w-xs text-sm leading-relaxed text-foreground-muted">{t(`landing.step${num}Desc`)}</p>
                </div>
              </AnimatedSection>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-32">
        <AnimatedSection>
          <p className="eyebrow text-center mb-2">{t("landing.navPricing")}</p>
          <h2 className="mb-2 text-center text-3xl font-semibold text-balance text-foreground">
            {t("landing.pricingTitle")}
          </h2>
          <p className="mb-10 text-center text-foreground-muted">{t("landing.pricingSub")}</p>
        </AnimatedSection>

        <AnimatedSection delay={100}>
          <div className="mb-12 flex items-center justify-center gap-3">
            <span className={`text-sm font-medium transition-colors ${!annual ? "text-foreground" : "text-foreground-subtle"}`}>
              {t("landing.monthly")}
            </span>
            <button
              onClick={() => setAnnual((a) => !a)}
              className={`relative h-7 w-12 rounded-full transition-colors duration-300 ${
                annual ? "bg-primary" : "bg-black/[0.12]"
              }`}
            >
              <div
                className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition-transform duration-300 ${
                  annual ? "translate-x-6" : "translate-x-0.5"
                }`}
              />
            </button>
            <span className={`text-sm font-medium transition-colors ${annual ? "text-foreground" : "text-foreground-subtle"}`}>
              {t("landing.annually")}
              <span className="ml-1.5 rounded-[var(--radius-pill)] bg-success-soft px-2 py-0.5 text-[11px] font-semibold text-success">
                -17%
              </span>
            </span>
          </div>
        </AnimatedSection>

        <div className="grid gap-6 md:grid-cols-3 md:gap-8">
          {PLANS.map((plan, i) => (
            <AnimatedPricingCard key={plan.key} plan={plan} annual={annual} t={t} index={i} />
          ))}
        </div>

        <AnimatedSection delay={200}>
          <p className="mt-10 text-center text-sm text-foreground-subtle">
            {t("landing.freeTrialNote")}
          </p>
        </AnimatedSection>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-32">
        <AnimatedSection>
          <div className="rounded-[var(--radius-xl)] px-12 py-16 text-center glass border border-black/[0.06] transition-all duration-500 hover:shadow-xl">
            <h2 className="mb-4 text-3xl font-semibold text-foreground">
              {t("landing.ctaTitle")}
            </h2>
            <p className="mb-8 text-lg text-foreground-muted">
              {t("landing.ctaSub")}
            </p>
            <Link
              href="/dashboard"
              className="group inline-flex items-center gap-2 h-12 px-8 text-base rounded-[var(--radius-pill)] bg-primary text-white font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] transition-all duration-500 ease-out hover:bg-primary-hover hover:scale-[1.02]"
            >
              {t("landing.ctaButton")}
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            </Link>
          </div>
        </AnimatedSection>
      </section>

      <footer className="border-t border-black/[0.06] px-6 py-8 text-center text-sm text-foreground-subtle">
        {t("landing.footer")}
      </footer>
    </div>
  );
}
