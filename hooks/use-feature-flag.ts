"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { getCompanySettings } from "@/lib/api/companies";

export function useFeatureFlag(feature: string): boolean {
  const { profile } = useAuth();
  const companyId = profile?.activeCompanyId;
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    if (!companyId) return;
    getCompanySettings(companyId)
      .then((s) => {
        const flags = s.featureFlags as Record<string, boolean> | undefined;
        if (flags && feature in flags) {
          setEnabled(Boolean(flags[feature]));
          return;
        }
        const quotas = s.quotas;
        if (feature === "exports" && quotas?.maxProjects === 0) setEnabled(false);
        else setEnabled(true);
      })
      .catch(() => setEnabled(true));
  }, [companyId, feature]);

  return enabled;
}

export function usePlan(): string {
  const { profile } = useAuth();
  const companyId = profile?.activeCompanyId;
  const [plan, setPlan] = useState("standard");

  useEffect(() => {
    if (!companyId) return;
    getCompanySettings(companyId)
      .then((s) => {
        const flags = s.featureFlags as Record<string, unknown> | undefined;
        setPlan(String(flags?.plan || "standard"));
      })
      .catch(() => setPlan("standard"));
  }, [companyId]);

  return plan;
}
