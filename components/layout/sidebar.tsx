"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, TrendingUp, MessageSquare, Lightbulb,
  Settings, Building2, Plus, Pin, ChevronRight, FileText,
} from "lucide-react";
import { useProjectStore } from "@/store";
import { useT, useLocale } from "@/lib/i18n";
import { useLocalizedWorkspaces } from "@/lib/i18n/use-localized-data";

const STATUS_DOT: Record<string, string> = {
  ready:       "var(--color-success)",
  analyzing:   "var(--color-ai)",
  in_progress: "var(--color-warning)",
  new:         "var(--color-border)",
  completed:   "var(--color-text-3)",
  uploading:   "var(--color-ai)",
};

export function Sidebar() {
  const pathname = usePathname();
  const rawWorkspaces = useProjectStore((s) => s.workspaces);
  const workspaces    = useLocalizedWorkspaces(rawWorkspaces);
  const t = useT();
  const { dir } = useLocale();

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
  }

  const TOP_NAV = [
    { href: "/dashboard", label: t("nav.dashboard"),  icon: LayoutDashboard },
    { href: "/pricing",   label: t("nav.pricing"),    icon: TrendingUp       },
{ href: "/copilot",   label: t("nav.copilot"),    icon: MessageSquare    },
    { href: "/insights",  label: t("nav.insights"),   icon: Lightbulb        },
  ];

  return (
    <aside
      className={cn(
        "fixed inset-y-0 z-40 flex w-[240px] flex-col",
        dir === "rtl" ? "right-0" : "left-0"
      )}
      style={{
        background: "var(--color-panel)",
        [dir === "rtl" ? "borderLeft" : "borderRight"]: "1px solid var(--color-border)",
      } as React.CSSProperties}
    >
      {/* Logo */}
      <div className="flex h-14 shrink-0 items-center px-4" style={{ borderBottom: "1px solid var(--color-border-sub)" }}>
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: "var(--color-accent)" }}>
            <Building2 className="h-4 w-4 text-white" strokeWidth={1.5} />
          </div>
          <span className="text-sm font-semibold" style={{ color: "var(--color-text-1)" }}>Tender.ai</span>
        </div>
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto scrollbar-thin px-3 py-3 gap-5">

        {/* Top nav */}
        <div>
          <ul className="space-y-0.5">
            {TOP_NAV.map(({ href, label, icon: Icon }) => (
              <li key={href}>
                <Link href={href} className={cn(
                  "flex items-center gap-2.5 rounded-[10px] px-3 py-2 text-sm font-medium transition-all duration-150",
                  isActive(href) ? "text-white" : "hover:bg-sand-200/50"
                )} style={isActive(href) ? { background: "var(--color-accent)", color: "white" } : { color: "var(--color-text-2)" }}>
                  <Icon className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Projects */}
        <div className="flex-1 min-h-0">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-xs font-medium" style={{ color: "var(--color-text-3)" }}>{t("nav.projects")}</span>
            <Link href="/projects/new" className="flex h-5 w-5 items-center justify-center rounded-md transition-colors hover:bg-sand-200/60" style={{ color: "var(--color-text-3)" }}>
              <Plus className="h-3.5 w-3.5" strokeWidth={2} />
            </Link>
          </div>

          {/* All projects link */}
          <Link href="/projects" className={cn(
            "flex items-center gap-2 rounded-[10px] px-3 py-2 text-xs font-medium mb-1 transition-colors",
            isActive("/projects") && !pathname.includes("/projects/") ? "bg-sand-200/60" : "hover:bg-sand-200/40"
          )} style={{ color: "var(--color-text-2)" }}>
            <FileText className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
            {t("nav.allProjects")}
          </Link>

          {/* Pinned first, then rest */}
          <ul className="space-y-0.5">
            {[...workspaces].sort((a, b) => Number(b.pinned) - Number(a.pinned)).map((ws) => {
              const active = pathname.startsWith(`/projects/${ws.id}`);
              return (
                <li key={ws.id}>
                  <Link href={`/projects/${ws.id}`} className={cn(
                    "group flex items-center gap-2 rounded-[10px] px-3 py-2 transition-all duration-150",
                    active ? "bg-sand-200/80" : "hover:bg-sand-200/40"
                  )}>
                    <div className="relative shrink-0">
                      <div className="h-1.5 w-1.5 rounded-full" style={{ background: STATUS_DOT[ws.status] ?? "var(--color-text-3)" }} />
                      {ws.pinned && <Pin className={cn("absolute -top-1 h-2 w-2", dir === "rtl" ? "-left-1" : "-right-1")} style={{ color: "var(--color-accent)" }} />}
                    </div>
                    <span className={cn(
                      "flex-1 min-w-0 truncate text-xs",
                      active ? "font-semibold" : "font-medium"
                    )} style={{ color: active ? "var(--color-text-1)" : "var(--color-text-2)" }}>
                      {ws.name}
                    </span>
                    {active && <ChevronRight className={cn("h-3 w-3 shrink-0 opacity-40", dir === "rtl" && "rtl-flip")} strokeWidth={2} />}
                  </Link>
                </li>
              );
            })}
          </ul>

          <Link href="/projects/new" className="mt-2 flex w-full items-center gap-2 rounded-[10px] px-3 py-2 text-xs transition-colors hover:bg-sand-200/40" style={{ color: "var(--color-text-3)" }}>
            <Plus className="h-3.5 w-3.5" strokeWidth={2} />
            {t("nav.newProject")}
          </Link>
        </div>

        {/* Divider + Settings */}
        <div>
          <div className="mb-2" style={{ borderTop: "1px solid var(--color-border-sub)" }} />
          <Link href="/settings" className="flex items-center gap-2.5 rounded-[10px] px-3 py-2 text-xs font-medium transition-colors hover:bg-sand-200/50" style={{ color: "var(--color-text-2)" }}>
            <Settings className="h-4 w-4 shrink-0" strokeWidth={1.5} />
            {t("nav.settings")}
          </Link>
        </div>
      </div>

      {/* User */}
      <div className="shrink-0 px-3 pb-3">
        <Link href="/profile" className="flex items-center gap-3 rounded-[12px] px-3 py-2.5 transition-colors hover:bg-sand-200/50" style={{ border: "1px solid var(--color-border)" }}>
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white" style={{ background: "var(--color-accent)" }}>AM</div>
          <div className="min-w-0">
            <p className="truncate text-xs font-medium" style={{ color: "var(--color-text-1)" }}>Ahmed Al Mansoori</p>
            <p className="text-[10px]" style={{ color: "var(--color-text-3)" }}>Pro Plan</p>
          </div>
        </Link>
      </div>
    </aside>
  );
}
