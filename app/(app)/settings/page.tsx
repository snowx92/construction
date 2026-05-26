"use client";

import { useState } from "react";
import { mockSubscription } from "@/data/mock";
import { SettingsForm } from "@/components/forms/settings-form";
import { CompanyProfileForm } from "@/components/settings/company-profile-form";
import { User, Bell, CreditCard, Key, Palette, Users, Shield, Building2 } from "lucide-react";

const PLAN_LABELS: Record<string, string> = { starter: "Starter", pro: "Pro", business: "Business", enterprise: "Enterprise" };

const SECTIONS = [
  { id: "company-profile", label: "Company Profile", icon: Building2 },
  { id: "preferences",   label: "Preferences",      icon: User      },
  { id: "team",          label: "Team",             icon: Users     },
  { id: "notifications", label: "Notifications",    icon: Bell      },
  { id: "billing",       label: "Billing",          icon: CreditCard},
  { id: "api",           label: "API Keys",         icon: Key       },
  { id: "appearance",    label: "Appearance",       icon: Palette   },
  { id: "security",      label: "Security",         icon: Shield    },
];

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState("company-profile");

  return (
    <div className="mx-auto max-w-[1200px] px-8 py-10">
      <div className="mb-8">
        <p className="text-xs font-medium uppercase tracking-widest mb-1" style={{ color: "var(--color-text-3)" }}>Configuration</p>
        <h1 className="text-3xl font-semibold" style={{ color: "var(--color-text-1)" }}>Settings</h1>
      </div>

      <div className="grid gap-8 lg:grid-cols-4">

        {/* Nav */}
        <nav className="space-y-0.5">
          {SECTIONS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveSection(id)}
              className="w-full flex items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-left transition-colors hover:bg-sand-100/60"
              style={
                id === activeSection
                  ? { background: "var(--color-accent-muted)", color: "var(--color-accent)" }
                  : { color: "var(--color-text-2)" }
              }
            >
              <Icon className="h-4 w-4 shrink-0" strokeWidth={1.5} />
              <span className="text-sm font-medium">{label}</span>
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="lg:col-span-3">
          {activeSection === "company-profile" && <CompanyProfileForm />}
          {activeSection === "preferences" && <SettingsForm />}

          {activeSection === "team" && (
            <div className="card p-6">
              <h2 className="text-base font-semibold mb-5" style={{ color: "var(--color-text-1)" }}>Team Management</h2>
              <p style={{ color: "var(--color-text-3)" }}>Team management coming soon...</p>
            </div>
          )}

          {activeSection === "notifications" && (
            <div className="card p-6">
              <h2 className="text-base font-semibold mb-5" style={{ color: "var(--color-text-1)" }}>Advanced Notifications</h2>
              <p style={{ color: "var(--color-text-3)" }}>Advanced notification settings coming soon...</p>
            </div>
          )}

          {activeSection === "billing" && (
            <div className="space-y-6">
              <div className="card p-6">
                <h2 className="text-base font-semibold mb-5" style={{ color: "var(--color-text-1)" }}>Subscription</h2>
                <div className="flex items-center justify-between rounded-[16px] px-5 py-4 mb-4" style={{ background: "var(--color-accent-muted)", border: "1px solid var(--color-accent-sub)" }}>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "var(--color-text-1)" }}>
                      {PLAN_LABELS[mockSubscription.plan]} Plan
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--color-text-3)" }}>
                      Renews {new Date(mockSubscription.currentPeriodEnd).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="badge badge-success">{mockSubscription.status}</span>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="rounded-[12px] px-4 py-3" style={{ background: "var(--color-panel)" }}>
                    <p className="text-xs mb-1" style={{ color: "var(--color-text-3)" }}>Max users</p>
                    <p className="text-sm font-semibold" style={{ color: "var(--color-text-1)" }}>
                      {mockSubscription.maxUsers === "unlimited" ? "Unlimited" : mockSubscription.maxUsers}
                    </p>
                  </div>
                  <div className="rounded-[12px] px-4 py-3" style={{ background: "var(--color-panel)" }}>
                    <p className="text-xs mb-1" style={{ color: "var(--color-text-3)" }}>Projects</p>
                    <p className="text-sm font-semibold" style={{ color: "var(--color-text-1)" }}>
                      {mockSubscription.maxProjects === "unlimited" ? "Unlimited" : mockSubscription.maxProjects}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button className="btn-secondary text-sm">Manage billing</button>
                  <button className="btn-primary text-sm">Upgrade plan</button>
                </div>
              </div>
            </div>
          )}

          {activeSection === "api" && (
            <div className="card p-6">
              <h2 className="text-base font-semibold mb-5" style={{ color: "var(--color-text-1)" }}>API Keys</h2>
              <p style={{ color: "var(--color-text-3)" }}>API key management coming soon...</p>
            </div>
          )}

          {activeSection === "appearance" && (
            <div className="card p-6">
              <h2 className="text-base font-semibold mb-5" style={{ color: "var(--color-text-1)" }}>Appearance</h2>
              <p style={{ color: "var(--color-text-3)" }}>Appearance settings coming soon...</p>
            </div>
          )}

          {activeSection === "security" && (
            <div className="card p-6">
              <h2 className="text-base font-semibold mb-5" style={{ color: "var(--color-text-1)" }}>Security</h2>
              <p style={{ color: "var(--color-text-3)" }}>Security settings coming soon...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
