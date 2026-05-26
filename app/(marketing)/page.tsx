import Link from "next/link";
import { ArrowRight, Zap, TrendingUp, FileSearch, Users, ShieldCheck, Cpu } from "lucide-react";

const FEATURES = [
  { icon: FileSearch, label: "Tender Analysis",      desc: "Upload any PDF tender. AI extracts requirements, risks, BOQ items, and penalties in under 60 seconds." },
  { icon: Zap,        label: "Proposal Generation",  desc: "Technical and financial proposals written by AI — method statements, scope documents, cost breakdowns." },
  { icon: TrendingUp, label: "Live Pricing",          desc: "Steel, cement, copper, fuel — tracked daily. AI adjusts your tender pricing when markets move." },
  { icon: Users,      label: "Vendor Intelligence",   desc: "Compare supplier quotes, delivery times, and ratings side by side. AI recommends the best fit per BOQ item." },
  { icon: ShieldCheck,label: "Risk Detection",        desc: "Dangerous clauses, low margins, short execution windows flagged before you submit." },
  { icon: Cpu,        label: "AI Copilot",            desc: "Ask anything about your tenders, pricing, or vendors in plain language. Contextual, instant answers." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>

      {/* Floating nav */}
      <header className="sticky top-5 z-50 mx-auto max-w-5xl px-4">
        <nav
          className="flex items-center justify-between rounded-full px-6 py-3 backdrop-blur-md"
          style={{ background: "oklch(99% 0.004 75 / 0.85)", boxShadow: "var(--shadow-nav)" }}
        >
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md" style={{ background: "var(--color-accent)" }}>
              <span className="text-[10px] font-bold text-white">T</span>
            </div>
            <span className="text-sm font-semibold" style={{ color: "var(--color-text-1)" }}>Tender.ai</span>
          </div>

          <div className="hidden items-center gap-6 md:flex">
            {["Features", "Pricing", "About"].map((item) => (
              <a key={item} href="#" className="text-sm transition-colors hover:opacity-80" style={{ color: "var(--color-text-2)" }}>
                {item}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-sm font-medium" style={{ color: "var(--color-text-2)" }}>
              Sign in
            </Link>
            <Link href="/dashboard" className="btn-primary text-sm px-4 py-2">
              Get started
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-6 pb-24 pt-24 text-center">
        <div className="badge badge-ai mx-auto mb-6 w-fit">
          <span className="h-1.5 w-1.5 rounded-full animate-pulse-soft" style={{ background: "var(--color-ai)" }} />
          AI-native construction intelligence
        </div>

        <h1
          className="mx-auto max-w-3xl text-balance text-5xl font-semibold leading-tight"
          style={{ color: "var(--color-text-1)", letterSpacing: "-0.02em" }}
        >
          Win more tenders.
          <br />
          <span style={{ color: "var(--color-accent)" }}>Without the manual work.</span>
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-lg" style={{ color: "var(--color-text-2)", lineHeight: "1.7" }}>
          Tender.ai analyzes RFPs, generates proposals, tracks live material pricing,
          and compares vendors — so your team spends time winning, not processing.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link href="/dashboard" className="btn-primary px-6 py-3 text-base">
            Start free trial
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/dashboard" className="btn-secondary px-6 py-3 text-base">
            See a demo
          </Link>
        </div>

        <p className="mt-4 text-sm" style={{ color: "var(--color-text-3)" }}>
          14-day free trial. No credit card required.
        </p>

        {/* Hero card */}
        <div className="mt-16 overflow-hidden rounded-[24px] text-left" style={{ border: "1px solid var(--color-border)", background: "var(--color-surface)" }}>
          <div className="flex items-center gap-3 px-6 py-4" style={{ borderBottom: "1px solid var(--color-border-sub)" }}>
            <div className="flex gap-1.5">
              {["#f87171","#fbbf24","#34d399"].map((c) => <div key={c} className="h-3 w-3 rounded-full" style={{ background: c }} />)}
            </div>
            <span className="text-xs font-medium" style={{ color: "var(--color-text-3)" }}>Al Wasl Road Infrastructure — Phase 3.pdf</span>
          </div>
          <div className="grid md:grid-cols-3 divide-x" style={{ borderColor: "var(--color-border-sub)" }}>
            {[
              { label: "Estimated Value", value: "AED 4,200,000", badge: "AI estimated", badgeType: "badge-ai" },
              { label: "Risk Level", value: "2 Critical Risks", badge: "Review required", badgeType: "badge-danger" },
              { label: "BOQ Items Extracted", value: "47 line items", badge: "Ready to price", badgeType: "badge-success" },
            ].map(({ label, value, badge, badgeType }) => (
              <div key={label} className="px-6 py-5">
                <p className="text-xs font-medium mb-1" style={{ color: "var(--color-text-3)" }}>{label}</p>
                <p className="text-xl font-semibold mb-2" style={{ color: "var(--color-text-1)" }}>{value}</p>
                <span className={`badge ${badgeType}`}>{badge}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-5xl px-6 pb-32">
        <p className="mb-2 text-center text-xs font-medium uppercase tracking-widest" style={{ color: "var(--color-text-3)" }}>Platform</p>
        <h2 className="mb-14 text-center text-3xl font-semibold text-balance" style={{ color: "var(--color-text-1)" }}>
          Everything your estimating team needs
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, label, desc }) => (
            <div key={label} className="card p-6">
              <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-[10px]" style={{ background: "var(--color-accent-muted)" }}>
                <Icon className="h-4.5 w-4.5" strokeWidth={1.5} style={{ color: "var(--color-accent)" }} />
              </div>
              <h3 className="mb-2 text-base font-semibold" style={{ color: "var(--color-text-1)" }}>{label}</h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-2)" }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-5xl px-6 pb-32">
        <div className="rounded-[28px] px-12 py-16 text-center" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
          <h2 className="mb-4 text-3xl font-semibold" style={{ color: "var(--color-text-1)" }}>
            Ready to transform your tender process?
          </h2>
          <p className="mb-8 text-lg" style={{ color: "var(--color-text-2)" }}>
            Join construction companies already saving 12+ hours per tender.
          </p>
          <Link href="/dashboard" className="btn-primary px-8 py-3.5 text-base rounded-full">
            Start your free trial
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t px-6 py-8 text-center text-sm" style={{ borderColor: "var(--color-border)", color: "var(--color-text-3)" }}>
        © 2026 Tender.ai — AI Construction Intelligence Platform
      </footer>
    </div>
  );
}
