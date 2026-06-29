"use client";

import { useInsightsStore } from "@/store";
import { AlertTriangle, TrendingUp, Zap, Users, ArrowUpRight, CheckCheck, X } from "lucide-react";
import { useT } from "@/lib/i18n";
import { useLocalizedInsights } from "@/lib/i18n/use-localized-data";
import { cn } from "@/lib/utils";

const TYPE_CONFIG = {
  risk:        { icon: AlertTriangle, color: "text-danger",  bg: "bg-danger-soft"  },
  opportunity: { icon: TrendingUp,   color: "text-success", bg: "bg-success-soft" },
  pricing:     { icon: TrendingUp,   color: "text-warning", bg: "bg-warning-soft" },
  vendor:      { icon: Users,        color: "text-primary", bg: "bg-primary-soft" },
  market:      { icon: Zap,          color: "text-primary", bg: "bg-primary-soft" },
};

export default function InsightsPage() {
  const t = useT();
  const { insights: rawInsights, markRead, markAllRead } = useInsightsStore();
  const insights = useLocalizedInsights(rawInsights);
  const unread = insights.filter((i) => !i.read);
  const read   = insights.filter((i) => i.read);

  return (
    <div className="mx-auto max-w-[1200px] px-8 py-10">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest mb-1 text-foreground-subtle">{t("insights.subtitle")}</p>
          <h1 className="text-3xl font-semibold text-foreground">{t("insights.title")}</h1>
          <p className="mt-1 text-sm text-foreground-muted">
            {unread.length} {t("insights.unread")} · {insights.length} {t("insights.total")}
          </p>
        </div>
        {unread.length > 0 && (
          <button
            className="inline-flex items-center gap-2 h-10 px-5 rounded-[var(--radius-pill)] bg-surface text-foreground border border-black/[0.06] text-sm font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] transition-all duration-500 ease-out hover:bg-black/[0.035]"
            onClick={markAllRead}
          >
            <CheckCheck className="h-4 w-4" strokeWidth={1.5} />
            {t("insights.markAllRead")}
          </button>
        )}
      </div>

      {/* Unread first */}
      {unread.length > 0 && (
        <div className="mb-8">
          <p className="text-xs font-medium uppercase tracking-widest mb-4 text-foreground-subtle">{t("insights.newSection")}</p>
          <div className="space-y-4">
            {unread.map((ins) => {
              const { icon: Icon, color, bg } = TYPE_CONFIG[ins.type];
              return (
                <div key={ins.id} className="card p-6 transition-all duration-200">
                  <div className="flex items-start gap-4">
                    <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full", bg)}>
                      <Icon className={cn("h-4 w-4", color)} strokeWidth={1.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <p className="text-sm font-semibold mb-1.5 text-foreground">{ins.title}</p>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="inline-flex items-center gap-1 rounded-[var(--radius-pill)] px-2.5 py-0.5 text-xs font-medium bg-primary-soft text-primary">New</span>
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-[var(--radius-pill)] px-2.5 py-0.5 text-xs font-medium",
                              ins.severity === "critical" ? "bg-danger-soft text-danger" : ins.severity === "high" ? "bg-warning-soft text-warning" : "bg-success-soft text-success"
                            )}
                          >
                            {ins.severity}
                          </span>
                          <button
                            onClick={() => markRead(ins.id)}
                            className="flex h-6 w-6 items-center justify-center rounded-md transition-colors hover:bg-black/[0.04] text-foreground-subtle"
                            title="Dismiss"
                          >
                            <X className="h-3.5 w-3.5" strokeWidth={2} />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm leading-relaxed mb-3 ai-mark text-foreground-muted">{ins.body}</p>
                      {ins.relatedTo && (
                        <button className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-2 rounded-[var(--radius-pill)] text-foreground-muted text-sm font-medium transition-all duration-500 ease-out hover:bg-black/[0.04] hover:text-foreground",
                          "py-1.5 px-3 text-xs gap-1.5"
                        )}>
                          <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.5} />
                          {ins.relatedTo.label}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {unread.length === 0 && (
        <div className="card p-10 mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success-soft">
            <CheckCheck className="h-5 w-5 text-success" strokeWidth={1.5} />
          </div>
          <p className="text-sm font-semibold text-foreground">{t("insights.allCaughtUp")}</p>
          <p className="text-xs text-foreground-subtle">{t("insights.allCaughtUpSub")}</p>
        </div>
      )}

      {/* Earlier / read */}
      {read.length > 0 && (
        <div>
          <p className="text-xs font-medium uppercase tracking-widest mb-4 text-foreground-subtle">{t("insights.earlierSection")}</p>
          <div className="space-y-3">
            {read.map((ins) => {
              const { icon: Icon, color, bg } = TYPE_CONFIG[ins.type];
              return (
                <div key={ins.id} className="card p-5 opacity-75">
                  <div className="flex items-start gap-3">
                    <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full", bg)}>
                      <Icon className={cn("h-3.5 w-3.5", color)} strokeWidth={1.5} />
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-0.5 text-foreground">{ins.title}</p>
                      <p className="text-xs text-foreground-subtle">
                        {ins.relatedTo ? `${ins.relatedTo.label} · ` : ""}{new Date(ins.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
