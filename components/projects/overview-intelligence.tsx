"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AlertTriangle, ChevronDown, ClipboardList, ListOrdered, Loader2 } from "lucide-react";
import { useT } from "@/lib/i18n";
import {
  listBoqItems,
  listRequirements,
  listRisks,
  updateRequirement,
  updateRisk,
  type RequirementItem,
  type RiskItem,
} from "@/lib/api/projects";
import { cn } from "@/lib/utils";

interface Props {
  projectId: string;
  companyId: string;
}

interface IntelligenceData {
  boq: number;
  requirements: RequirementItem[];
  risks: RiskItem[];
}

function levelBadgeClass(level?: string): string {
  switch ((level || "").toLowerCase()) {
    case "critical":
      return "bg-red-100 text-red-700";
    case "high":
      return "bg-amber-100 text-amber-800";
    case "low":
      return "bg-foreground-subtle/10 text-foreground-muted";
    default:
      return "bg-amber-50 text-amber-700";
  }
}

function levelLabelKey(kind: "priority" | "severity", level?: string): string | null {
  const normalized = (level || "medium").toLowerCase();
  if (!["critical", "high", "medium", "low"].includes(normalized)) return null;
  return `project.overview.${kind}_${normalized}`;
}

function IntelligenceList({
  title,
  icon: Icon,
  iconColor,
  emptyLabel,
  items,
  defaultOpen = true,
}: {
  title: string;
  icon: typeof ClipboardList;
  iconColor: string;
  emptyLabel: string;
  items: Array<{ id: string; node: ReactNode }>;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-xl border border-black/[0.06] bg-surface-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-4 py-3 text-left hover:bg-black/[0.02] transition-colors"
        aria-expanded={open}
      >
        <div className={cn("flex h-7 w-7 items-center justify-center rounded-lg", iconColor)}>
          <Icon className="h-3.5 w-3.5" strokeWidth={1.5} />
        </div>
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
        <span className="rounded-full bg-black/[0.05] px-2 py-0.5 text-[10px] font-medium text-foreground-muted">
          {items.length}
        </span>
        <ChevronDown
          className={cn(
            "ms-auto h-4 w-4 shrink-0 text-foreground-subtle transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {open && (
        items.length === 0 ? (
          <p className="border-t border-black/[0.06] px-4 py-6 text-center text-xs text-foreground-subtle">
            {emptyLabel}
          </p>
        ) : (
          <ul className="max-h-80 divide-y divide-black/[0.04] overflow-y-auto border-t border-black/[0.06]">
            {items.map((item) => (
              <li key={item.id} className="px-4 py-3">
                {item.node}
              </li>
            ))}
          </ul>
        )
      )}
    </div>
  );
}

export function OverviewIntelligence({ projectId, companyId }: Props) {
  const t = useT();
  const [data, setData] = useState<IntelligenceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const [boqItems, requirements, risks] = await Promise.all([
          listBoqItems(projectId, companyId),
          listRequirements(projectId, companyId),
          listRisks(projectId, companyId),
        ]);
        if (!cancelled) {
          setData({
            boq: boqItems.length,
            requirements,
            risks,
          });
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load intelligence");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [projectId, companyId]);

  const statItems = [
    {
      key: "boq",
      label: t("project.overview.boqItems"),
      value: data?.boq ?? 0,
      icon: ListOrdered,
      color: "text-primary bg-primary-soft",
    },
    {
      key: "requirements",
      label: t("project.overview.requirementsCount"),
      value: data?.requirements.length ?? 0,
      icon: ClipboardList,
      color: "text-amber-700 bg-amber-50",
    },
    {
      key: "risks",
      label: t("project.overview.risksCount"),
      value: data?.risks.length ?? 0,
      icon: AlertTriangle,
      color: "text-danger bg-danger-soft",
    },
  ];

  const requirementItems = (data?.requirements ?? []).map((req, index) => {
    const labelKey = levelLabelKey("priority", req.priority);
    const reqId = req.requirementId || `req-${index}`;
    return {
      id: reqId,
      node: (
        <div className="space-y-1">
          <div className="flex items-start gap-2">
            <p className="min-w-0 flex-1 text-sm font-medium text-foreground">
              {req.title || req.type || t("project.overview.requirementsTitle")}
            </p>
            <select
              value={req.status || "open"}
              onChange={async (e) => {
                try {
                  await updateRequirement(projectId, reqId, { companyId, status: e.target.value });
                  setData((d) => d ? {
                    ...d,
                    requirements: d.requirements.map((r) =>
                      (r.requirementId || r.id) === reqId ? { ...r, status: e.target.value } : r
                    ),
                  } : d);
                } catch { /* ignore */ }
              }}
              className="shrink-0 rounded border border-black/[0.08] px-1.5 py-0.5 text-[10px]"
            >
              <option value="open">open</option>
              <option value="completed">completed</option>
              <option value="waived">waived</option>
            </select>
            {labelKey && (
              <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium", levelBadgeClass(req.priority))}>
                {t(labelKey)}
              </span>
            )}
          </div>
          {req.description && (
            <p className="text-xs leading-relaxed text-foreground-subtle line-clamp-2">{req.description}</p>
          )}
          {(req.type || req.sourceClause) && (
            <p className="text-[10px] text-foreground-subtle">
              {[req.type, req.sourceClause].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
      ),
    };
  });

  const riskItems = (data?.risks ?? []).map((risk, index) => {
    const severity = risk.severity || risk.level;
    const labelKey = levelLabelKey("severity", severity);
    const riskId = risk.riskId || `risk-${index}`;
    return {
      id: riskId,
      node: (
        <div className="space-y-1">
          <div className="flex items-start gap-2">
            <p className="min-w-0 flex-1 text-sm font-medium text-foreground">
              {risk.title || t("project.overview.risksTitle")}
            </p>
            <select
              value={risk.status || "open"}
              onChange={async (e) => {
                try {
                  await updateRisk(projectId, riskId, { companyId, status: e.target.value });
                  setData((d) => d ? {
                    ...d,
                    risks: d.risks.map((r) =>
                      (r.riskId || r.id) === riskId ? { ...r, status: e.target.value } : r
                    ),
                  } : d);
                } catch { /* ignore */ }
              }}
              className="shrink-0 rounded border border-black/[0.08] px-1.5 py-0.5 text-[10px]"
            >
              <option value="open">open</option>
              <option value="mitigated">mitigated</option>
              <option value="accepted">accepted</option>
            </select>
            {labelKey && (
              <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium", levelBadgeClass(severity))}>
                {t(labelKey)}
              </span>
            )}
          </div>
          {risk.description && (
            <p className="text-xs leading-relaxed text-foreground-subtle line-clamp-2">{risk.description}</p>
          )}
          {(risk.category || risk.sourceCitation || risk.clause) && (
            <p className="text-[10px] text-foreground-subtle">
              {[risk.category, risk.sourceCitation || risk.clause].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
      ),
    };
  });

  return (
    <div className="card p-6 mb-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-foreground">
          {t("project.overview.intelligenceTitle")}
        </h3>
        {loading && <Loader2 className="h-4 w-4 animate-spin text-foreground-subtle" />}
      </div>

      {error ? (
        <p className="text-sm text-danger">{error}</p>
      ) : (
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-3">
            {statItems.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.key}
                  className="flex items-center gap-3 rounded-xl border border-black/[0.06] bg-surface-2 px-4 py-3"
                >
                  <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", item.color)}>
                    <Icon className="h-4 w-4" strokeWidth={1.5} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xl font-semibold tabular-nums text-foreground">
                      {loading ? "—" : item.value}
                    </p>
                    <p className="text-xs text-foreground-subtle truncate">{item.label}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {!loading && (
            <div className="grid gap-4 lg:grid-cols-2">
              <IntelligenceList
                title={t("project.overview.requirementsTitle")}
                icon={ClipboardList}
                iconColor="text-amber-700 bg-amber-50"
                emptyLabel={t("project.overview.noRequirements")}
                items={requirementItems}
              />
              <IntelligenceList
                title={t("project.overview.risksTitle")}
                icon={AlertTriangle}
                iconColor="text-danger bg-danger-soft"
                emptyLabel={t("project.overview.noRisks")}
                items={riskItems}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
