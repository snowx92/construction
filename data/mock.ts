import type {
  Tender, Vendor, MaterialPrice, Project, AIInsight, OrgSubscription, UploadedFile,
} from "@/types";

/* ── Tenders ─────────────────────────────────────────────────────── */
export const mockTenders: Tender[] = [
  {
    id: "t-001",
    title: "Al Wasl Road Infrastructure — Phase 3",
    client: "Dubai Roads Authority",
    status: "ready",
    submittedAt: "2026-05-10",
    deadline: "2026-06-15",
    value: 4_200_000,
    tags: ["infrastructure", "roads", "phase-3"],
    files: [],
    analysis: {
      summary:
        "A 4.2 km dual-carriageway road upgrade including drainage, signage, and three pedestrian bridges. High complexity due to live traffic management requirements and tight 8-month execution window.",
      requirements: [
        "ISO 9001:2015 certified contractor",
        "Minimum 10 years road construction experience",
        "Traffic management plan approved by RTA",
        "Performance bond: 10% of contract value",
      ],
      risks: [
        { id: "r1", title: "Tight execution window", description: "8-month window with monsoon risk in Q3", level: "high", clause: "Section 4.2" },
        { id: "r2", title: "Traffic disruption penalties", description: "AED 50,000/day for unauthorized road closures", level: "critical", clause: "Section 12.1" },
        { id: "r3", title: "Material price volatility", description: "Steel prices up 8% this month — affects unit rates", level: "medium" },
      ],
      penalties: ["AED 50,000/day for unauthorized road closures", "5% retention for 12 months post-completion"],
      deadlines: [
        { label: "Bid submission", date: "2026-06-15" },
        { label: "Site mobilization", date: "2026-07-01" },
        { label: "Substantial completion", date: "2027-03-01" },
      ],
      boqItems: [
        { id: "b1", description: "Subbase course (Cl.A)", unit: "m³", quantity: 12400, unitPrice: 85, total: 1054000, category: "Civil" },
        { id: "b2", description: "Asphalt base course 60mm", unit: "m²", quantity: 28000, unitPrice: 42, total: 1176000, category: "Civil" },
        { id: "b3", description: "Street lighting pole (10m)", unit: "No.", quantity: 180, unitPrice: 4200, total: 756000, category: "Electrical" },
        { id: "b4", description: "Road marking (thermoplastic)", unit: "m²", quantity: 3200, unitPrice: 28, total: 89600, category: "Civil" },
        { id: "b5", description: "Pedestrian bridge (prefab)", unit: "No.", quantity: 3, unitPrice: 380000, total: 1140000, category: "Structures" },
      ],
      estimatedValue: 4_200_000,
      complexity: "complex",
      missingInfo: ["Geotechnical report not attached", "Traffic study reference not included"],
      aiConfidence: 0.91,
    },
  },
  {
    id: "t-002",
    title: "Marina Residential Tower — MEP Works",
    client: "Emaar Properties",
    status: "analyzing",
    submittedAt: "2026-05-18",
    deadline: "2026-06-30",
    value: 1_850_000,
    tags: ["mep", "residential", "high-rise"],
    files: [],
    analysis: undefined,
  },
  {
    id: "t-003",
    title: "Solar Farm — Utility Substation Package",
    client: "DEWA",
    status: "proposal_sent",
    submittedAt: "2026-04-28",
    deadline: "2026-05-30",
    value: 6_700_000,
    tags: ["electrical", "solar", "utility"],
    files: [],
    analysis: {
      summary: "132/11kV substation for 50MW solar farm including switchgear, transformers, SCADA, and 8km underground cable.",
      requirements: ["DEWA approved contractor", "IEC 61850 compliance", "SCADA integration certified team"],
      risks: [
        { id: "r1", title: "Specialized equipment lead time", description: "132kV switchgear: 26-week delivery — critical path risk", level: "critical" },
        { id: "r2", title: "Low margin window", description: "Estimated margin after current copper prices: 8.2%", level: "high" },
      ],
      penalties: ["LAD: 0.1% per day, max 10% of contract"],
      deadlines: [{ label: "Bid submission", date: "2026-05-30" }, { label: "Energization", date: "2027-06-01" }],
      boqItems: [],
      estimatedValue: 6_700_000,
      complexity: "enterprise",
      missingInfo: [],
      aiConfidence: 0.87,
    },
  },
  {
    id: "t-004",
    title: "School Campus Renovation — Fit-Out",
    client: "Abu Dhabi Education Council",
    status: "pending",
    submittedAt: "2026-05-22",
    deadline: "2026-07-10",
    value: 890_000,
    tags: ["fit-out", "education", "renovation"],
    files: [],
  },
];

/* ── Vendors ─────────────────────────────────────────────────────── */
export const mockVendors: Vendor[] = [
  {
    id: "v-001",
    name: "Gulf Steel Trading LLC",
    category: "Steel & Metals",
    location: "Dubai Industrial City",
    status: "active",
    rating: 4.7,
    deliveryDays: 5,
    contactEmail: "sales@gulfsteel.ae",
    contactPhone: "+971 4 123 4567",
    notes: "Preferred steel supplier — consistent quality, competitive pricing",
    joinedAt: "2024-03-01",
    totalOrders: 48,
    onTimeRate: 0.94,
    priceItems: [
      { material: "Steel Rebar (Y12)", unit: "ton", unitPrice: 2850, minOrder: 10, leadDays: 3, validUntil: "2026-07-31" },
      { material: "Steel Rebar (Y16)", unit: "ton", unitPrice: 2780, minOrder: 10, leadDays: 3, validUntil: "2026-07-31" },
      { material: "Structural Steel (H-Beam)", unit: "ton", unitPrice: 3200, minOrder: 5, leadDays: 7, validUntil: "2026-07-31" },
    ],
  },
  {
    id: "v-002",
    name: "Al Futtaim Building Materials",
    category: "Cement & Aggregates",
    location: "Sharjah",
    status: "active",
    rating: 4.3,
    deliveryDays: 3,
    contactEmail: "procurement@alfuttaim-bm.ae",
    contactPhone: "+971 6 234 5678",
    notes: "Reliable for cement bulk orders",
    joinedAt: "2023-11-15",
    totalOrders: 91,
    onTimeRate: 0.88,
    priceItems: [
      { material: "OPC Cement (50kg bag)", unit: "bag", unitPrice: 18.5, minOrder: 500, leadDays: 2, validUntil: "2026-06-30" },
      { material: "Washed Sand (Dune)", unit: "m³", unitPrice: 65, minOrder: 50, leadDays: 1, validUntil: "2026-06-30" },
      { material: "Crushed Stone 20mm", unit: "ton", unitPrice: 95, minOrder: 20, leadDays: 2, validUntil: "2026-06-30" },
    ],
  },
  {
    id: "v-003",
    name: "Emirates Cable Industries",
    category: "Electrical",
    location: "Abu Dhabi",
    status: "active",
    rating: 4.9,
    deliveryDays: 14,
    contactEmail: "tenders@eci.ae",
    contactPhone: "+971 2 345 6789",
    notes: "Only approved supplier for DEWA HV cables",
    joinedAt: "2024-01-10",
    totalOrders: 22,
    onTimeRate: 0.96,
    priceItems: [
      { material: "11kV XLPE Cable 3x240mm²", unit: "m", unitPrice: 285, minOrder: 500, leadDays: 21, validUntil: "2026-08-31" },
      { material: "LV Cable 4x50mm²", unit: "m", unitPrice: 48, minOrder: 1000, leadDays: 7, validUntil: "2026-08-31" },
    ],
  },
];

/* ── Material Prices ─────────────────────────────────────────────── */
const spark = (base: number, n = 12): { date: string; price: number }[] =>
  Array.from({ length: n }, (_, i) => ({
    date: new Date(Date.now() - (n - i) * 7 * 864e5).toISOString().slice(0, 10),
    price: base * (0.92 + Math.random() * 0.16),
  }));

export const mockPrices: MaterialPrice[] = [
  { id: "p-001", name: "Steel Rebar (Y16)", category: "Steel", unit: "ton", currentPrice: 2820, previousPrice: 2610, marketPrice: 2900, trend: "up", changePercent: 8.0, sparkline: spark(2700), lastUpdated: "2026-05-24", source: "LME / Local survey" },
  { id: "p-002", name: "OPC Cement", category: "Cement", unit: "ton", currentPrice: 370, previousPrice: 375, marketPrice: 365, trend: "stable", changePercent: -1.3, sparkline: spark(370), lastUpdated: "2026-05-24", source: "Local market" },
  { id: "p-003", name: "Copper Cable (16mm²)", category: "Electrical", unit: "m", currentPrice: 38.4, previousPrice: 34.1, marketPrice: 40.2, trend: "up", changePercent: 12.6, sparkline: spark(36), lastUpdated: "2026-05-24", source: "LME + local" },
  { id: "p-004", name: "Ready Mix Concrete C30", category: "Concrete", unit: "m³", currentPrice: 310, previousPrice: 305, marketPrice: 315, trend: "stable", changePercent: 1.6, sparkline: spark(308), lastUpdated: "2026-05-24", source: "Batching plants" },
  { id: "p-005", name: "Diesel (bulk)", category: "Fuel", unit: "L", currentPrice: 2.38, previousPrice: 2.65, marketPrice: 2.40, trend: "down", changePercent: -10.2, sparkline: spark(2.5), lastUpdated: "2026-05-24", source: "ENOC official" },
  { id: "p-006", name: "Structural Steel (H-Beam)", category: "Steel", unit: "ton", currentPrice: 3180, previousPrice: 2990, marketPrice: 3250, trend: "up", changePercent: 6.4, sparkline: spark(3100), lastUpdated: "2026-05-24", source: "LME / Local" },
  { id: "p-007", name: "HDPE Pipe 110mm", category: "Pipes", unit: "m", currentPrice: 62, previousPrice: 64, marketPrice: 60, trend: "down", changePercent: -3.1, sparkline: spark(63), lastUpdated: "2026-05-24", source: "Supplier survey" },
  { id: "p-008", name: "Aluminum Cladding (3mm)", category: "Cladding", unit: "m²", currentPrice: 185, previousPrice: 182, marketPrice: 190, trend: "stable", changePercent: 1.6, sparkline: spark(184), lastUpdated: "2026-05-24", source: "Supplier survey" },
];

/* ── Projects ────────────────────────────────────────────────────── */
export const mockProjects: Project[] = [
  {
    id: "pr-001",
    name: "Business Bay Metro Link — Civil",
    client: "RTA",
    status: "active",
    budget: 8_400_000,
    spent: 5_100_000,
    margin: 14.2,
    startDate: "2025-10-01",
    endDate: "2026-09-30",
    progress: 61,
    tenderId: "t-001",
    phases: [
      { id: "ph1", name: "Site Preparation", startDate: "2025-10-01", endDate: "2025-11-15", progress: 100, status: "completed" },
      { id: "ph2", name: "Substructure", startDate: "2025-11-16", endDate: "2026-03-31", progress: 100, status: "completed" },
      { id: "ph3", name: "Superstructure", startDate: "2026-04-01", endDate: "2026-07-31", progress: 65, status: "active" },
      { id: "ph4", name: "MEP & Finishing", startDate: "2026-08-01", endDate: "2026-09-30", progress: 0, status: "pending" },
    ],
  },
  {
    id: "pr-002",
    name: "Jumeirah Villa Complex — MEP",
    client: "Private Developer",
    status: "active",
    budget: 2_200_000,
    spent: 980_000,
    margin: 18.5,
    startDate: "2026-01-15",
    endDate: "2026-10-31",
    progress: 38,
    phases: [
      { id: "ph1", name: "Rough-in Works", startDate: "2026-01-15", endDate: "2026-04-30", progress: 100, status: "completed" },
      { id: "ph2", name: "Equipment Install", startDate: "2026-05-01", endDate: "2026-08-31", progress: 30, status: "active" },
      { id: "ph3", name: "Testing & Commissioning", startDate: "2026-09-01", endDate: "2026-10-31", progress: 0, status: "pending" },
    ],
  },
];

/* ── AI Insights ─────────────────────────────────────────────────── */
export const mockInsights: AIInsight[] = [
  { id: "i-001", type: "pricing", title: "Steel prices up 8% — review open tenders", body: "LME rebar prices increased 8% over the past 3 weeks. Your open tenders t-001 and t-003 have significant steel line items. AI recommends adjusting unit rates before submission deadline.", severity: "high", relatedTo: { type: "tender", id: "t-001", label: "Al Wasl Road — Phase 3" }, createdAt: "2026-05-24T08:00:00Z", read: false },
  { id: "i-002", type: "risk", title: "Penalty clause exceeds industry standard in t-001", body: "The LAD clause at AED 50,000/day is 2.5x above the market standard for this contract value. Recommend flagging to client or requesting cap in bid clarifications.", severity: "critical", relatedTo: { type: "tender", id: "t-001", label: "Al Wasl Road — Phase 3" }, createdAt: "2026-05-23T14:30:00Z", read: false },
  { id: "i-003", type: "vendor", title: "Emirates Cable: lead time may miss t-003 deadline", body: "ECI's quoted 21-day lead time for 11kV cables conflicts with t-003's mobilization requirement. Consider dual-sourcing or negotiating expedited delivery.", severity: "high", relatedTo: { type: "tender", id: "t-003", label: "Solar Farm Substation" }, createdAt: "2026-05-23T09:15:00Z", read: true },
  { id: "i-004", type: "opportunity", title: "DEWA prequalification valid until Aug 2026 — 3 open tenders match", body: "Your DEWA Grade A prequalification covers 3 newly released packages. Estimated combined value: AED 12.4M. Recommend reviewing RFQ-DEWA-2026-041.", severity: "low", createdAt: "2026-05-22T11:00:00Z", read: true },
];

/* ── Files ───────────────────────────────────────────────────────── */
export const mockFiles: UploadedFile[] = [
  { id: "f-001", name: "Al_Wasl_Road_BOQ_v3.pdf", type: "pdf", size: 4_200_000, uploadedAt: "2026-05-10T09:00:00Z", tenderId: "t-001", aiProcessed: true, tags: ["boq", "tender"] },
  { id: "f-002", name: "Structural_Drawings_Rev2.dwg", type: "dwg", size: 18_700_000, uploadedAt: "2026-05-10T09:10:00Z", tenderId: "t-001", aiProcessed: true, tags: ["drawings", "civil"] },
  { id: "f-003", name: "Vendor_Pricing_May2026.xlsx", type: "xlsx", size: 890_000, uploadedAt: "2026-05-15T14:00:00Z", aiProcessed: true, tags: ["pricing", "vendors"] },
  { id: "f-004", name: "MEP_Specs_Emaar_Tower.pdf", type: "pdf", size: 6_100_000, uploadedAt: "2026-05-18T10:30:00Z", tenderId: "t-002", aiProcessed: false, tags: ["mep", "specs"] },
  { id: "f-005", name: "DEWA_Substation_Tender_RFQ.pdf", type: "pdf", size: 9_800_000, uploadedAt: "2026-04-28T08:00:00Z", tenderId: "t-003", aiProcessed: true, tags: ["electrical", "tender"] },
];

/* ── Subscription ────────────────────────────────────────────────── */
export const mockSubscription: OrgSubscription = {
  plan: "pro",
  status: "active",
  currentPeriodEnd: "2026-06-24",
  maxProjects: "unlimited",
  maxUsers: 5,
  features: ["ai_tender_analysis", "proposal_generation", "vendor_management", "live_pricing", "client_portal", "document_management"],
};
