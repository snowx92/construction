import type { ProjectStatus } from "./api/types";

export function timeAgoFromIso(value?: string | { _seconds: number } | null): string {
  if (!value) return "—";
  const ms = typeof value === "string"
    ? new Date(value).getTime()
    : value._seconds * 1000;
  const d = Math.floor((Date.now() - ms) / 60000);
  if (Number.isNaN(d)) return "—";
  if (d < 1)    return "just now";
  if (d < 60)   return `${d}m ago`;
  if (d < 1440) return `${Math.floor(d / 60)}h ago`;
  return `${Math.floor(d / 1440)}d ago`;
}

export const STATUS_BADGE: Record<ProjectStatus, string> = {
  draft:               "bg-foreground-subtle/10 text-foreground-muted",
  uploading:           "bg-primary-soft text-primary",
  processing:          "bg-primary-soft text-primary",
  needs_review:        "bg-amber-50 text-amber-700",
  ready:               "bg-emerald-50 text-emerald-700",
  pricing:             "bg-blue-50 text-blue-700",
  generating_proposal: "bg-primary-soft text-primary",
  submitted:           "bg-purple-50 text-purple-700",
  awarded:             "bg-emerald-50 text-emerald-700",
  lost:                "bg-red-50 text-red-700",
  archived:            "bg-foreground-subtle/10 text-foreground-subtle",
};
