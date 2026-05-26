"use client";

import { useInsightsStore } from "@/store";
import { AlertTriangle, TrendingUp, Zap, Users, ArrowUpRight, CheckCheck, X } from "lucide-react";
import { useT } from "@/lib/i18n";
import { useLocalizedInsights } from "@/lib/i18n/use-localized-data";

const TYPE_CONFIG = {
  risk:        { icon: AlertTriangle, color: "var(--color-danger)",  bg: "var(--color-danger-sub)"  },
  opportunity: { icon: TrendingUp,   color: "var(--color-success)", bg: "var(--color-success-sub)" },
  pricing:     { icon: TrendingUp,   color: "var(--color-warning)", bg: "var(--color-warning-sub)" },
  vendor:      { icon: Users,        color: "var(--color-ai)",      bg: "var(--color-ai-sub)"      },
  market:      { icon: Zap,          color: "var(--color-ai)",      bg: "var(--color-ai-sub)"      },
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
          <p className="text-xs font-medium uppercase tracking-widest mb-1" style={{ color: "var(--color-text-3)" }}>{t("insights.subtitle")}</p>
          <h1 className="text-3xl font-semibold" style={{ color: "var(--color-text-1)" }}>{t("insights.title")}</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--color-text-2)" }}>
            {unread.length} {t("insights.unread")} · {insights.length} {t("insights.total")}
          </p>
        </div>
        {unread.length > 0 && (
          <button className="btn-secondary gap-2" onClick={markAllRead}>
            <CheckCheck className="h-4 w-4" strokeWidth={1.5} />
            {t("insights.markAllRead")}
          </button>
        )}
      </div>

      {/* Unread first */}
      {unread.length > 0 && (
        <div className="mb-8">
          <p className="text-xs font-medium uppercase tracking-widest mb-4" style={{ color: "var(--color-text-3)" }}>{t("insights.newSection")}</p>
          <div className="space-y-4">
            {unread.map((ins) => {
              const { icon: Icon, color, bg } = TYPE_CONFIG[ins.type];
              return (
                <div key={ins.id} className="card p-6 transition-all duration-200">
                  <div className="flex items-start gap-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full" style={{ background: bg }}>
                      <Icon className="h-4 w-4" strokeWidth={1.5} style={{ color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <p className="text-sm font-semibold mb-1.5" style={{ color: "var(--color-text-1)" }}>{ins.title}</p>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="badge badge-ai">New</span>
                          <span
                            className="badge"
                            style={{
                              background: ins.severity === "critical" ? "var(--color-danger-sub)" : ins.severity === "high" ? "var(--color-warning-sub)" : "var(--color-success-sub)",
                              color:      ins.severity === "critical" ? "var(--color-danger)"     : ins.severity === "high" ? "var(--color-warning)"     : "var(--color-success)",
                            }}
                          >
                            {ins.severity}
                          </span>
                          <button
                            onClick={() => markRead(ins.id)}
                            className="flex h-6 w-6 items-center justify-center rounded-md transition-colors hover:bg-sand-200/60"
                            title="Dismiss"
                            style={{ color: "var(--color-text-3)" }}
                          >
                            <X className="h-3.5 w-3.5" strokeWidth={2} />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm leading-relaxed mb-3 ai-mark" style={{ color: "var(--color-text-2)" }}>{ins.body}</p>
                      {ins.relatedTo && (
                        <button className="btn-ghost py-1.5 px-3 text-xs gap-1.5">
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
          <div className="flex h-12 w-12 items-center justify-center rounded-full" style={{ background: "var(--color-success-sub)" }}>
            <CheckCheck className="h-5 w-5" strokeWidth={1.5} style={{ color: "var(--color-success)" }} />
          </div>
          <p className="text-sm font-semibold" style={{ color: "var(--color-text-1)" }}>{t("insights.allCaughtUp")}</p>
          <p className="text-xs" style={{ color: "var(--color-text-3)" }}>{t("insights.allCaughtUpSub")}</p>
        </div>
      )}

      {/* Earlier / read */}
      {read.length > 0 && (
        <div>
          <p className="text-xs font-medium uppercase tracking-widest mb-4" style={{ color: "var(--color-text-3)" }}>{t("insights.earlierSection")}</p>
          <div className="space-y-3">
            {read.map((ins) => {
              const { icon: Icon, color, bg } = TYPE_CONFIG[ins.type];
              return (
                <div key={ins.id} className="card p-5 opacity-75">
                  <div className="flex items-start gap-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full" style={{ background: bg }}>
                      <Icon className="h-3.5 w-3.5" strokeWidth={1.5} style={{ color }} />
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-0.5" style={{ color: "var(--color-text-1)" }}>{ins.title}</p>
                      <p className="text-xs" style={{ color: "var(--color-text-3)" }}>
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
