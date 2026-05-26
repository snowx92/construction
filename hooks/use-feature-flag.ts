"use client";
import { mockSubscription } from "@/data/mock";
import type { Plan } from "@/types";

const PLAN_FEATURES: Record<Plan, string[]> = {
  starter:    ["ai_tender_analysis"],
  pro:        ["ai_tender_analysis", "proposal_generation", "vendor_management", "live_pricing", "document_management"],
  business:   ["ai_tender_analysis", "proposal_generation", "vendor_management", "live_pricing", "document_management", "crew_scheduling", "advanced_reporting", "subcontractor_management"],
  enterprise: ["ai_tender_analysis", "proposal_generation", "vendor_management", "live_pricing", "document_management", "crew_scheduling", "advanced_reporting", "subcontractor_management", "api_access", "multi_company"],
};

export function useFeatureFlag(feature: string): boolean {
  const plan = mockSubscription.plan;
  return PLAN_FEATURES[plan]?.includes(feature) ?? false;
}

export function usePlan(): Plan { return mockSubscription.plan; }
