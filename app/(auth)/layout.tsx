"use client";

import { Building2, ShieldCheck, Sparkles, MapPin } from "lucide-react";
import Image from "next/image";
import { useLocale } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/layout/language-switcher";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { t, dir } = useLocale();

  return (
    <div className="grid min-h-screen w-full grid-cols-1 lg:grid-cols-2" dir={dir}>
      {/* Hero panel — Oman landscape */}
      <div className="relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between p-12 text-white">
        <Image
          src="https://images.unsplash.com/photo-1578895101408-1a36b834405b?w=1400&q=85&auto=format&fit=crop"
          alt="Sultan Qaboos Grand Mosque, Muscat, Oman"
          fill
          className="object-cover object-center"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/40 to-black/30" />

        <div className="relative flex items-center gap-2 text-lg font-semibold tracking-tight">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 backdrop-blur border border-white/20">
            <Building2 className="h-5 w-5" />
          </div>
          Tender.ai
        </div>

        <div className="relative space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-black/30 px-3 py-1 text-xs font-medium backdrop-blur">
            <MapPin className="h-3.5 w-3.5" />
            {t("auth.heroTagline")}
          </div>
          <h2 className="text-4xl font-bold leading-tight tracking-tight drop-shadow-lg">
            {t("auth.heroHeadline1")}<br />
            <span className="text-amber-300">{t("auth.heroHeadline2")}</span>
          </h2>
          <p className="max-w-md text-base text-white/85 drop-shadow">
            {t("auth.heroBody")}
          </p>

          <div className="grid max-w-md grid-cols-1 gap-3 pt-2">
            {([
              { icon: Sparkles, key: "auth.heroFeature1" },
              { icon: ShieldCheck, key: "auth.heroFeature2" },
              { icon: Building2, key: "auth.heroFeature3" },
            ] as const).map(({ icon: Icon, key }) => (
              <div key={key} className="flex items-center gap-3 rounded-xl border border-white/15 bg-black/25 px-4 py-3 backdrop-blur">
                <Icon className="h-4 w-4 shrink-0 text-amber-300" />
                <span className="text-sm text-white/90">{t(key)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative text-xs text-white/50">
          © {new Date().getFullYear()} Tender.ai · {t("auth.heroFooter")}
        </div>
      </div>

      {/* Form panel */}
      <div className="relative flex flex-col items-center justify-center bg-background px-6 py-12">
        {/* Language switcher top-right (or top-left in RTL) */}
        <div className={`absolute top-5 ${dir === "rtl" ? "left-5" : "right-5"}`}>
          <LanguageSwitcher />
        </div>
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
