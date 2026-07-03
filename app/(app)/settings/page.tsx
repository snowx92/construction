"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n";
import { SettingsForm } from "@/components/forms/settings-form";
import { CompanyProfileForm } from "@/components/settings/company-profile-form";
import { TeamPanel } from "@/components/settings/team-panel";
import { PasswordForm } from "@/components/settings/password-form";
import { CompanyDefaultsForm } from "@/components/settings/company-defaults-form";
import { NotificationPreferencesForm } from "@/components/settings/notification-preferences-form";
import { ApiKeysPanel } from "@/components/settings/api-keys-panel";
import { NeedsBackend } from "@/components/shared/needs-backend";
import { User, Bell, CreditCard, Key, Palette, Users, Shield, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

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
          {activeSection === "company-profile" && (
            <div className="space-y-6">
              <CompanyDefaultsForm />
              <CompanyProfileForm />
            </div>
          )}
          {activeSection === "preferences" && <SettingsForm />}

          {activeSection === "team" && <TeamPanel />}

          {activeSection === "notifications" && (
            <div className="card p-6">
              <h2 className="text-base font-semibold mb-5 text-foreground">{t("settings.notificationsTitle")}</h2>
              <NotificationPreferencesForm />
            </div>
          )}

          {activeSection === "billing" && (
            <div className="card p-6">
              <h2 className="text-base font-semibold mb-5 text-foreground">{t("settings.subscriptionTitle")}</h2>
              <NeedsBackend
                endpoint="GET /api/billing/subscription"
                what="Stripe subscription + plan info"
                details={`Also needs:\n• GET /api/billing/plan → { plan, features[], limits: { maxUsers, maxProjects, maxAiRequests } }\n• POST /api/billing/portal-session → { url } (Stripe customer portal redirect)\n• GET /api/billing/invoices → { invoices: [{ id, amount, currency, status, pdfUrl, createdAt }] }\n• POST /api/billing/checkout-session { plan } → { url } (Stripe checkout for upgrade)`}
              />
            </div>
          )}

          {activeSection === "api" && (
            <div className="card p-6">
              <h2 className="text-base font-semibold mb-5 text-foreground">{t("settings.apiTitle")}</h2>
              <ApiKeysPanel />
            </div>
          )}

          {activeSection === "appearance" && (
            <div className="card p-6">
              <h2 className="text-base font-semibold mb-5 text-foreground">{t("settings.appearanceTitle")}</h2>
              <p className="text-sm text-foreground-subtle">Language and RTL/LTR toggle live in the top-right of every page. Dark mode + theme controls will be added client-side.</p>
            </div>
          )}

          {activeSection === "security" && <PasswordForm />}
        </div>
      </div>
    </div>
  );
}
