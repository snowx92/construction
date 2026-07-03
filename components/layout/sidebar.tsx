"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, TrendingUp, Lightbulb,
  Settings, Building2, Plus, ChevronRight, FileText, Truck, Activity, FolderOpen,
} from "lucide-react";
import { useT, useLocale } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import { useProjects } from "@/lib/use-projects";
import { useIsAdmin } from "@/lib/use-role";
import { initials, roleLabel } from "@/lib/initials";
import type { ProjectStatus } from "@/lib/api/types";

const STATUS_DOT: Record<ProjectStatus, string> = {
  draft:               "rgb(var(--border) / 0.20)",
  uploading:           "rgb(var(--primary))",
  processing:          "rgb(var(--primary))",
  needs_review:        "rgb(var(--warning))",
  ready:               "rgb(var(--success))",
  pricing:             "rgb(var(--primary))",
  generating_proposal: "rgb(var(--primary))",
  submitted:           "rgb(var(--foreground-subtle))",
  awarded:             "rgb(var(--success))",
  lost:                "rgb(var(--danger))",
  archived:            "rgb(var(--foreground-subtle))",
};

export function Sidebar() {
  const pathname = usePathname();
  const t = useT();
  const { dir } = useLocale();
  const { profile } = useAuth();
  const { projects } = useProjects();
  const isAdmin = useIsAdmin();
  const workspaces = projects.filter((p) => p.status !== "archived");

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
  }

  const TOP_NAV = [
    { href: "/dashboard", label: t("nav.dashboard"),  icon: LayoutDashboard },
    { href: "/pricing",   label: t("nav.pricing"),    icon: TrendingUp       },
    { href: "/insights",  label: t("nav.insights"),   icon: Lightbulb        },
    { href: "/documents", label: t("nav.documents"),  icon: FolderOpen       },
    { href: "/suppliers", label: t("suppliersPage.title"), icon: Truck        },
    ...(isAdmin ? [{ href: "/admin/operations", label: t("operationsPage.title"), icon: Activity }] : []),
  ];

  return (
    <aside
      className={cn(
        "fixed inset-y-0 z-40 flex w-[240px] flex-col bg-surface-2 border-black/[0.06]",
        dir === "rtl" ? "right-0 border-l" : "left-0 border-r",
      )}
    >
      {/* Logo */}
      <div className="flex h-14 shrink-0 items-center px-4 border-b border-black/[0.05]">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] bg-primary">
            <Building2 className="h-4 w-4 text-white" strokeWidth={1.5} />
          </div>
          <span className="text-sm font-semibold text-foreground">Tender.ai</span>
        </div>
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto scrollbar-thin px-3 py-3 gap-5">

        {/* Top nav */}
        <div>
          <ul className="space-y-0.5">
            {TOP_NAV.map(({ href, label, icon: Icon }) => (
              <li key={href}>
                <Link href={href} className={cn(
                  "flex items-center gap-2.5 rounded-[var(--radius-sm)] px-3 py-2 text-sm font-medium transition-all duration-500 ease-out",
                  isActive(href)
                    ? "bg-primary text-white"
                    : "text-foreground-muted hover:bg-black/[0.035]",
                )}>
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
            <span className="text-xs font-medium text-foreground-subtle">{t("nav.projects")}</span>
            <Link href="/projects/new" className="flex h-5 w-5 items-center justify-center rounded-md text-foreground-subtle transition-colors hover:bg-black/[0.04]">
              <Plus className="h-3.5 w-3.5" strokeWidth={2} />
            </Link>
          </div>

          {/* All projects link */}
          <Link href="/projects" className={cn(
            "flex items-center gap-2 rounded-[var(--radius-sm)] px-3 py-2 text-xs font-medium mb-1 transition-colors",
            isActive("/projects") && !pathname.includes("/projects/")
              ? "bg-black/[0.04]"
              : "text-foreground-muted hover:bg-black/[0.035]",
          )}>
            <FileText className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
            {t("nav.allProjects")}
          </Link>

          <ul className="space-y-0.5">
            {workspaces.slice(0, 12).map((ws, i) => {
              const key = ws.projectId || `ws-${i}`;
              const active = pathname.startsWith(`/projects/${ws.projectId}`);
              return (
                <li key={key}>
                  <Link href={`/projects/${ws.projectId}`} className={cn(
                    "group flex items-center gap-2 rounded-[var(--radius-sm)] px-3 py-2 transition-all duration-500 ease-out",
                    active ? "bg-black/[0.04]" : "hover:bg-black/[0.035]",
                  )}>
                    <div className="relative shrink-0">
                      <div className="h-1.5 w-1.5 rounded-full" style={{ background: STATUS_DOT[ws.status] ?? "rgb(var(--foreground-subtle))" }} />
                    </div>
                    <span className={cn(
                      "flex-1 min-w-0 truncate text-xs",
                      active ? "font-semibold text-foreground" : "font-medium text-foreground-muted",
                    )}>
                      {ws.name}
                    </span>
                    {active && <ChevronRight className={cn("h-3 w-3 shrink-0 opacity-40", dir === "rtl" && "rtl-flip")} strokeWidth={2} />}
                  </Link>
                </li>
              );
            })}
          </ul>

          <Link href="/projects/new" className="mt-2 flex w-full items-center gap-2 rounded-[var(--radius-sm)] px-3 py-2 text-xs text-foreground-subtle transition-colors hover:bg-black/[0.035]">
            <Plus className="h-3.5 w-3.5" strokeWidth={2} />
            {t("nav.newProject")}
          </Link>
        </div>

        {/* Divider + Settings */}
        <div>
          <div className="mb-2 border-t border-black/[0.05]" />
          <Link href="/settings" className="flex items-center gap-2.5 rounded-[var(--radius-sm)] px-3 py-2 text-xs font-medium text-foreground-muted transition-colors hover:bg-black/[0.035]">
            <Settings className="h-4 w-4 shrink-0" strokeWidth={1.5} />
            {t("nav.settings")}
          </Link>
        </div>
      </div>

      {/* User */}
      <div className="shrink-0 px-3 pb-3">
        <Link href="/profile" className="flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 border border-black/[0.06] transition-colors hover:bg-black/[0.035]">
          {profile?.photoURL ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.photoURL} alt="" className="h-7 w-7 shrink-0 rounded-full object-cover" />
          ) : (
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white bg-primary">
              {initials(profile?.displayName, profile?.email)}
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-foreground">
              {profile?.displayName || profile?.email || "—"}
            </p>
            <p className="text-[10px] text-foreground-subtle truncate">
              {profile?.jobTitle || roleLabel(profile?.companyIds?.length ? "company_owner" : undefined)}
            </p>
          </div>
        </Link>
      </div>
    </aside>
  );
}
