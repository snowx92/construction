"use client";

import Link from "next/link";
import { useInsightsStore } from "@/store";
import { Bell, X, AlertCircle, TrendingUp, Users, Lightbulb, Zap } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";

const INSIGHT_ICONS = {
  risk: AlertCircle,
  opportunity: TrendingUp,
  pricing: Lightbulb,
  vendor: Users,
  market: Zap,
};

const SEVERITY_COLORS: Record<string, string> = {
  low: "rgb(var(--foreground-subtle))",
  medium: "rgb(var(--warning))",
  high: "#f97316",
  critical: "#ef4444",
};

export function NotificationsPopover() {
  const [open, setOpen] = useState(false);
  const t = useT();
  const insights = useInsightsStore((s) => s.insights);
  const markRead = useInsightsStore((s) => s.markRead);

  const unread = insights.filter((i) => !i.read);
  const last10 = insights.slice(0, 10);

  function handleMarkRead(id: string) {
    markRead(id);
  }

  function handleDismiss(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    handleMarkRead(id);
  }

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-foreground-muted transition-colors hover:bg-black/[0.035]"
        aria-label={t("notifications.bellLabel")}
      >
        <Bell className="h-5 w-5" strokeWidth={1.5} />
        {unread.length > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold text-white bg-primary">
            {unread.length > 9 ? "9+" : unread.length}
          </span>
        )}
      </button>

      {/* Popover */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />

          {/* Popover Content */}
          <div className="absolute right-0 top-10 z-50 w-96 max-h-[500px] overflow-hidden rounded-[var(--radius-lg)] glass-strong shadow-lg flex flex-col">
            {/* Header */}
            <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-black/[0.05]">
              <h2 className="text-sm font-semibold text-foreground">
                {t("notifications.title")}
              </h2>
              {unread.length > 0 && (
                <span className="text-xs text-foreground-subtle">
                  {unread.length} {t("insights.unread")}
                </span>
              )}
            </div>

            {/* Insights List */}
            <div className="flex-1 overflow-y-auto scrollbar-thin">
              {last10.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4">
                  <Bell className="mb-2 h-8 w-8 text-foreground-subtle" strokeWidth={1.5} />
                  <p className="text-xs text-foreground-subtle">
                    {t("notifications.empty")}
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-black/[0.05]">
                  {last10.map((insight) => {
                    const Icon = INSIGHT_ICONS[insight.type];
                    return (
                      <li
                        key={insight.id}
                        className={cn(
                          "px-4 py-3 transition-colors hover:bg-black/[0.025] cursor-pointer",
                          !insight.read && "bg-black/[0.02]",
                        )}
                        onClick={() => handleMarkRead(insight.id)}
                      >
                        <div className="flex gap-3">
                          {/* Icon */}
                          <div className="shrink-0 pt-1">
                            <Icon
                              className="h-4 w-4"
                              strokeWidth={1.5}
                              style={{ color: SEVERITY_COLORS[insight.severity] }}
                            />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-xs font-semibold text-foreground">
                                {insight.title}
                              </p>
                              <button
                                onClick={(e) => handleDismiss(insight.id, e)}
                                className="mt-0.5 flex h-5 w-5 items-center justify-center rounded text-foreground-subtle transition-colors hover:bg-black/[0.04] shrink-0"
                              >
                                <X className="h-3 w-3" strokeWidth={2} />
                              </button>
                            </div>
                            <p className="mt-1 text-xs line-clamp-2 text-foreground-muted">
                              {insight.body}
                            </p>
                            {insight.relatedTo && (
                              <p className="mt-2 text-xs text-foreground-subtle">
                                {insight.relatedTo.label}
                              </p>
                            )}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Footer */}
            {last10.length > 0 && (
              <div className="shrink-0 border-t border-black/[0.05] px-4 py-3">
                <Link
                  href="/insights"
                  onClick={() => setOpen(false)}
                  className="text-xs font-medium text-primary transition-colors hover:opacity-70"
                >
                  {t("notifications.viewAll")} →
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
