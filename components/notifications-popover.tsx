"use client";

import Link from "next/link";
import { Bell, X, Loader2, Info, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type AppNotification,
} from "@/lib/api/notifications";
import { timeAgoFromIso } from "@/lib/project-status";

const SEVERITY_ICONS: Record<string, typeof Info> = {
  info: Info,
  warning: AlertTriangle,
  error: AlertTriangle,
  success: CheckCircle2,
};

function notifTime(n: AppNotification): string | null {
  const v = n.createdAt;
  if (!v) return null;
  if (typeof v === "string") return v;
  if (typeof v === "object" && "_seconds" in v) {
    return new Date(v._seconds * 1000).toISOString();
  }
  return null;
}

export function NotificationsPopover() {
  const [open, setOpen] = useState(false);
  const t = useT();
  const { profile } = useAuth();
  const companyId = profile?.activeCompanyId;
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const list = await listNotifications(companyId);
      setNotifications(list);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    if (open) load();
    if (!open || !companyId) return;
    const timer = setInterval(load, 30000);
    return () => clearInterval(timer);
  }, [open, load, companyId]);

  const unread = notifications.filter((n) => !n.read);
  const last10 = notifications.slice(0, 10);

  async function handleMarkRead(id: string) {
    if (!companyId) return;
    try {
      await markNotificationRead(id, companyId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
      );
    } catch {
      /* ignore */
    }
  }

  async function handleMarkAllRead() {
    if (!companyId) return;
    try {
      await markAllNotificationsRead(companyId);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      /* ignore */
    }
  }

  function handleDismiss(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    handleMarkRead(id);
  }

  return (
    <div className="relative">
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

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          <div className="absolute right-0 top-10 z-50 w-96 max-h-[500px] overflow-hidden rounded-[var(--radius-lg)] glass-strong shadow-lg flex flex-col">
            <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-black/[0.05]">
              <h2 className="text-sm font-semibold text-foreground">
                {t("notifications.title")}
              </h2>
              {unread.length > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="text-xs font-medium text-primary hover:opacity-70"
                >
                  {t("notifications.markAllRead")}
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-thin">
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-foreground-subtle" />
                </div>
              ) : last10.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4">
                  <Bell className="mb-2 h-8 w-8 text-foreground-subtle" strokeWidth={1.5} />
                  <p className="text-xs text-foreground-subtle">{t("notifications.empty")}</p>
                </div>
              ) : (
                <ul className="divide-y divide-black/[0.05]">
                  {last10.map((n) => {
                    const Icon = SEVERITY_ICONS[n.severity || "info"] || Info;
                    const ts = notifTime(n);
                    return (
                      <li
                        key={n.id}
                        className={cn(
                          "px-4 py-3 transition-colors hover:bg-black/[0.025] cursor-pointer",
                          !n.read && "bg-black/[0.02]",
                        )}
                        onClick={() => handleMarkRead(n.id)}
                      >
                        <div className="flex gap-3">
                          <div className="shrink-0 pt-1">
                            <Icon className="h-4 w-4 text-primary" strokeWidth={1.5} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-xs font-semibold text-foreground">
                                {n.title || n.type || "—"}
                              </p>
                              <button
                                onClick={(e) => handleDismiss(n.id, e)}
                                className="mt-0.5 flex h-5 w-5 items-center justify-center rounded text-foreground-subtle transition-colors hover:bg-black/[0.04] shrink-0"
                              >
                                <X className="h-3 w-3" strokeWidth={2} />
                              </button>
                            </div>
                            <p className="mt-1 text-xs line-clamp-2 text-foreground-muted">
                              {n.message || ""}
                            </p>
                            {ts && (
                              <p className="mt-1 text-[10px] text-foreground-subtle">
                                {timeAgoFromIso(ts)}
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
