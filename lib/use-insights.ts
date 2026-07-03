"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "./auth-context";
import { listInsights, markAllInsightsRead, markInsightRead } from "./api/insights";
import type { CompanyInsight } from "./api/types";

export function useInsights(limit = 50) {
  const { profile } = useAuth();
  const companyId = profile?.activeCompanyId;
  const [insights, setInsights] = useState<CompanyInsight[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!companyId) {
      setInsights([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await listInsights(companyId, limit);
      setInsights(data.insights ?? []);
      setUnreadCount(data.unreadCount ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load insights");
    } finally {
      setLoading(false);
    }
  }, [companyId, limit]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const dismiss = useCallback(async (insightId: string) => {
    if (!companyId) return;
    setInsights((prev) =>
      prev.map((insight) =>
        insight.insightId === insightId ? { ...insight, read: true } : insight
      )
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    try {
      await markInsightRead(insightId, companyId);
    } catch {
      void refresh();
    }
  }, [companyId, refresh]);

  const dismissAll = useCallback(async () => {
    if (!companyId) return;
    setInsights((prev) => prev.map((insight) => ({ ...insight, read: true })));
    setUnreadCount(0);
    try {
      await markAllInsightsRead(companyId);
    } catch {
      void refresh();
    }
  }, [companyId, refresh]);

  return { insights, unreadCount, loading, error, refresh, dismiss, dismissAll };
}
