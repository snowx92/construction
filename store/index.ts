"use client";
import { create } from "zustand";
import { mockWorkspaces } from "@/data/mock-projects";
import { mockInsights, mockVendors } from "@/data/mock";
import type {
  ProjectWorkspace, GeneratedProposal, ProposalDocType,
  AIInsight,
  Vendor,
  PricingItem, PricingSource,
  BOQItem, TenderAnalysis,
  CompanyProfile, PastProject, StaffMember, Equipment, LabourCategory,
} from "@/types";

/* ── helpers ──────────────────────────────────────────────────── */
const uid = () => Math.random().toString(36).slice(2, 10);
const now = () => new Date().toISOString();

/* ── Project / Workspace Store ────────────────────────────────── */
interface ProjectStore {
  workspaces: ProjectWorkspace[];
  /* CRUD */
  addWorkspace: (ws: Omit<ProjectWorkspace, "id" | "createdAt" | "updatedAt" | "proposals" | "files">) => string;
  renameWorkspace: (id: string, name: string) => void;
  deleteWorkspace: (id: string) => void;
  pinWorkspace: (id: string, pinned: boolean) => void;
  /* Proposals */
  startGenerating: (wsId: string, type: ProposalDocType) => string;
  finishGenerating: (wsId: string, proposalId: string, proposal: GeneratedProposal) => void;
  /* Pricing */
  setPricing: (wsId: string, source: PricingSource, items: PricingItem[]) => void;
  /* BOQ */
  setBoqItems: (wsId: string, items: BOQItem[]) => void;
}

export const useProjectStore = create<ProjectStore>((set) => ({
  workspaces: mockWorkspaces,

  addWorkspace: (ws) => {
    const id = "ws-" + uid();

    // Pre-generate tender analysis documents when analysis data is present
    const tenderDocs: GeneratedProposal[] = [];
    if (ws.analysis) {
      const a = ws.analysis;

      // tender_overview — summary + requirements + deadlines
      const overviewSections = [
        { id: "s1", heading: "Project Summary", body: a.summary },
        ...(a.requirements.length > 0
          ? [{ id: "s2", heading: "Key Requirements", body: a.requirements.map((r, i) => `${i + 1}. ${r}`).join(" ") }]
          : []),
        ...(a.deadlines.length > 0
          ? [{ id: "s3", heading: "Key Dates", body: a.deadlines.map((d) => `${d.label}: ${d.date}`).join(" · ") }]
          : []),
        ...(a.missingInfo.length > 0
          ? [{ id: "s4", heading: "Missing Information", body: a.missingInfo.join("; ") }]
          : []),
      ];
      tenderDocs.push({
        id: "p-" + uid(), type: "tender_overview", title: "Tender Overview", status: "ready",
        sections: overviewSections, createdAt: now(),
        wordCount: overviewSections.reduce((n, s) => n + s.body.split(" ").length + s.heading.split(" ").length, 0),
      });

      // risk_assessment — one section per risk + penalties
      if (a.risks.length > 0) {
        const riskSections = [
          ...a.risks.map((r, i) => ({
            id: `rs${i}`,
            heading: `${r.title} [${r.level.toUpperCase()}]`,
            body: r.description + (r.clause ? ` Reference: ${r.clause}.` : ""),
          })),
          ...(a.penalties.length > 0
            ? [{ id: "rsp", heading: "Penalty Clauses", body: a.penalties.join(" · ") }]
            : []),
        ];
        tenderDocs.push({
          id: "p-" + uid(), type: "risk_assessment", title: "Risk Assessment", status: "ready",
          sections: riskSections, createdAt: now(),
          wordCount: riskSections.reduce((n, s) => n + s.body.split(" ").length + s.heading.split(" ").length, 0),
        });
      }

      // boq_report — grouped by category
      if (a.boqItems.length > 0) {
        const categories = [...new Set(a.boqItems.map((b) => b.category))];
        const boqSections = [
          ...categories.map((cat, i) => {
            const items = a.boqItems.filter((b) => b.category === cat);
            const total = items.reduce((sum, b) => sum + b.total, 0);
            return {
              id: `bs${i}`,
              heading: `${cat} Works`,
              body:
                items.map((b) => `${b.description}: ${b.quantity.toLocaleString()} ${b.unit} × AED ${b.unitPrice.toLocaleString()} = AED ${b.total.toLocaleString()}`).join(". ") +
                `. Category total: AED ${total.toLocaleString()}.`,
            };
          }),
          {
            id: "bstotal",
            heading: "Estimated Project Value",
            body: `Total estimated value: AED ${a.estimatedValue.toLocaleString()} across ${a.boqItems.length} line items in ${categories.length} category/categories. AI confidence: ${Math.round(a.aiConfidence * 100)}%.`,
          },
        ];
        tenderDocs.push({
          id: "p-" + uid(), type: "boq_report", title: "BOQ Report", status: "ready",
          sections: boqSections, createdAt: now(),
          wordCount: boqSections.reduce((n, s) => n + s.body.split(" ").length + s.heading.split(" ").length, 0),
        });
      }
    }

    set((s) => ({
      workspaces: [
        {
          ...ws,
          id,
          createdAt: now(),
          updatedAt: now(),
          proposals: tenderDocs,
          files: [],
        },
        ...s.workspaces,
      ],
    }));
    return id;
  },

  renameWorkspace: (id, name) =>
    set((s) => ({
      workspaces: s.workspaces.map((w) =>
        w.id === id ? { ...w, name, updatedAt: now() } : w
      ),
    })),

  deleteWorkspace: (id) =>
    set((s) => ({ workspaces: s.workspaces.filter((w) => w.id !== id) })),

  pinWorkspace: (id, pinned) =>
    set((s) => ({
      workspaces: s.workspaces.map((w) =>
        w.id === id ? { ...w, pinned, updatedAt: now() } : w
      ),
    })),

  startGenerating: (wsId, type) => {
    const pid = "p-" + uid();
    const TITLES: Record<ProposalDocType, string> = {
      tender_submission:  "Tender Submission",
      tender_overview:    "Tender Overview",
      risk_assessment:    "Risk Assessment",
      boq_report:         "BOQ Report",
      technical_proposal: "Technical Proposal",
      company_profile:    "Company Profile",
      method_statement:   "Method Statement",
      scope_of_work:      "Scope of Work",
      execution_plan:     "Execution Plan",
      financial_proposal: "Financial Proposal",
    };
    set((s) => ({
      workspaces: s.workspaces.map((w) =>
        w.id === wsId
          ? {
              ...w,
              updatedAt: now(),
              proposals: [
                ...w.proposals,
                {
                  id: pid,
                  type,
                  title: TITLES[type],
                  status: "generating" as const,
                  sections: [],
                  createdAt: now(),
                  wordCount: 0,
                },
              ],
            }
          : w
      ),
    }));
    return pid;
  },

  finishGenerating: (wsId, proposalId, proposal) =>
    set((s) => ({
      workspaces: s.workspaces.map((w) =>
        w.id === wsId
          ? {
              ...w,
              updatedAt: now(),
              proposals: w.proposals.map((p) =>
                p.id === proposalId ? proposal : p
              ),
            }
          : w
      ),
    })),

  setPricing: (wsId, source, items) =>
    set((s) => ({
      workspaces: s.workspaces.map((w) =>
        w.id === wsId
          ? { ...w, pricingSource: source, pricingItems: items, updatedAt: now() }
          : w
      ),
    })),

  setBoqItems: (wsId, items) =>
    set((s) => ({
      workspaces: s.workspaces.map((w) => {
        if (w.id !== wsId) return w;
        const baseAnalysis: TenderAnalysis = w.analysis ?? {
          summary:        "",
          requirements:   [],
          risks:          [],
          penalties:      [],
          deadlines:      [],
          boqItems:       [],
          estimatedValue: 0,
          complexity:     "moderate",
          missingInfo:    [],
          aiConfidence:   0.88,
        };
        const total = items.reduce((s, it) => s + it.total, 0);
        return {
          ...w,
          updatedAt: now(),
          analysis: {
            ...baseAnalysis,
            boqItems:       items,
            estimatedValue: total || baseAnalysis.estimatedValue,
          },
        };
      }),
    })),

}));

/* ── Insights Store ───────────────────────────────────────────── */
interface InsightsStore {
  insights: AIInsight[];
  markRead: (id: string) => void;
  markAllRead: () => void;
  addInsight: (insight: Omit<AIInsight, "id">) => void;
}

export const useInsightsStore = create<InsightsStore>((set) => ({
  insights: mockInsights,

  markRead: (id) =>
    set((s) => ({
      insights: s.insights.map((i) => (i.id === id ? { ...i, read: true } : i)),
    })),

  markAllRead: () =>
    set((s) => ({ insights: s.insights.map((i) => ({ ...i, read: true })) })),

  addInsight: (insight) =>
    set((s) => ({
      insights: [{ ...insight, id: "ins-" + uid() }, ...s.insights],
    })),
}));

/* ── Settings Store ──────────────────────────────────────────────── */
export interface Settings {
  companyName: string;
  companyEmail: string;
  billingContact: string;
  notifyOnPOApproval: boolean;
  notifyOnRisk: boolean;
  notifyOnTender: boolean;
}

interface SettingsStore {
  settings: Settings;
  updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  updateSettings: (updates: Partial<Settings>) => void;
}

const defaultSettings: Settings = {
  companyName: "ConstructCo LLC",
  companyEmail: "info@constructco.ae",
  billingContact: "billing@constructco.ae",
  notifyOnPOApproval: true,
  notifyOnRisk: true,
  notifyOnTender: false,
};

export const useSettingsStore = create<SettingsStore>((set) => ({
  settings: defaultSettings,

  updateSetting: (key, value) =>
    set((s) => ({
      settings: { ...s.settings, [key]: value },
    })),

  updateSettings: (updates) =>
    set((s) => ({
      settings: { ...s.settings, ...updates },
    })),
}));

/* ── Vendor Store ────────────────────────────────────────────────── */
interface VendorStore {
  vendors: Vendor[];
  addVendor: (vendor: Omit<Vendor, "id" | "joinedAt" | "totalOrders" | "onTimeRate">) => void;
}

export const useVendorStore = create<VendorStore>((set) => ({
  vendors: mockVendors,

  addVendor: (vendor) =>
    set((s) => {
      const id = "v-" + uid();
      const newVendor: Vendor = {
        ...vendor,
        id,
        joinedAt: now(),
        totalOrders: 0,
        onTimeRate: 1.0,
      };
      return { vendors: [newVendor, ...s.vendors] };
    }),
}));

/* ── Profile Store ────────────────────────────────────────────── */
export interface UserProfile {
  name: string;
  email: string;
  role: string;
  phone: string;
  avatar: string;
}

interface ProfileStore {
  profile: UserProfile;
  updateProfile: (key: keyof UserProfile, value: string) => void;
}

const mockProfile: UserProfile = {
  name: "Ahmed Al Mansoori",
  email: "ahmed@constructco.ae",
  role: "Estimating Manager",
  phone: "+971 50 123 4567",
  avatar: "AM",
};

export const useProfileStore = create<ProfileStore>((set) => ({
  profile: mockProfile,

  updateProfile: (key, value) =>
    set((s) => ({
      profile: { ...s.profile, [key]: value },
    })),
}));

/* ── Company Profile Store ────────────────────────────────────────── */
const mockCompanyProfile: CompanyProfile = {
  legalName:    "ConstructCo LLC",
  tradeName:    "ConstructCo",
  registration: "DED-1234567",
  vatNumber:    "100-1234-5678-9001",
  established:  2009,
  headquarters: "Dubai, UAE",
  website:      "www.constructco.ae",
  description:  "Grade A Civil & MEP contractor with 17 years of UAE construction experience. Delivered over AED 850M in infrastructure and building projects for government and private sector clients.",
  tagline:      "Building UAE's tomorrow — one project at a time.",
  vision:       "To be the UAE's most trusted contractor, delivering infrastructure that stands for generations while pioneering sustainable construction practices across the region.",
  bio:          "Founded in 2009 by a team of UAE-licensed engineers, ConstructCo has grown from a regional roads contractor into one of Dubai's leading Grade A civil and MEP firms. Our team of 350+ professionals brings deep local knowledge and international best practices to every project — from dual carriageways and pedestrian bridges to high-rise MEP packages and substation installations.\n\nWe hold approvals from RTA, DEWA, Dubai Municipality, and Abu Dhabi infrastructure authorities, allowing us to self-deliver across all major UAE markets without subcontracting critical trades.",
  linkedin:     "linkedin.com/company/constructco-ae",
  instagram:    "@constructco.ae",
  twitter:      "@constructco_ae",
  certifications: [
    "ISO 9001:2015 Quality Management",
    "ISO 14001:2015 Environmental",
    "ISO 45001:2018 Occupational Health & Safety",
    "RTA Approved Contractor Grade A",
    "DEWA Approved Contractor",
    "Dubai Municipality Grade I",
  ],
  pastProjects: [
    { id: "pp-001", name: "Al Khawaneej Road Upgrade",        client: "RTA",       value: 120_000_000, year: 2023, status: "completed",    category: "Roads",     description: "12 km road rehabilitation including drainage and lighting." },
    { id: "pp-002", name: "Business Bay Pedestrian Bridges",  client: "RTA",       value:  45_000_000, year: 2022, status: "completed",    category: "Structures",description: "Six precast pedestrian bridges with architectural finishes." },
    { id: "pp-003", name: "Mohammed Bin Zayed Road Phase 4",  client: "ADNOC",     value: 280_000_000, year: 2021, status: "completed",    category: "Roads",     description: "8 km dual carriageway with two interchanges." },
    { id: "pp-004", name: "Dubai Festival City Access Roads", client: "Private",   value:  67_000_000, year: 2024, status: "completed",    category: "Roads" },
    { id: "pp-005", name: "Jumeirah Villa Complex — MEP",     client: "Emaar",     value:  22_000_000, year: 2025, status: "in_progress",  category: "MEP" },
    { id: "pp-006", name: "Etihad Rail Station Substation",   client: "Etihad",    value:  98_000_000, year: 2024, status: "handed_over",  category: "Substations" },
  ],
  staff: [
    { id: "stf-001", name: "Ahmed Al Mansoori",  employeeId: "EMP-001", passportId: "A12345678", title: "Managing Director",      department: "Executive",      email: "ahmed@constructco.ae",  phone: "+971 50 123 4567", nationality: "UAE" },
    { id: "stf-002", name: "Sara Khalifa",       employeeId: "EMP-002", passportId: "B23456789", title: "Operations Director",    department: "Operations",     reportsTo: "EMP-001", email: "sara@constructco.ae",   phone: "+971 50 234 5678", nationality: "UAE" },
    { id: "stf-003", name: "Rashid Bin Salem",   employeeId: "EMP-003", passportId: "C34567890", title: "Chief Engineer",         department: "Engineering",    reportsTo: "EMP-002", email: "rashid@constructco.ae", phone: "+971 50 345 6789", nationality: "UAE" },
    { id: "stf-004", name: "Priya Sharma",       employeeId: "EMP-004", passportId: "D45678901", title: "Estimating Manager",     department: "Pre-construction", reportsTo: "EMP-002", email: "priya@constructco.ae",  phone: "+971 50 456 7890", nationality: "India" },
    { id: "stf-005", name: "Mohammed Hassan",    employeeId: "EMP-005", passportId: "E56789012", title: "Senior Project Manager", department: "Operations",     reportsTo: "EMP-002", email: "mhassan@constructco.ae",phone: "+971 50 567 8901", nationality: "Egypt" },
    { id: "stf-006", name: "Fatima Al Zahra",    employeeId: "EMP-006", passportId: "F67890123", title: "QA/QC Lead",             department: "Engineering",    reportsTo: "EMP-003", email: "fatima@constructco.ae", phone: "+971 50 678 9012", nationality: "Jordan" },
    { id: "stf-007", name: "James O'Brien",      employeeId: "EMP-007", passportId: "G78901234", title: "HSE Officer",            department: "Engineering",    reportsTo: "EMP-003", email: "james@constructco.ae",  phone: "+971 50 789 0123", nationality: "Ireland" },
    { id: "stf-008", name: "Raj Patel",          employeeId: "EMP-008", passportId: "H89012345", title: "Site Engineer",          department: "Operations",     reportsTo: "EMP-005", email: "raj@constructco.ae",    phone: "+971 50 890 1234", nationality: "India" },
    { id: "stf-009", name: "Layla Najjar",       employeeId: "EMP-009", passportId: "I90123456", title: "Procurement Manager",    department: "Operations",     reportsTo: "EMP-002", email: "layla@constructco.ae",  phone: "+971 50 901 2345", nationality: "Lebanon" },
    { id: "stf-010", name: "David Chen",         employeeId: "EMP-010", passportId: "J01234567", title: "Surveyor",               department: "Engineering",    reportsTo: "EMP-003", email: "david@constructco.ae",  phone: "+971 50 012 3456", nationality: "Singapore" },
  ],
  equipment: [
    { id: "eq-001", name: "Crawler crane (50T)",          category: "Lifting",     model: "Liebherr LR 1100",   ownership: "owned",       quantity: 2, yearAcquired: 2019, dailyRate: 4500, status: "available",   notes: "Used for bridge erection & heavy lifts." },
    { id: "eq-002", name: "Tower crane (40m jib)",        category: "Lifting",     model: "Potain MDT 268",      ownership: "leased",      quantity: 3, yearAcquired: 2022, dailyRate: 3200, status: "in_use",      notes: "Allocated to Marina MEP tower." },
    { id: "eq-003", name: "Hydraulic excavator (30T)",    category: "Earthmoving", model: "CAT 330D",            ownership: "owned",       quantity: 4, yearAcquired: 2021, dailyRate: 2200, status: "available" },
    { id: "eq-004", name: "Motor grader",                 category: "Earthmoving", model: "CAT 140K",            ownership: "owned",       quantity: 2, yearAcquired: 2020, dailyRate: 1850, status: "available" },
    { id: "eq-005", name: "Vibrating roller (12T)",       category: "Earthmoving", model: "Bomag BW 213",        ownership: "owned",       quantity: 5, yearAcquired: 2021, dailyRate: 950,  status: "available" },
    { id: "eq-006", name: "Asphalt paver",                category: "Concrete",    model: "Vögele Super 1800",   ownership: "leased",      quantity: 1, yearAcquired: 2023, dailyRate: 5200, status: "available" },
    { id: "eq-007", name: "Concrete transit mixer (8m³)", category: "Concrete",    model: "Mercedes Actros",     ownership: "owned",       quantity: 8, yearAcquired: 2020, dailyRate: 1100, status: "available" },
    { id: "eq-008", name: "Concrete pump truck",          category: "Concrete",    model: "Putzmeister 42m",     ownership: "subcontract", quantity: 2, dailyRate: 4800, status: "available" },
    { id: "eq-009", name: "Dump truck (16m³)",            category: "Transport",   model: "MAN TGS 33.400",      ownership: "owned",       quantity: 12, yearAcquired: 2020, dailyRate: 850, status: "available" },
    { id: "eq-010", name: "Diesel generator (250kVA)",    category: "Power",       model: "Cummins QSB7-G5",     ownership: "owned",       quantity: 6, yearAcquired: 2022, dailyRate: 480, status: "available" },
    { id: "eq-011", name: "Tower light (4×400W LED)",     category: "Power",       model: "Atlas Copco QLT H50", ownership: "owned",       quantity: 15, yearAcquired: 2023, dailyRate: 180, status: "available" },
    { id: "eq-012", name: "Forklift (3T diesel)",         category: "Lifting",     model: "Hyster H3.0FT",       ownership: "owned",       quantity: 4, yearAcquired: 2021, dailyRate: 420, status: "available" },
  ],
  labour: [
    { id: "lab-001", title: "Project Manager",      trade: "Supervision", headcount: 4,  dailyRate: 1400, skillLevel: "supervisor",   nationality: "Mixed" },
    { id: "lab-002", title: "Site Engineer",        trade: "Supervision", headcount: 12, dailyRate: 950,  skillLevel: "supervisor",   nationality: "Mixed" },
    { id: "lab-003", title: "Civil Foreman",        trade: "Civil",       headcount: 18, dailyRate: 480,  skillLevel: "skilled",      nationality: "India / Pakistan" },
    { id: "lab-004", title: "Steel Fixer",          trade: "Civil",       headcount: 36, dailyRate: 320,  skillLevel: "skilled",      nationality: "India / Bangladesh" },
    { id: "lab-005", title: "Carpenter (shutters)", trade: "Civil",       headcount: 28, dailyRate: 310,  skillLevel: "skilled",      nationality: "India / Bangladesh" },
    { id: "lab-006", title: "Mason / Blockwork",    trade: "Civil",       headcount: 24, dailyRate: 290,  skillLevel: "skilled",      nationality: "India / Nepal" },
    { id: "lab-007", title: "MEP Technician",       trade: "MEP",         headcount: 22, dailyRate: 360,  skillLevel: "skilled",      nationality: "Philippines / India" },
    { id: "lab-008", title: "Electrician",          trade: "Electrical",  headcount: 18, dailyRate: 380,  skillLevel: "skilled",      nationality: "Philippines / India" },
    { id: "lab-009", title: "HVAC Technician",      trade: "MEP",         headcount: 12, dailyRate: 410,  skillLevel: "skilled",      nationality: "Philippines" },
    { id: "lab-010", title: "Finishing — Painter",  trade: "Finishing",   headcount: 16, dailyRate: 270,  skillLevel: "semi_skilled", nationality: "India / Nepal" },
    { id: "lab-011", title: "Finishing — Tiler",    trade: "Finishing",   headcount: 14, dailyRate: 280,  skillLevel: "skilled",      nationality: "India" },
    { id: "lab-012", title: "Equipment Operator",   trade: "Operator",    headcount: 20, dailyRate: 420,  skillLevel: "skilled",      nationality: "India / Pakistan" },
    { id: "lab-013", title: "General Labourer",     trade: "Civil",       headcount: 80, dailyRate: 180,  skillLevel: "unskilled",    nationality: "India / Nepal / Bangladesh" },
    { id: "lab-014", title: "Driver",               trade: "Operator",    headcount: 22, dailyRate: 220,  skillLevel: "semi_skilled", nationality: "India / Pakistan" },
  ],
};

interface CompanyProfileStore {
  profile: CompanyProfile;
  updateField: <K extends keyof CompanyProfile>(key: K, value: CompanyProfile[K]) => void;
  addCertification: (cert: string) => void;
  removeCertification: (idx: number) => void;
  addPastProject: (p: Omit<PastProject, "id">) => void;
  updatePastProject: (id: string, p: Partial<PastProject>) => void;
  removePastProject: (id: string) => void;
  addStaff: (s: Omit<StaffMember, "id">) => void;
  updateStaff: (id: string, s: Partial<StaffMember>) => void;
  removeStaff: (id: string) => void;
  addEquipment: (e: Omit<Equipment, "id">) => void;
  updateEquipment: (id: string, e: Partial<Equipment>) => void;
  removeEquipment: (id: string) => void;
  addLabour: (l: Omit<LabourCategory, "id">) => void;
  updateLabour: (id: string, l: Partial<LabourCategory>) => void;
  removeLabour: (id: string) => void;
}

export const useCompanyProfileStore = create<CompanyProfileStore>((set) => ({
  profile: mockCompanyProfile,

  updateField: (key, value) =>
    set((s) => ({ profile: { ...s.profile, [key]: value } })),

  addCertification: (cert) =>
    set((s) => ({ profile: { ...s.profile, certifications: [...s.profile.certifications, cert] } })),

  removeCertification: (idx) =>
    set((s) => ({ profile: { ...s.profile, certifications: s.profile.certifications.filter((_, i) => i !== idx) } })),

  addPastProject: (p) =>
    set((s) => ({
      profile: { ...s.profile, pastProjects: [{ ...p, id: "pp-" + uid() }, ...s.profile.pastProjects] },
    })),

  updatePastProject: (id, p) =>
    set((s) => ({
      profile: { ...s.profile, pastProjects: s.profile.pastProjects.map((x) => (x.id === id ? { ...x, ...p } : x)) },
    })),

  removePastProject: (id) =>
    set((s) => ({ profile: { ...s.profile, pastProjects: s.profile.pastProjects.filter((x) => x.id !== id) } })),

  addStaff: (st) =>
    set((s) => ({
      profile: { ...s.profile, staff: [{ ...st, id: "stf-" + uid() }, ...s.profile.staff] },
    })),

  updateStaff: (id, st) =>
    set((s) => ({
      profile: { ...s.profile, staff: s.profile.staff.map((x) => (x.id === id ? { ...x, ...st } : x)) },
    })),

  removeStaff: (id) =>
    set((s) => ({ profile: { ...s.profile, staff: s.profile.staff.filter((x) => x.id !== id) } })),

  addEquipment: (e) =>
    set((s) => ({ profile: { ...s.profile, equipment: [{ ...e, id: "eq-" + uid() }, ...s.profile.equipment] } })),

  updateEquipment: (id, e) =>
    set((s) => ({
      profile: { ...s.profile, equipment: s.profile.equipment.map((x) => (x.id === id ? { ...x, ...e } : x)) },
    })),

  removeEquipment: (id) =>
    set((s) => ({ profile: { ...s.profile, equipment: s.profile.equipment.filter((x) => x.id !== id) } })),

  addLabour: (l) =>
    set((s) => ({ profile: { ...s.profile, labour: [{ ...l, id: "lab-" + uid() }, ...s.profile.labour] } })),

  updateLabour: (id, l) =>
    set((s) => ({
      profile: { ...s.profile, labour: s.profile.labour.map((x) => (x.id === id ? { ...x, ...l } : x)) },
    })),

  removeLabour: (id) =>
    set((s) => ({ profile: { ...s.profile, labour: s.profile.labour.filter((x) => x.id !== id) } })),
}));
