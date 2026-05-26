"use client";

import { useState } from "react";
import type { Metadata } from "next";
import { useProfileStore } from "@/store";
import { showToast } from "@/lib/toast";
import { Building2, Mail, Phone, CheckCircle, Pencil, Check, X } from "lucide-react";

export default function ProfilePage() {
  const { profile, updateProfile } = useProfileStore();
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const handleStartEdit = (field: string, value: string) => {
    setEditingField(field);
    setEditValue(value);
  };

  const handleSave = (field: string) => {
    updateProfile(field as any, editValue);
    showToast("Profile updated successfully", "success");
    setEditingField(null);
  };

  const handleCancel = () => {
    setEditingField(null);
    setEditValue("");
  };

  const mockSubscription = { plan: "pro", features: ["unlimited_tenders", "ai_insights", "pdf_generation", "team_collaboration"] };
  const PLAN_LABELS: Record<string, string> = { starter: "Starter", pro: "Pro", business: "Business", enterprise: "Enterprise" };

  return (
    <div className="mx-auto max-w-[900px] px-8 py-10">
      <div className="mb-8">
        <p className="text-xs font-medium uppercase tracking-widest mb-1" style={{ color: "var(--color-text-3)" }}>Your Account</p>
        <h1 className="text-3xl font-semibold" style={{ color: "var(--color-text-1)" }}>Profile</h1>
      </div>

      {/* Profile card */}
      <div className="card p-8 mb-6">
        <div className="flex items-start gap-6 mb-8">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[20px] text-xl font-bold text-white" style={{ background: "var(--color-accent)" }}>
            {profile.avatar}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold mb-0.5" style={{ color: "var(--color-text-1)" }}>{profile.name}</h2>
            <p className="text-sm mb-3" style={{ color: "var(--color-text-2)" }}>{profile.role} · ConstructCo LLC</p>
            <div className="flex flex-wrap gap-2">
              <span className="badge badge-success">{PLAN_LABELS[mockSubscription.plan]} Plan</span>
              <span className="badge badge-neutral">Pro estimator</span>
            </div>
          </div>
        </div>

        {/* Editable fields grid */}
        <div className="grid gap-4 sm:grid-cols-2 mb-8">
          {/* Name field */}
          <div
            className="flex items-center justify-between rounded-[12px] px-4 py-3 cursor-pointer hover:opacity-80 transition-opacity"
            style={{ background: "var(--color-panel)" }}
            onMouseEnter={(e) => {
              if (editingField !== "name") {
                const pencil = e.currentTarget.querySelector(".pencil-icon");
                if (pencil) pencil.classList.remove("hidden");
              }
            }}
            onMouseLeave={(e) => {
              if (editingField !== "name") {
                const pencil = e.currentTarget.querySelector(".pencil-icon");
                if (pencil) pencil.classList.add("hidden");
              }
            }}
          >
            <div className="flex-1">
              <p className="text-xs" style={{ color: "var(--color-text-3)" }}>Name</p>
              {editingField === "name" ? (
                <div className="flex gap-2 items-center mt-1">
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="input text-sm"
                    autoFocus
                  />
                </div>
              ) : (
                <p className="text-sm font-medium" style={{ color: "var(--color-text-1)" }}>{profile.name}</p>
              )}
            </div>
            {editingField === "name" ? (
              <div className="flex gap-1 shrink-0">
                <button
                  onClick={() => handleSave("name")}
                  className="p-1 hover:bg-white/10 rounded transition-colors"
                  title="Save"
                >
                  <Check className="h-4 w-4" style={{ color: "var(--color-success)" }} />
                </button>
                <button
                  onClick={handleCancel}
                  className="p-1 hover:bg-white/10 rounded transition-colors"
                  title="Cancel"
                >
                  <X className="h-4 w-4" style={{ color: "var(--color-error)" }} />
                </button>
              </div>
            ) : (
              <Pencil className="pencil-icon hidden h-4 w-4 shrink-0" style={{ color: "var(--color-text-3)" }} onClick={() => handleStartEdit("name", profile.name)} />
            )}
          </div>

          {/* Email field */}
          <div
            className="flex items-center justify-between rounded-[12px] px-4 py-3 cursor-pointer hover:opacity-80 transition-opacity"
            style={{ background: "var(--color-panel)" }}
            onMouseEnter={(e) => {
              if (editingField !== "email") {
                const pencil = e.currentTarget.querySelector(".pencil-icon");
                if (pencil) pencil.classList.remove("hidden");
              }
            }}
            onMouseLeave={(e) => {
              if (editingField !== "email") {
                const pencil = e.currentTarget.querySelector(".pencil-icon");
                if (pencil) pencil.classList.add("hidden");
              }
            }}
          >
            <div className="flex-1">
              <p className="text-xs" style={{ color: "var(--color-text-3)" }}>Email</p>
              {editingField === "email" ? (
                <div className="flex gap-2 items-center mt-1">
                  <input
                    type="email"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="input text-sm"
                    autoFocus
                  />
                </div>
              ) : (
                <p className="text-sm font-medium" style={{ color: "var(--color-text-1)" }}>{profile.email}</p>
              )}
            </div>
            {editingField === "email" ? (
              <div className="flex gap-1 shrink-0">
                <button
                  onClick={() => handleSave("email")}
                  className="p-1 hover:bg-white/10 rounded transition-colors"
                  title="Save"
                >
                  <Check className="h-4 w-4" style={{ color: "var(--color-success)" }} />
                </button>
                <button
                  onClick={handleCancel}
                  className="p-1 hover:bg-white/10 rounded transition-colors"
                  title="Cancel"
                >
                  <X className="h-4 w-4" style={{ color: "var(--color-error)" }} />
                </button>
              </div>
            ) : (
              <Pencil className="pencil-icon hidden h-4 w-4 shrink-0" style={{ color: "var(--color-text-3)" }} onClick={() => handleStartEdit("email", profile.email)} />
            )}
          </div>

          {/* Role field */}
          <div
            className="flex items-center justify-between rounded-[12px] px-4 py-3 cursor-pointer hover:opacity-80 transition-opacity"
            style={{ background: "var(--color-panel)" }}
            onMouseEnter={(e) => {
              if (editingField !== "role") {
                const pencil = e.currentTarget.querySelector(".pencil-icon");
                if (pencil) pencil.classList.remove("hidden");
              }
            }}
            onMouseLeave={(e) => {
              if (editingField !== "role") {
                const pencil = e.currentTarget.querySelector(".pencil-icon");
                if (pencil) pencil.classList.add("hidden");
              }
            }}
          >
            <div className="flex-1">
              <p className="text-xs" style={{ color: "var(--color-text-3)" }}>Role</p>
              {editingField === "role" ? (
                <div className="flex gap-2 items-center mt-1">
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="input text-sm"
                    autoFocus
                  />
                </div>
              ) : (
                <p className="text-sm font-medium" style={{ color: "var(--color-text-1)" }}>{profile.role}</p>
              )}
            </div>
            {editingField === "role" ? (
              <div className="flex gap-1 shrink-0">
                <button
                  onClick={() => handleSave("role")}
                  className="p-1 hover:bg-white/10 rounded transition-colors"
                  title="Save"
                >
                  <Check className="h-4 w-4" style={{ color: "var(--color-success)" }} />
                </button>
                <button
                  onClick={handleCancel}
                  className="p-1 hover:bg-white/10 rounded transition-colors"
                  title="Cancel"
                >
                  <X className="h-4 w-4" style={{ color: "var(--color-error)" }} />
                </button>
              </div>
            ) : (
              <Pencil className="pencil-icon hidden h-4 w-4 shrink-0" style={{ color: "var(--color-text-3)" }} onClick={() => handleStartEdit("role", profile.role)} />
            )}
          </div>

          {/* Phone field */}
          <div
            className="flex items-center justify-between rounded-[12px] px-4 py-3 cursor-pointer hover:opacity-80 transition-opacity"
            style={{ background: "var(--color-panel)" }}
            onMouseEnter={(e) => {
              if (editingField !== "phone") {
                const pencil = e.currentTarget.querySelector(".pencil-icon");
                if (pencil) pencil.classList.remove("hidden");
              }
            }}
            onMouseLeave={(e) => {
              if (editingField !== "phone") {
                const pencil = e.currentTarget.querySelector(".pencil-icon");
                if (pencil) pencil.classList.add("hidden");
              }
            }}
          >
            <div className="flex-1">
              <p className="text-xs" style={{ color: "var(--color-text-3)" }}>Phone</p>
              {editingField === "phone" ? (
                <div className="flex gap-2 items-center mt-1">
                  <input
                    type="tel"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="input text-sm"
                    autoFocus
                  />
                </div>
              ) : (
                <p className="text-sm font-medium" style={{ color: "var(--color-text-1)" }}>{profile.phone}</p>
              )}
            </div>
            {editingField === "phone" ? (
              <div className="flex gap-1 shrink-0">
                <button
                  onClick={() => handleSave("phone")}
                  className="p-1 hover:bg-white/10 rounded transition-colors"
                  title="Save"
                >
                  <Check className="h-4 w-4" style={{ color: "var(--color-success)" }} />
                </button>
                <button
                  onClick={handleCancel}
                  className="p-1 hover:bg-white/10 rounded transition-colors"
                  title="Cancel"
                >
                  <X className="h-4 w-4" style={{ color: "var(--color-error)" }} />
                </button>
              </div>
            ) : (
              <Pencil className="pencil-icon hidden h-4 w-4 shrink-0" style={{ color: "var(--color-text-3)" }} onClick={() => handleStartEdit("phone", profile.phone)} />
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 pt-6" style={{ borderTop: "1px solid var(--color-border-sub)" }}>
          {[
            { label: "Tenders analyzed", value: "47" },
            { label: "Proposals generated", value: "28" },
            { label: "Hours saved (est.)", value: "380" },
          ].map(({ label, value }) => (
            <div key={label} className="text-center">
              <p className="text-2xl font-bold mb-0.5" style={{ color: "var(--color-accent)" }}>{value}</p>
              <p className="text-xs" style={{ color: "var(--color-text-3)" }}>{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Plan features */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold" style={{ color: "var(--color-text-1)" }}>
            {PLAN_LABELS[mockSubscription.plan]} Plan Features
          </h2>
          <button className="btn-primary text-sm">Upgrade to Business</button>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {mockSubscription.features.map((f) => (
            <div key={f} className="flex items-center gap-2.5">
              <CheckCircle className="h-4 w-4 shrink-0" strokeWidth={1.5} style={{ color: "var(--color-success)" }} />
              <span className="text-sm capitalize" style={{ color: "var(--color-text-2)" }}>
                {f.replace(/_/g, " ")}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
