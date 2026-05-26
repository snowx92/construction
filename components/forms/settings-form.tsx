"use client";

import { useState, useEffect } from "react";
import { useSettingsStore } from "@/store";
import { showToast } from "@/lib/toast";
import { Check, X } from "lucide-react";

export function SettingsForm() {
  const { settings, updateSettings } = useSettingsStore();
  const [formData, setFormData] = useState(settings);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleInputChange = (field: keyof typeof formData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleSave = () => {
    updateSettings(formData);
    showToast("Settings saved successfully", "success");
    setIsDirty(false);
  };

  const handleReset = () => {
    setFormData(settings);
    setIsDirty(false);
  };

  return (
    <div className="space-y-6">
      {/* Company Info Section */}
      <div className="card p-6">
        <h2 className="text-base font-semibold mb-5" style={{ color: "var(--color-text-1)" }}>
          Company Information
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-text-2)" }}>
              Company Name
            </label>
            <input
              type="text"
              value={formData.companyName}
              onChange={(e) => handleInputChange("companyName", e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-text-2)" }}>
              Company Email
            </label>
            <input
              type="email"
              value={formData.companyEmail}
              onChange={(e) => handleInputChange("companyEmail", e.target.value)}
              className="input"
            />
          </div>
        </div>
      </div>

      {/* Billing Section */}
      <div className="card p-6">
        <h2 className="text-base font-semibold mb-5" style={{ color: "var(--color-text-1)" }}>
          Billing Contact
        </h2>
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-text-2)" }}>
            Billing Contact Email
          </label>
          <input
            type="email"
            value={formData.billingContact}
            onChange={(e) => handleInputChange("billingContact", e.target.value)}
            className="input"
          />
        </div>
      </div>

      {/* Notifications Section */}
      <div className="card p-6">
        <h2 className="text-base font-semibold mb-5" style={{ color: "var(--color-text-1)" }}>
          Notification Preferences
        </h2>
        <div className="space-y-4">
          {[
            {
              key: "notifyOnPOApproval" as const,
              label: "PO Approval Notifications",
              desc: "Get notified when purchase orders are approved",
            },
            {
              key: "notifyOnRisk" as const,
              label: "Risk Alerts",
              desc: "Receive alerts when risks or opportunities are detected",
            },
            {
              key: "notifyOnTender" as const,
              label: "Tender Updates",
              desc: "Get notified of new tender opportunities and deadline changes",
            },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium" style={{ color: "var(--color-text-1)" }}>
                  {label}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--color-text-3)" }}>
                  {desc}
                </p>
              </div>
              <button
                onClick={() => handleInputChange(key, !formData[key])}
                className="relative h-5 w-9 shrink-0 rounded-full transition-colors flex items-center justify-center"
                style={{
                  background: formData[key] ? "var(--color-accent)" : "var(--color-border)",
                }}
                type="button"
              >
                {formData[key] ? (
                  <Check className="h-3 w-3 text-white" strokeWidth={2.5} />
                ) : (
                  <X className="h-3 w-3 text-white" strokeWidth={2.5} />
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-4" style={{ borderTop: "1px solid var(--color-border-sub)" }}>
        {isDirty && (
          <button
            onClick={handleReset}
            className="btn-secondary text-sm"
          >
            Cancel
          </button>
        )}
        <button
          onClick={handleSave}
          className="btn-primary text-sm"
          disabled={!isDirty}
          style={!isDirty ? { opacity: 0.5 } : {}}
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}
