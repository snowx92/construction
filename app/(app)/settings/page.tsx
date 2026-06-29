"use client";

import { useState } from "react";
import { mockSubscription } from "@/data/mock";
import { useT } from "@/lib/i18n";
import { SettingsForm } from "@/components/forms/settings-form";
import { CompanyProfileForm } from "@/components/settings/company-profile-form";
import { TeamPanel } from "@/components/settings/team-panel";
import { User, Bell, CreditCard, Key, Palette, Users, Shield, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

const PLAN_LABELS: Record<string, string> = { starter: "Starter", pro: "Pro", business: "Business", enterprise: "Enterprise" };

const SECTIONS = [
  { id: "company-profile", labelKey: "settings.sectionCompanyProfile", icon: Building2 },
  { id: "preferences",   labelKey: "settings.sectionPreferences",      icon: User      },
  { id: "team",          labelKey: "settings.sectionTeam",             icon: Users     },
  { id: "notifications", labelKey: "settings.sectionNotifications",    icon: Bell      },
  { id: "billing",       labelKey: "settings.sectionBilling",          icon: CreditCard},
  { id: "api",           labelKey: "settings.sectionApi",              icon: Key       },
  { id: "appearance",    labelKey: "settings.sectionAppearance",       icon: Palette   },
  { id: "security",      labelKey: "settings.sectionSecurity",         icon: Shield    },
];

export default function SettingsPage() {
  const t = useT();
  const [activeSection, setActiveSection] = useState("company-profile");

  return (
    <div className="mx-auto max-w-[1200px] px-8 py-10">
      <div className="mb-8">
        <p className="text-xs font-medium uppercase tracking-widest mb-1 text-foreground-subtle">{t("settings.eyebrow")}</p>
        <h1 className="text-3xl font-semibold text-foreground">{t("nav.settings")}</h1>
      </div>

      <div className="grid gap-8 lg:grid-cols-4">

        {/* Nav */}
        <nav className="space-y-0.5">
          {SECTIONS.map(({ id, labelKey, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveSection(id)}
              className={cn(
                "w-full flex items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-left transition-colors hover:bg-black/[0.03]",
                id === activeSection ? "bg-primary-soft text-primary" : "text-foreground-muted"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" strokeWidth={1.5} />
              <span className="text-sm font-medium">{t(labelKey)}</span>
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="lg:col-span-3">
          {activeSection === "company-profile" && <CompanyProfileForm />}
          {activeSection === "preferences" && <SettingsForm />}

          {activeSection === "team" && <TeamPanel />}

          {activeSection === "notifications" && (
            <div className="card p-6">
              <h2 className="text-base font-semibold mb-5 text-foreground">{t("settings.notificationsTitle")}</h2>
              <p className="text-foreground-subtle">{t("settings.notificationsPlaceholder")}</p>
            </div>
          )}

          {activeSection === "billing" && (
            <div className="space-y-6">
              <div className="card p-6">
                <h2 className="text-base font-semibold mb-5 text-foreground">{t("settings.subscriptionTitle")}</h2>
                <div className="flex items-center justify-between rounded-[16px] px-5 py-4 mb-4 bg-primary-soft border border-primary-soft">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {PLAN_LABELS[mockSubscription.plan]} {t("settings.plan")}
                    </p>
                    <p className="text-xs mt-0.5 text-foreground-subtle">
                      {t("settings.renews")} {new Date(mockSubscription.currentPeriodEnd).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-[var(--radius-pill)] px-2.5 py-0.5 text-xs font-medium bg-success-soft text-success">{mockSubscription.status}</span>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="rounded-[12px] px-4 py-3 bg-surface-2">
                    <p className="text-xs mb-1 text-foreground-subtle">{t("settings.maxUsers")}</p>
                    <p className="text-sm font-semibold text-foreground">
                      {mockSubscription.maxUsers === "unlimited" ? t("settings.unlimited") : mockSubscription.maxUsers}
                    </p>
                  </div>
                  <div className="rounded-[12px] px-4 py-3 bg-surface-2">
                    <p className="text-xs mb-1 text-foreground-subtle">{t("common.projects")}</p>
                    <p className="text-sm font-semibold text-foreground">
                      {mockSubscription.maxProjects === "unlimited" ? t("settings.unlimited") : mockSubscription.maxProjects}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button className="inline-flex items-center gap-2 h-10 px-5 rounded-[var(--radius-pill)] bg-surface text-foreground border border-black/[0.06] text-sm font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] transition-all duration-500 ease-out hover:bg-black/[0.035]">{t("settings.manageBilling")}</button>
                  <button className="inline-flex items-center gap-2 h-10 px-5 rounded-[var(--radius-pill)] bg-primary text-white text-sm font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] transition-all duration-500 ease-out hover:bg-primary-hover hover:scale-[1.02]">{t("settings.upgradePlan")}</button>
                </div>
              </div>
            </div>
          )}

          {activeSection === "api" && (
            <div className="card p-6">
              <h2 className="text-base font-semibold mb-5 text-foreground">{t("settings.apiTitle")}</h2>
              <p className="text-foreground-subtle">{t("settings.apiPlaceholder")}</p>
            </div>
          )}

          {activeSection === "appearance" && (
            <div className="card p-6">
              <h2 className="text-base font-semibold mb-5 text-foreground">{t("settings.appearanceTitle")}</h2>
              <p className="text-foreground-subtle">{t("settings.appearancePlaceholder")}</p>
            </div>
          )}

          {activeSection === "security" && (
            <div className="card p-6">
              <h2 className="text-base font-semibold mb-5 text-foreground">{t("settings.securityTitle")}</h2>
              <p className="text-foreground-subtle">{t("settings.securityPlaceholder")}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
