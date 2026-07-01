"use client";

import { useState, useMemo } from "react";
import { useCompanyProfileStore } from "@/store";
import { useT } from "@/lib/i18n";
import { formatCurrency } from "@/lib/utils";
import {
  Building2, Plus, Trash2, Download, Pencil, X,
  Users, Briefcase, GitBranch, Award, Check, ChevronDown, ChevronRight,
  FileText, Truck, HardHat, Globe, Linkedin,
} from "lucide-react";
import { generateCompanyPDF, type PDFTheme } from "@/lib/generate-company-pdf";
import { NeedsBackend } from "@/components/shared/needs-backend";
import type { PastProject, StaffMember, Equipment, LabourCategory } from "@/types";

type Section = "company" | "track-record" | "staff" | "org-chart" | "equipment" | "labour" | "export";

const EQUIPMENT_OWNERSHIP_CLS: Record<string, string> = {
  owned:       "badge-success",
  leased:      "badge-warning",
  subcontract: "badge-neutral",
};
const EQUIPMENT_STATUS_CLS: Record<string, string> = {
  available:   "badge-success",
  in_use:      "badge-ai",
  maintenance: "badge-warning",
  retired:     "badge-neutral",
};
const SKILL_CLS: Record<string, string> = {
  supervisor:    "badge-ai",
  skilled:       "badge-success",
  semi_skilled:  "badge-warning",
  unskilled:     "badge-neutral",
};

const STATUS_CONFIG = {
  completed:   { cls: "badge-success",  key: "company.statusCompleted" },
  in_progress: { cls: "badge-ai",       key: "company.statusInProgress" },
  handed_over: { cls: "badge-neutral",  key: "company.statusHandedOver" },
} as const;

export function CompanyProfileForm() {
  const t = useT();
  const { profile, updateField, addCertification, removeCertification,
          addPastProject, updatePastProject, removePastProject,
          addStaff, updateStaff, removeStaff,
          addEquipment, updateEquipment, removeEquipment,
          addLabour, updateLabour, removeLabour } = useCompanyProfileStore();

  const [section, setSection] = useState<Section>("company");
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [editProject, setEditProject]           = useState<PastProject | null>(null);
  const [showStaffModal, setShowStaffModal]     = useState(false);
  const [editStaff, setEditStaff]               = useState<StaffMember | null>(null);
  const [showEquipModal, setShowEquipModal]     = useState(false);
  const [editEquip, setEditEquip]               = useState<Equipment | null>(null);
  const [showLabourModal, setShowLabourModal]   = useState(false);
  const [editLabour, setEditLabour]             = useState<LabourCategory | null>(null);
  const [newCert, setNewCert]                   = useState("");
  const [exporting, setExporting]               = useState(false);
  const [pdfTheme, setPdfTheme]                 = useState<PDFTheme>("corporate");

  /* ── Org tree built from staff.reportsTo links ────────────────── */
  const orgTree = useMemo(() => {
    const byMgr = new Map<string | undefined, StaffMember[]>();
    profile.staff.forEach((s) => {
      const k = s.reportsTo;
      if (!byMgr.has(k)) byMgr.set(k, []);
      byMgr.get(k)!.push(s);
    });
    return byMgr;
  }, [profile.staff]);

  /* ── Export — opens styled HTML in a new window and triggers print-to-PDF ── */
  function handleExport() {
    setExporting(true);
    generateCompanyPDF(profile, pdfTheme);
    setTimeout(() => setExporting(false), 800);
  }

  const SECTIONS = [
    { id: "company"      as Section, label: t("company.sectionCompany"),     icon: Building2 },
    { id: "track-record" as Section, label: t("company.sectionTrackRecord"), icon: Briefcase, count: profile.pastProjects.length },
    { id: "staff"        as Section, label: t("company.sectionStaff"),       icon: Users,     count: profile.staff.length },
    { id: "org-chart"    as Section, label: t("company.sectionOrgChart"),    icon: GitBranch },
    { id: "equipment"    as Section, label: t("company.sectionEquipment"),   icon: Truck,     count: profile.equipment.length },
    { id: "labour"       as Section, label: t("company.sectionLabour"),      icon: HardHat,   count: profile.labour.length },
    { id: "export"       as Section, label: t("company.sectionExport"),      icon: Download },
  ];

  return (
    <div className="space-y-6">
      <NeedsBackend
        endpoint="/api/company/{staff,equipment,labour,past-projects,branding}"
        what="Company assets — staff / equipment / labour / past projects / brand kit"
        details={`All data here is client-only. Needs CRUD endpoints:\n• GET/POST /api/company/staff, PUT/DELETE /api/company/staff/{id}\n• GET/POST /api/company/equipment, PUT/DELETE /api/company/equipment/{id}\n• GET/POST /api/company/labour, PUT/DELETE /api/company/labour/{id}\n• GET/POST /api/company/past-projects, PUT/DELETE /api/company/past-projects/{id}\n• PUT /api/company/branding — logo + PDF theme colors\nAlso: certifications live on the company doc — accepted via PUT /api/admin/companies/settings.\nCritical for AI proposal generation (technical proposal cites staff, equipment, past projects).`}
      />
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold mb-1" style={{ color: "rgb(var(--foreground))" }}>
            {t("company.title")}
          </h2>
          <p className="text-sm" style={{ color: "rgb(var(--foreground-muted))" }}>
            {t("company.subtitle")}
          </p>
        </div>
        <button onClick={handleExport} disabled={exporting} className="btn-primary gap-2">
          <Download className="h-4 w-4" strokeWidth={1.5} />
          {exporting ? t("common.loading") : t("company.downloadProfile")}
        </button>
      </div>

      {/* Sub-section tabs */}
      <div className="flex items-center gap-1 overflow-x-auto scrollbar-tab pb-2" style={{ borderBottom: "1px solid rgb(var(--border) / 0.05)" }}>
        {SECTIONS.map(({ id, label, icon: Icon, count }) => (
          <button
            key={id}
            onClick={() => setSection(id)}
            className="flex items-center gap-2 px-3 py-2 text-xs font-medium transition-all border-b-2 whitespace-nowrap"
            style={{
              borderColor: section === id ? "rgb(var(--primary))" : "transparent",
              color:       section === id ? "rgb(var(--primary))" : "rgb(var(--foreground-muted))",
              marginBottom: -2,
            }}
          >
            <Icon className="h-3.5 w-3.5" strokeWidth={1.5} />
            {label}
            {count !== undefined && (
              <span className="badge badge-neutral text-[10px] px-1.5 py-0">{count}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Company Info ─────────────────────────────────────────── */}
      {section === "company" && (
        <div className="space-y-5">
          <div className="card p-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("company.legalName")} value={profile.legalName} onChange={(v) => updateField("legalName", v)} />
              <Field label={t("company.tradeName")} value={profile.tradeName} onChange={(v) => updateField("tradeName", v)} />
              <Field label={t("company.registration")} value={profile.registration} onChange={(v) => updateField("registration", v)} />
              <Field label={t("company.vatNumber")} value={profile.vatNumber} onChange={(v) => updateField("vatNumber", v)} />
              <Field label={t("company.established")} type="number" value={String(profile.established)} onChange={(v) => updateField("established", parseInt(v) || 0)} />
              <Field label={t("company.headquarters")} value={profile.headquarters} onChange={(v) => updateField("headquarters", v)} />
              <div className="sm:col-span-2">
                <Field label={t("company.website")} value={profile.website} onChange={(v) => updateField("website", v)} />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium mb-1.5" style={{ color: "rgb(var(--foreground-muted))" }}>{t("company.description")}</label>
                <textarea
                  className="input w-full resize-none"
                  rows={3}
                  value={profile.description}
                  onChange={(e) => updateField("description", e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium mb-1.5" style={{ color: "rgb(var(--foreground-muted))" }}>{t("company.tagline")}</label>
                <input
                  className="input w-full"
                  placeholder={t("company.taglinePh")}
                  value={profile.tagline ?? ""}
                  onChange={(e) => updateField("tagline", e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium mb-1.5" style={{ color: "rgb(var(--foreground-muted))" }}>{t("company.vision")}</label>
                <textarea
                  className="input w-full resize-none"
                  rows={3}
                  placeholder={t("company.visionPh")}
                  value={profile.vision ?? ""}
                  onChange={(e) => updateField("vision", e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium mb-1.5" style={{ color: "rgb(var(--foreground-muted))" }}>{t("company.bio")}</label>
                <textarea
                  className="input w-full resize-none"
                  rows={5}
                  placeholder={t("company.bioPh")}
                  value={profile.bio ?? ""}
                  onChange={(e) => updateField("bio", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Social Media */}
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="h-4 w-4" strokeWidth={1.5} style={{ color: "rgb(var(--primary))" }} />
              <h3 className="text-sm font-semibold" style={{ color: "rgb(var(--foreground))" }}>{t("company.socialMedia")}</h3>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "rgb(var(--foreground-muted))" }}>{t("company.linkedin")}</label>
                <div className="flex items-center gap-2">
                  <Linkedin className="h-4 w-4 shrink-0" strokeWidth={1.5} style={{ color: "rgb(var(--foreground-subtle))" }} />
                  <input className="input flex-1" placeholder="linkedin.com/company/…" value={profile.linkedin ?? ""} onChange={(e) => updateField("linkedin", e.target.value)} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "rgb(var(--foreground-muted))" }}>{t("company.instagram")}</label>
                <input className="input w-full" placeholder="@handle" value={profile.instagram ?? ""} onChange={(e) => updateField("instagram", e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "rgb(var(--foreground-muted))" }}>{t("company.twitter")}</label>
                <input className="input w-full" placeholder="@handle" value={profile.twitter ?? ""} onChange={(e) => updateField("twitter", e.target.value)} />
              </div>
            </div>
          </div>

          {/* Certifications */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4" strokeWidth={1.5} style={{ color: "rgb(var(--success))" }} />
                <h3 className="text-sm font-semibold" style={{ color: "rgb(var(--foreground))" }}>{t("company.certifications")}</h3>
              </div>
            </div>
            <ul className="space-y-2 mb-4">
              {profile.certifications.map((cert, i) => (
                <li key={i} className="flex items-center justify-between rounded-[8px] p-2.5" style={{ background: "rgb(var(--surface-2))" }}>
                  <span className="text-xs" style={{ color: "rgb(var(--foreground))" }}>{cert}</span>
                  <button onClick={() => removeCertification(i)} className="btn-ghost p-1" style={{ color: "rgb(var(--danger))" }}>
                    <X className="h-3.5 w-3.5" strokeWidth={2} />
                  </button>
                </li>
              ))}
            </ul>
            <div className="flex gap-2">
              <input
                className="input flex-1 text-sm"
                placeholder={t("company.certPlaceholder")}
                value={newCert}
                onChange={(e) => setNewCert(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newCert.trim()) {
                    addCertification(newCert.trim());
                    setNewCert("");
                  }
                }}
              />
              <button
                disabled={!newCert.trim()}
                onClick={() => { addCertification(newCert.trim()); setNewCert(""); }}
                className="btn-primary text-xs px-3 disabled:opacity-50"
              >
                <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
                {t("common.add")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Track Record ─────────────────────────────────────────── */}
      {section === "track-record" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm" style={{ color: "rgb(var(--foreground-muted))" }}>{t("company.trackRecordSub")}</p>
            <button onClick={() => { setEditProject(null); setShowProjectModal(true); }} className="btn-primary text-sm gap-2">
              <Plus className="h-4 w-4" strokeWidth={1.5} />
              {t("company.addProject")}
            </button>
          </div>

          <div className="card overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: "1px solid rgb(var(--border) / 0.05)" }}>
                  {[t("company.projectName"), t("common.client"), t("company.year"), t("common.amount"), t("project.financial.category"), t("common.status"), ""].map((h, i) => (
                    <th key={i} className="px-5 py-3 text-left font-medium" style={{ color: "rgb(var(--foreground-subtle))" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.05]">
                {profile.pastProjects.map((p) => {
                  const sc = STATUS_CONFIG[p.status];
                  return (
                    <tr key={p.id} className="hover:bg-black/[0.025]">
                      <td className="px-5 py-3 font-medium" style={{ color: "rgb(var(--foreground))" }}>{p.name}</td>
                      <td className="px-5 py-3" style={{ color: "rgb(var(--foreground-muted))" }}>{p.client}</td>
                      <td className="px-5 py-3 font-mono" style={{ color: "rgb(var(--foreground-muted))" }}>{p.year}</td>
                      <td className="px-5 py-3 font-mono font-semibold" style={{ color: "rgb(var(--foreground))" }}>{formatCurrency(p.value, "AED")}</td>
                      <td className="px-5 py-3"><span className="badge badge-neutral text-[10px]">{p.category}</span></td>
                      <td className="px-5 py-3"><span className={`badge ${sc.cls} text-[10px]`}>{t(sc.key)}</span></td>
                      <td className="px-5 py-3">
                        <div className="flex gap-1">
                          <button onClick={() => { setEditProject(p); setShowProjectModal(true); }} className="btn-ghost p-1" title={t("common.edit")}>
                            <Pencil className="h-3.5 w-3.5" strokeWidth={1.5} style={{ color: "rgb(var(--foreground-subtle))" }} />
                          </button>
                          <button onClick={() => removePastProject(p.id)} className="btn-ghost p-1" title={t("common.delete")}>
                            <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} style={{ color: "rgb(var(--danger))" }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: "2px solid rgb(var(--border) / 0.06)" }}>
                  <td colSpan={3} className="px-5 py-3 font-semibold" style={{ color: "rgb(var(--foreground-muted))" }}>{t("company.totalValueDelivered")}</td>
                  <td className="px-5 py-3 font-mono font-bold" style={{ color: "rgb(var(--primary))" }}>
                    {formatCurrency(profile.pastProjects.reduce((s, p) => s + p.value, 0), "AED")}
                  </td>
                  <td colSpan={3} />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* ── Staff Roster ─────────────────────────────────────────── */}
      {section === "staff" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm" style={{ color: "rgb(var(--foreground-muted))" }}>{t("company.staffSub")}</p>
            <button onClick={() => { setEditStaff(null); setShowStaffModal(true); }} className="btn-primary text-sm gap-2">
              <Plus className="h-4 w-4" strokeWidth={1.5} />
              {t("company.addStaff")}
            </button>
          </div>

          <div className="card overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: "1px solid rgb(var(--border) / 0.05)" }}>
                  {[t("common.name"), t("company.empId"), t("company.passportId"), t("company.jobTitle"), t("company.department"), t("company.nationality"), ""].map((h, i) => (
                    <th key={i} className="px-5 py-3 text-left font-medium" style={{ color: "rgb(var(--foreground-subtle))" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.05]">
                {profile.staff.map((s) => (
                  <tr key={s.id} className="hover:bg-black/[0.025]">
                    <td className="px-5 py-3 font-medium" style={{ color: "rgb(var(--foreground))" }}>{s.name}</td>
                    <td className="px-5 py-3 font-mono" style={{ color: "rgb(var(--foreground-muted))" }}>{s.employeeId}</td>
                    <td className="px-5 py-3 font-mono" style={{ color: "rgb(var(--foreground-subtle))" }}>{s.passportId}</td>
                    <td className="px-5 py-3" style={{ color: "rgb(var(--foreground))" }}>{s.title}</td>
                    <td className="px-5 py-3" style={{ color: "rgb(var(--foreground-muted))" }}>{s.department}</td>
                    <td className="px-5 py-3" style={{ color: "rgb(var(--foreground-subtle))" }}>{s.nationality ?? "—"}</td>
                    <td className="px-5 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => { setEditStaff(s); setShowStaffModal(true); }} className="btn-ghost p-1" title={t("common.edit")}>
                          <Pencil className="h-3.5 w-3.5" strokeWidth={1.5} style={{ color: "rgb(var(--foreground-subtle))" }} />
                        </button>
                        <button onClick={() => removeStaff(s.id)} className="btn-ghost p-1" title={t("common.delete")}>
                          <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} style={{ color: "rgb(var(--danger))" }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Org Chart Tree (diagram) ─────────────────────────────── */}
      {section === "org-chart" && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <GitBranch className="h-4 w-4" strokeWidth={1.5} style={{ color: "rgb(var(--primary))" }} />
              <h3 className="text-sm font-semibold" style={{ color: "rgb(var(--foreground))" }}>{t("company.orgChartTitle")}</h3>
            </div>
            <p className="text-xs" style={{ color: "rgb(var(--foreground-subtle))" }}>{t("company.orgChartHint")}</p>
          </div>
          {orgTree.get(undefined)?.length ? (
            <div className="org-tree scrollbar-thin">
              <ul>
                {orgTree.get(undefined)!.map((root) => (
                  <OrgNode key={root.id} member={root} tree={orgTree} depth={0} />
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-xs text-center py-8" style={{ color: "rgb(var(--foreground-subtle))" }}>{t("company.orgChartEmpty")}</p>
          )}
        </div>
      )}

      {/* ── Export ───────────────────────────────────────────────── */}
      {/* ── Equipment / Machinery ────────────────────────────────── */}
      {section === "equipment" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm" style={{ color: "rgb(var(--foreground-muted))" }}>{t("company.equipmentSub")}</p>
            <button onClick={() => { setEditEquip(null); setShowEquipModal(true); }} className="btn-primary text-sm gap-2">
              <Plus className="h-4 w-4" strokeWidth={1.5} />
              {t("company.addEquipment")}
            </button>
          </div>

          <div className="card overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: "1px solid rgb(var(--border) / 0.05)" }}>
                  {[t("common.name"), t("project.financial.category"), t("company.model"), t("company.ownership"), t("common.qty"), t("company.dailyRate"), t("common.status"), ""].map((h, i) => (
                    <th key={i} className="px-5 py-3 text-left font-medium" style={{ color: "rgb(var(--foreground-subtle))" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.05]">
                {profile.equipment.map((e) => (
                  <tr key={e.id} className="hover:bg-black/[0.025]">
                    <td className="px-5 py-3 font-medium" style={{ color: "rgb(var(--foreground))" }}>{e.name}</td>
                    <td className="px-5 py-3"><span className="badge badge-neutral text-[10px]">{e.category}</span></td>
                    <td className="px-5 py-3" style={{ color: "rgb(var(--foreground-muted))" }}>{e.model ?? "—"}</td>
                    <td className="px-5 py-3"><span className={`badge ${EQUIPMENT_OWNERSHIP_CLS[e.ownership]} text-[10px]`}>{t(`company.ownership${e.ownership.charAt(0).toUpperCase() + e.ownership.slice(1)}`)}</span></td>
                    <td className="px-5 py-3 font-mono" style={{ color: "rgb(var(--foreground-muted))" }}>{e.quantity}</td>
                    <td className="px-5 py-3 font-mono" style={{ color: "rgb(var(--foreground-muted))" }}>{e.dailyRate ? formatCurrency(e.dailyRate, "AED") : "—"}</td>
                    <td className="px-5 py-3"><span className={`badge ${EQUIPMENT_STATUS_CLS[e.status]} text-[10px]`}>{t(`company.equipStatus${e.status.charAt(0).toUpperCase() + e.status.slice(1).replace("_u", "U")}`)}</span></td>
                    <td className="px-5 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => { setEditEquip(e); setShowEquipModal(true); }} className="btn-ghost p-1"><Pencil className="h-3.5 w-3.5" strokeWidth={1.5} style={{ color: "rgb(var(--foreground-subtle))" }} /></button>
                        <button onClick={() => removeEquipment(e.id)} className="btn-ghost p-1"><Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} style={{ color: "rgb(var(--danger))" }} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: "2px solid rgb(var(--border) / 0.06)" }}>
                  <td colSpan={4} className="px-5 py-3 font-semibold" style={{ color: "rgb(var(--foreground-muted))" }}>{t("company.totalUnits")}</td>
                  <td className="px-5 py-3 font-mono font-bold" style={{ color: "rgb(var(--primary))" }}>
                    {profile.equipment.reduce((s, e) => s + e.quantity, 0)}
                  </td>
                  <td colSpan={3} />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* ── Labour / Workforce ───────────────────────────────────── */}
      {section === "labour" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm" style={{ color: "rgb(var(--foreground-muted))" }}>{t("company.labourSub")}</p>
            <button onClick={() => { setEditLabour(null); setShowLabourModal(true); }} className="btn-primary text-sm gap-2">
              <Plus className="h-4 w-4" strokeWidth={1.5} />
              {t("company.addLabour")}
            </button>
          </div>

          {/* Summary KPIs */}
          {profile.labour.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(() => {
                const totalHc   = profile.labour.reduce((s, l) => s + l.headcount, 0);
                const avgRate   = Math.round(profile.labour.reduce((s, l) => s + l.dailyRate * l.headcount, 0) / Math.max(totalHc, 1));
                const skilled   = profile.labour.filter((l) => l.skillLevel === "skilled" || l.skillLevel === "supervisor").reduce((s, l) => s + l.headcount, 0);
                const tradesCount = new Set(profile.labour.map((l) => l.trade)).size;
                return [
                  { label: t("company.totalWorkforce"),  value: totalHc,                color: "rgb(var(--primary))" },
                  { label: t("company.skilledWorkforce"), value: skilled,                color: "rgb(var(--success))" },
                  { label: t("company.avgDailyRate"),    value: formatCurrency(avgRate, "AED"), color: "rgb(var(--foreground))" },
                  { label: t("company.trades"),          value: tradesCount,            color: "rgb(var(--primary))" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="card px-4 py-3.5">
                    <p className="text-[11px] font-medium mb-1.5" style={{ color: "rgb(var(--foreground-subtle))" }}>{label}</p>
                    <p className="text-lg font-semibold" style={{ color }}>{value}</p>
                  </div>
                ));
              })()}
            </div>
          )}

          <div className="card overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: "1px solid rgb(var(--border) / 0.05)" }}>
                  {[t("company.jobTitle"), t("company.trade"), t("company.headcount"), t("company.dailyRate"), t("company.skillLevel"), t("company.nationality"), ""].map((h, i) => (
                    <th key={i} className="px-5 py-3 text-left font-medium" style={{ color: "rgb(var(--foreground-subtle))" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.05]">
                {profile.labour.map((l) => (
                  <tr key={l.id} className="hover:bg-black/[0.025]">
                    <td className="px-5 py-3 font-medium" style={{ color: "rgb(var(--foreground))" }}>{l.title}</td>
                    <td className="px-5 py-3"><span className="badge badge-neutral text-[10px]">{l.trade}</span></td>
                    <td className="px-5 py-3 font-mono font-semibold" style={{ color: "rgb(var(--foreground))" }}>{l.headcount}</td>
                    <td className="px-5 py-3 font-mono" style={{ color: "rgb(var(--foreground-muted))" }}>{formatCurrency(l.dailyRate, "AED")}</td>
                    <td className="px-5 py-3">
                      <span className={`badge ${SKILL_CLS[l.skillLevel]} text-[10px]`}>{t(`company.skill${l.skillLevel.charAt(0).toUpperCase() + l.skillLevel.slice(1).replace("_s", "S")}`)}</span>
                    </td>
                    <td className="px-5 py-3" style={{ color: "rgb(var(--foreground-subtle))" }}>{l.nationality ?? "—"}</td>
                    <td className="px-5 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => { setEditLabour(l); setShowLabourModal(true); }} className="btn-ghost p-1"><Pencil className="h-3.5 w-3.5" strokeWidth={1.5} style={{ color: "rgb(var(--foreground-subtle))" }} /></button>
                        <button onClick={() => removeLabour(l.id)} className="btn-ghost p-1"><Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} style={{ color: "rgb(var(--danger))" }} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {section === "export" && (
        <div className="space-y-4">
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="h-5 w-5" strokeWidth={1.5} style={{ color: "rgb(var(--primary))" }} />
              <div>
                <h3 className="text-sm font-semibold" style={{ color: "rgb(var(--foreground))" }}>{t("company.exportTitle")}</h3>
                <p className="text-xs mt-0.5" style={{ color: "rgb(var(--foreground-muted))" }}>{t("company.exportSub")}</p>
              </div>
            </div>
            <ul className="space-y-1.5 mb-5 text-xs" style={{ color: "rgb(var(--foreground-muted))" }}>
              {(["exportItem1","exportItem2","exportItem3","exportItem4"] as const).map((k) => (
                <li key={k} className="flex items-center gap-2">
                  <Check className="h-3 w-3 shrink-0" style={{ color: "rgb(var(--success))" }} />{t(`company.${k}`)}
                </li>
              ))}
            </ul>

            {/* Theme picker */}
            <div className="mb-5">
              <p className="text-xs font-medium mb-3" style={{ color: "rgb(var(--foreground-muted))" }}>{t("company.pdfTheme")}</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {([
                  { id: "corporate" as PDFTheme, header: "#1e3a5f", accent: "#e67e22" },
                  { id: "classic"   as PDFTheme, header: "#1a1a1a", accent: "#c9a227" },
                  { id: "modern"    as PDFTheme, header: "#2563eb", accent: "#2563eb" },
                  { id: "bold"      as PDFTheme, header: "#000000", accent: "#e5b800" },
                ]).map(({ id, header, accent }) => (
                  <button
                    key={id}
                    onClick={() => setPdfTheme(id)}
                    className="rounded-[10px] overflow-hidden transition-all"
                    style={{
                      border: pdfTheme === id ? `2px solid ${accent}` : "2px solid rgb(var(--border) / 0.06)",
                      outline: pdfTheme === id ? `3px solid ${accent}33` : "none",
                    }}
                  >
                    {/* Mini preview */}
                    <div style={{ background: header, height: 28 }} />
                    <div className="px-2 py-2 text-center" style={{ background: "rgb(var(--surface-2))" }}>
                      <span className="text-xs font-medium capitalize" style={{ color: pdfTheme === id ? accent : "rgb(var(--foreground-muted))" }}>
                        {t(`company.theme${id.charAt(0).toUpperCase() + id.slice(1)}`)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <button onClick={handleExport} disabled={exporting} className="btn-primary gap-2 disabled:opacity-60">
              <Download className="h-4 w-4" strokeWidth={1.5} />
              {exporting ? t("common.loading") : t("company.downloadProfile")}
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {showProjectModal && (
        <ProjectModal
          t={t}
          project={editProject}
          onClose={() => { setShowProjectModal(false); setEditProject(null); }}
          onSave={(p) => {
            if (editProject) updatePastProject(editProject.id, p);
            else addPastProject(p);
            setShowProjectModal(false);
            setEditProject(null);
          }}
        />
      )}
      {showStaffModal && (
        <StaffModal
          t={t}
          staffMember={editStaff}
          allStaff={profile.staff}
          onClose={() => { setShowStaffModal(false); setEditStaff(null); }}
          onSave={(s) => {
            if (editStaff) updateStaff(editStaff.id, s);
            else addStaff(s);
            setShowStaffModal(false);
            setEditStaff(null);
          }}
        />
      )}
      {showEquipModal && (
        <EquipmentModal
          t={t}
          item={editEquip}
          onClose={() => { setShowEquipModal(false); setEditEquip(null); }}
          onSave={(e) => {
            if (editEquip) updateEquipment(editEquip.id, e);
            else addEquipment(e);
            setShowEquipModal(false);
            setEditEquip(null);
          }}
        />
      )}
      {showLabourModal && (
        <LabourModal
          t={t}
          item={editLabour}
          onClose={() => { setShowLabourModal(false); setEditLabour(null); }}
          onSave={(l) => {
            if (editLabour) updateLabour(editLabour.id, l);
            else addLabour(l);
            setShowLabourModal(false);
            setEditLabour(null);
          }}
        />
      )}
    </div>
  );
}

/* ── Helpers ─────────────────────────────────────────────────────── */

function Field({ label, value, type = "text", onChange }: { label: string; value: string; type?: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5" style={{ color: "rgb(var(--foreground-muted))" }}>{label}</label>
      <input type={type} className="input w-full" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

/**
 * Renders one node in the org-chart diagram. Outputs a <li> containing the
 * member card and (recursively) a <ul> of direct reports — the CSS rules
 * in globals.css (.org-tree) draw the connecting lines between them.
 */
function OrgNode({ member, tree, depth }: { member: StaffMember; tree: Map<string | undefined, StaffMember[]>; depth: number }) {
  const reports = tree.get(member.employeeId) ?? [];

  // Colour-code by depth so the hierarchy is visually obvious
  const ringColor =
    depth === 0 ? "rgb(var(--primary))" :
    depth === 1 ? "rgb(var(--primary))" :
    depth === 2 ? "rgb(var(--success))" :
                  "rgb(var(--warning))";
  const bgColor =
    depth === 0 ? "rgb(var(--primary-soft))" :
    depth === 1 ? "rgb(var(--primary-soft))" :
    depth === 2 ? "rgb(var(--success-soft))" :
                  "rgb(var(--warning-soft))";

  return (
    <li>
      {/* Card */}
      <div
        className="org-card inline-flex flex-col items-center gap-1 rounded-[14px] px-4 py-3 text-center transition-all hover:shadow-sm relative"
        style={{
          minWidth: 160,
          background: bgColor,
          border: `1.5px solid ${ringColor}`,
        }}
      >
        <div
          className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white mb-0.5"
          style={{ background: ringColor }}
        >
          {member.name.split(" ").map(n => n[0]).slice(0, 2).join("")}
        </div>
        <p className="text-xs font-semibold leading-tight" style={{ color: "rgb(var(--foreground))" }}>
          {member.name}
        </p>
        <p className="text-[10px] leading-tight" style={{ color: ringColor }}>
          {member.title}
        </p>
        <p className="text-[10px] leading-tight" style={{ color: "rgb(var(--foreground-subtle))" }}>
          {member.department}
        </p>
      </div>

      {/* Recursively render direct reports */}
      {reports.length > 0 && (
        <ul>
          {reports.map((child) => (
            <OrgNode key={child.id} member={child} tree={tree} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}

/* ── Modals ──────────────────────────────────────────────────────── */
function ProjectModal({ t, project, onClose, onSave }: {
  t: (k: string) => string;
  project: PastProject | null;
  onClose: () => void;
  onSave: (p: Omit<PastProject, "id">) => void;
}) {
  const [form, setForm] = useState<Omit<PastProject, "id">>(project ?? {
    name: "", client: "", value: 0, year: new Date().getFullYear(), status: "completed", category: "Civil", description: "",
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.4)" }} onClick={onClose}>
      <div className="rounded-[20px] p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto scrollbar-thin" style={{ background: "rgb(var(--surface))", border: "1px solid rgb(var(--border) / 0.06)" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm font-semibold" style={{ color: "rgb(var(--foreground))" }}>
            {project ? t("company.editProject") : t("company.addProject")}
          </p>
          <button onClick={onClose} className="btn-ghost p-1"><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-3">
          <Field label={t("company.projectName")} value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
          <Field label={t("common.client")}      value={form.client} onChange={(v) => setForm({ ...form, client: v })} />
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("common.amount") + " (AED)"} type="number" value={String(form.value)} onChange={(v) => setForm({ ...form, value: parseFloat(v) || 0 })} />
            <Field label={t("company.year")} type="number" value={String(form.year)} onChange={(v) => setForm({ ...form, year: parseInt(v) || 0 })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "rgb(var(--foreground-muted))" }}>{t("project.financial.category")}</label>
              <select className="input w-full" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {["Civil", "Roads", "MEP", "Substations", "Structures", "Fit-Out", "Other"].map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "rgb(var(--foreground-muted))" }}>{t("common.status")}</label>
              <select className="input w-full" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as PastProject["status"] })}>
                <option value="completed">{t("company.statusCompleted")}</option>
                <option value="in_progress">{t("company.statusInProgress")}</option>
                <option value="handed_over">{t("company.statusHandedOver")}</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "rgb(var(--foreground-muted))" }}>{t("common.details")}</label>
            <textarea className="input w-full resize-none" rows={3} value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-5">
          <button onClick={onClose} className="btn-secondary">{t("common.cancel")}</button>
          <button onClick={() => onSave(form)} className="btn-primary" disabled={!form.name.trim() || !form.client.trim()}>{t("common.save")}</button>
        </div>
      </div>
    </div>
  );
}

function StaffModal({ t, staffMember, allStaff, onClose, onSave }: {
  t: (k: string) => string;
  staffMember: StaffMember | null;
  allStaff: StaffMember[];
  onClose: () => void;
  onSave: (s: Omit<StaffMember, "id">) => void;
}) {
  const [form, setForm] = useState<Omit<StaffMember, "id">>(staffMember ?? {
    name: "", employeeId: "", passportId: "", title: "", department: "", reportsTo: "", email: "", phone: "", nationality: "",
  });

  const managerOptions = allStaff.filter((s) => s.id !== staffMember?.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.4)" }} onClick={onClose}>
      <div className="rounded-[20px] p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto scrollbar-thin" style={{ background: "rgb(var(--surface))", border: "1px solid rgb(var(--border) / 0.06)" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm font-semibold" style={{ color: "rgb(var(--foreground))" }}>
            {staffMember ? t("company.editStaff") : t("company.addStaff")}
          </p>
          <button onClick={onClose} className="btn-ghost p-1"><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-3">
          <Field label={t("common.name")} value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("company.empId")} value={form.employeeId} onChange={(v) => setForm({ ...form, employeeId: v })} />
            <Field label={t("company.passportId")} value={form.passportId} onChange={(v) => setForm({ ...form, passportId: v })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("company.jobTitle")} value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
            <Field label={t("company.department")} value={form.department} onChange={(v) => setForm({ ...form, department: v })} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "rgb(var(--foreground-muted))" }}>{t("company.reportsTo")}</label>
            <select className="input w-full" value={form.reportsTo ?? ""} onChange={(e) => setForm({ ...form, reportsTo: e.target.value || undefined })}>
              <option value="">— ({t("company.topLevel")})</option>
              {managerOptions.map((s) => <option key={s.employeeId} value={s.employeeId}>{s.name} — {s.title}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("company.email")} value={form.email ?? ""} onChange={(v) => setForm({ ...form, email: v })} />
            <Field label={t("company.phone")} value={form.phone ?? ""} onChange={(v) => setForm({ ...form, phone: v })} />
          </div>
          <Field label={t("company.nationality")} value={form.nationality ?? ""} onChange={(v) => setForm({ ...form, nationality: v })} />
        </div>
        <div className="flex justify-end gap-3 mt-5">
          <button onClick={onClose} className="btn-secondary">{t("common.cancel")}</button>
          <button onClick={() => onSave(form)} className="btn-primary" disabled={!form.name.trim() || !form.employeeId.trim()}>{t("common.save")}</button>
        </div>
      </div>
    </div>
  );
}

/* ── Equipment Modal ───────────────────────────────────────────── */
function EquipmentModal({ t, item, onClose, onSave }: {
  t: (k: string) => string;
  item: Equipment | null;
  onClose: () => void;
  onSave: (e: Omit<Equipment, "id">) => void;
}) {
  const [form, setForm] = useState<Omit<Equipment, "id">>(item ?? {
    name: "", category: "Earthmoving", model: "", ownership: "owned", quantity: 1, yearAcquired: new Date().getFullYear(), dailyRate: 0, status: "available", notes: "",
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.4)" }} onClick={onClose}>
      <div className="rounded-[20px] p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto scrollbar-thin" style={{ background: "rgb(var(--surface))", border: "1px solid rgb(var(--border) / 0.06)" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm font-semibold" style={{ color: "rgb(var(--foreground))" }}>
            {item ? t("company.editEquipment") : t("company.addEquipment")}
          </p>
          <button onClick={onClose} className="btn-ghost p-1"><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-3">
          <Field label={t("common.name")} value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "rgb(var(--foreground-muted))" }}>{t("project.financial.category")}</label>
              <select className="input w-full" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {["Earthmoving", "Lifting", "Concrete", "Transport", "Power", "Other"].map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <Field label={t("company.model")} value={form.model ?? ""} onChange={(v) => setForm({ ...form, model: v })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "rgb(var(--foreground-muted))" }}>{t("company.ownership")}</label>
              <select className="input w-full" value={form.ownership} onChange={(e) => setForm({ ...form, ownership: e.target.value as Equipment["ownership"] })}>
                <option value="owned">{t("company.ownershipOwned")}</option>
                <option value="leased">{t("company.ownershipLeased")}</option>
                <option value="subcontract">{t("company.ownershipSubcontract")}</option>
              </select>
            </div>
            <Field label={t("common.qty")} type="number" value={String(form.quantity)} onChange={(v) => setForm({ ...form, quantity: parseInt(v) || 1 })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("company.dailyRate") + " (AED)"} type="number" value={String(form.dailyRate ?? 0)} onChange={(v) => setForm({ ...form, dailyRate: parseFloat(v) || 0 })} />
            <Field label={t("company.yearAcquired")} type="number" value={String(form.yearAcquired ?? "")} onChange={(v) => setForm({ ...form, yearAcquired: parseInt(v) || undefined })} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "rgb(var(--foreground-muted))" }}>{t("common.status")}</label>
            <select className="input w-full" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Equipment["status"] })}>
              <option value="available">{t("company.equipStatusAvailable")}</option>
              <option value="in_use">{t("company.equipStatusInUse")}</option>
              <option value="maintenance">{t("company.equipStatusMaintenance")}</option>
              <option value="retired">{t("company.equipStatusRetired")}</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "rgb(var(--foreground-muted))" }}>{t("common.details")}</label>
            <textarea className="input w-full resize-none" rows={2} value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-5">
          <button onClick={onClose} className="btn-secondary">{t("common.cancel")}</button>
          <button onClick={() => onSave(form)} className="btn-primary" disabled={!form.name.trim() || form.quantity < 1}>{t("common.save")}</button>
        </div>
      </div>
    </div>
  );
}

/* ── Labour Modal ──────────────────────────────────────────────── */
function LabourModal({ t, item, onClose, onSave }: {
  t: (k: string) => string;
  item: LabourCategory | null;
  onClose: () => void;
  onSave: (l: Omit<LabourCategory, "id">) => void;
}) {
  const [form, setForm] = useState<Omit<LabourCategory, "id">>(item ?? {
    title: "", trade: "Civil", headcount: 1, dailyRate: 0, skillLevel: "skilled", nationality: "", notes: "",
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.4)" }} onClick={onClose}>
      <div className="rounded-[20px] p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto scrollbar-thin" style={{ background: "rgb(var(--surface))", border: "1px solid rgb(var(--border) / 0.06)" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm font-semibold" style={{ color: "rgb(var(--foreground))" }}>
            {item ? t("company.editLabour") : t("company.addLabour")}
          </p>
          <button onClick={onClose} className="btn-ghost p-1"><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-3">
          <Field label={t("company.jobTitle")} value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "rgb(var(--foreground-muted))" }}>{t("company.trade")}</label>
              <select className="input w-full" value={form.trade} onChange={(e) => setForm({ ...form, trade: e.target.value })}>
                {["Civil", "MEP", "Electrical", "Finishing", "Supervision", "Operator"].map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "rgb(var(--foreground-muted))" }}>{t("company.skillLevel")}</label>
              <select className="input w-full" value={form.skillLevel} onChange={(e) => setForm({ ...form, skillLevel: e.target.value as LabourCategory["skillLevel"] })}>
                <option value="supervisor">{t("company.skillSupervisor")}</option>
                <option value="skilled">{t("company.skillSkilled")}</option>
                <option value="semi_skilled">{t("company.skillSemiSkilled")}</option>
                <option value="unskilled">{t("company.skillUnskilled")}</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("company.headcount")} type="number" value={String(form.headcount)} onChange={(v) => setForm({ ...form, headcount: parseInt(v) || 1 })} />
            <Field label={t("company.dailyRate") + " (AED)"} type="number" value={String(form.dailyRate)} onChange={(v) => setForm({ ...form, dailyRate: parseFloat(v) || 0 })} />
          </div>
          <Field label={t("company.nationality")} value={form.nationality ?? ""} onChange={(v) => setForm({ ...form, nationality: v })} />
          {form.headcount > 0 && form.dailyRate > 0 && (
            <div className="flex items-center justify-between rounded-[10px] p-3" style={{ background: "rgb(var(--primary-soft))", border: "1px solid rgb(var(--primary-soft))" }}>
              <span className="text-xs font-medium" style={{ color: "rgb(var(--foreground-muted))" }}>{t("company.totalDailyCost")}</span>
              <span className="text-sm font-bold font-mono" style={{ color: "rgb(var(--primary))" }}>{(form.headcount * form.dailyRate).toLocaleString()} AED</span>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-3 mt-5">
          <button onClick={onClose} className="btn-secondary">{t("common.cancel")}</button>
          <button onClick={() => onSave(form)} className="btn-primary" disabled={!form.title.trim() || form.headcount < 1}>{t("common.save")}</button>
        </div>
      </div>
    </div>
  );
}
