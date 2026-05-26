/* ── Tender ──────────────────────────────────────────────────────── */
export type TenderStatus = "pending" | "analyzing" | "ready" | "proposal_sent" | "won" | "lost";
export type RiskLevel    = "low" | "medium" | "high" | "critical";

export interface BOQItem {
  id:          string;
  description: string;
  unit:        string;
  quantity:    number;
  unitPrice:   number;
  total:       number;
  category:    string;
}

export interface TenderRisk {
  id:          string;
  title:       string;
  description: string;
  level:       RiskLevel;
  clause?:     string;
}

export interface TenderAnalysis {
  summary:          string;
  requirements:     string[];
  risks:            TenderRisk[];
  penalties:        string[];
  deadlines:        { label: string; date: string }[];
  boqItems:         BOQItem[];
  estimatedValue:   number;
  complexity:       "simple" | "moderate" | "complex" | "enterprise";
  missingInfo:      string[];
  aiConfidence:     number;
}

export interface Tender {
  id:           string;
  title:        string;
  client:       string;
  status:       TenderStatus;
  submittedAt:  string;
  deadline:     string;
  value?:       number;
  analysis?:    TenderAnalysis;
  files:        UploadedFile[];
  tags:         string[];
}

/* ── Vendor ──────────────────────────────────────────────────────── */
export type VendorStatus = "active" | "pending" | "inactive";

export interface VendorPriceItem {
  material:    string;
  unit:        string;
  unitPrice:   number;
  minOrder:    number;
  leadDays:    number;
  validUntil:  string;
}

export interface Vendor {
  id:           string;
  name:         string;
  category:     string;
  location:     string;
  status:       VendorStatus;
  rating:       number;
  deliveryDays: number;
  priceItems:   VendorPriceItem[];
  contactEmail: string;
  contactPhone: string;
  notes:        string;
  joinedAt:     string;
  totalOrders:  number;
  onTimeRate:   number;
}

/* ── Pricing ─────────────────────────────────────────────────────── */
export type PriceTrend = "up" | "down" | "stable";

export interface PricePoint { date: string; price: number; }

export interface MaterialPrice {
  id:           string;
  name:         string;
  category:     string;
  unit:         string;
  currentPrice: number;
  previousPrice:number;
  marketPrice:  number;
  trend:        PriceTrend;
  changePercent:number;
  sparkline:    PricePoint[];
  lastUpdated:  string;
  source:       string;
}

/* ── Proposal ────────────────────────────────────────────────────── */
export type ProposalType = "technical" | "financial" | "combined";
export type ProposalStatus = "draft" | "generating" | "ready" | "sent" | "approved";

export interface ProposalSection {
  id:      string;
  title:   string;
  content: string;
  aiGenerated: boolean;
}

export interface Proposal {
  id:        string;
  tenderId:  string;
  type:      ProposalType;
  status:    ProposalStatus;
  sections:  ProposalSection[];
  totalCost: number;
  margin:    number;
  createdAt: string;
  updatedAt: string;
}

/* ── Project ─────────────────────────────────────────────────────── */
export type ProjectStatus = "planning" | "active" | "on_hold" | "completed";

export interface ProjectPhase {
  id:         string;
  name:       string;
  startDate:  string;
  endDate:    string;
  progress:   number;
  status:     "pending" | "active" | "completed";
}

export interface Project {
  id:           string;
  name:         string;
  client:       string;
  status:       ProjectStatus;
  budget:       number;
  spent:        number;
  margin:       number;
  startDate:    string;
  endDate:      string;
  phases:       ProjectPhase[];
  tenderId?:    string;
  progress:     number;
}

/* ── Document / File ─────────────────────────────────────────────── */
export type FileType = "pdf" | "dwg" | "xlsx" | "docx" | "image" | "other";

export interface UploadedFile {
  id:         string;
  name:       string;
  type:       FileType;
  size:       number;
  uploadedAt: string;
  tenderId?:  string;
  projectId?: string;
  aiProcessed:boolean;
  tags:       string[];
}

/* ── AI Insight ──────────────────────────────────────────────────── */
export type InsightType = "risk" | "opportunity" | "pricing" | "vendor" | "market";

export interface AIInsight {
  id:         string;
  type:       InsightType;
  title:      string;
  body:       string;
  severity:   RiskLevel;
  relatedTo?: { type: string; id: string; label: string };
  createdAt:  string;
  read:       boolean;
}

/* ── Company Profile (organisation-wide reference data) ─────────── */
export interface PastProject {
  id:        string;
  name:      string;
  client:    string;
  value:     number;       // AED
  year:      number;
  status:    "completed" | "in_progress" | "handed_over";
  category:  string;       // e.g. "Roads", "MEP", "Substations"
  description?: string;
}

export interface StaffMember {
  id:         string;
  name:       string;
  employeeId: string;
  passportId: string;
  title:      string;
  department: string;
  reportsTo?: string;      // employeeId of manager — used to build the org tree
  email?:     string;
  phone?:     string;
  nationality?: string;
}

export interface Equipment {
  id:        string;
  name:      string;          // e.g. "Crawler crane (50T)"
  category:  string;          // "Earthmoving" | "Lifting" | "Concrete" | "Transport" | "Power" | "Other"
  model?:    string;          // e.g. "Liebherr LR 1100"
  ownership: "owned" | "leased" | "subcontract";
  quantity:  number;
  yearAcquired?: number;
  dailyRate?: number;         // AED / day — used in financial estimates
  status:    "available" | "in_use" | "maintenance" | "retired";
  notes?:    string;
}

export interface LabourCategory {
  id:         string;
  title:      string;          // e.g. "Civil Foreman", "Steel Fixer", "MEP Technician"
  trade:      string;          // "Civil" | "MEP" | "Electrical" | "Finishing" | "Supervision" | "Operator"
  headcount:  number;          // number of workers in this category
  dailyRate:  number;          // AED per worker per day
  skillLevel: "skilled" | "semi_skilled" | "unskilled" | "supervisor";
  nationality?: string;
  notes?:     string;
}

export interface CompanyProfile {
  legalName:     string;
  tradeName:     string;
  registration:  string;     // Trade licence number
  vatNumber:     string;
  established:   number;     // year
  headquarters:  string;
  website:       string;
  description:   string;
  tagline?:      string;     // one-line company tagline
  vision?:       string;     // vision statement
  bio?:          string;     // longer about / founder story
  linkedin?:     string;
  instagram?:    string;
  twitter?:      string;
  certifications: string[];
  pastProjects:  PastProject[];
  staff:         StaffMember[];
  equipment:     Equipment[];
  labour:        LabourCategory[];
}

/* ── Pricing ─────────────────────────────────────────────────────── */
export interface PricingItem {
  id:          string;
  description: string;
  unit:        string;
  unitPrice:   number;
  tenderRate?: number;   // original BOQ rate for comparison
  variance?:   number;   // % diff from tender estimate
  source:      string;
  validUntil:  string;
}

/* ── Project Workspace (Claude-chat model) ───────────────────────── */
export type ProjectWorkspaceStatus = "new" | "uploading" | "analyzing" | "ready" | "in_progress" | "completed";
export type PricingSource = "scraped" | "uploaded";

export interface ProjectWorkspace {
  id:            string;
  name:          string;                // user-named, like a chat
  status:        ProjectWorkspaceStatus;
  createdAt:     string;
  updatedAt:     string;
  tenderId?:     string;
  clientName:    string;
  projectType:   string;               // "Road Infrastructure" | "MEP" | "Fit-Out" etc.
  country?:      "eg" | "om";          // market for currency & pricing sources
  files:         UploadedFile[];
  analysis?:     TenderAnalysis;
  proposals:     GeneratedProposal[];
  financials?:   FinancialAnalysis;
  pinned:        boolean;
  pricingSource?: PricingSource;
  pricingItems?:  PricingItem[];
}

/* ── Generated Proposals ─────────────────────────────────────────── */
export type ProposalDocType =
  | "tender_submission"
  | "tender_overview"
  | "risk_assessment"
  | "boq_report"
  | "technical_proposal"
  | "company_profile"
  | "method_statement"
  | "scope_of_work"
  | "execution_plan"
  | "financial_proposal";

export interface DocSection {
  id:      string;
  heading: string;
  body:    string;
}

export interface GeneratedProposal {
  id:        string;
  type:      ProposalDocType;
  title:     string;
  status:    "pending" | "generating" | "ready";
  sections:  DocSection[];
  createdAt: string;
  wordCount: number;
}

/* ── Financial Analysis ──────────────────────────────────────────── */
export interface CostLine {
  id:       string;
  category: "material" | "labor" | "equipment" | "subcontract" | "overhead";
  item:     string;
  unit:     string;
  qty:      number;
  rate:     number;
  total:    number;
}

export interface FinancialAnalysis {
  totalCost:      number;
  margin:         number;
  suggestedPrice: number;
  breakdown:      CostLine[];
  laborCost:      number;
  materialCost:   number;
  equipmentCost:  number;
  overheadCost:   number;
  riskBuffer:     number;
  notes:          string[];
}

/* ── ERP: Purchase Order / Procurement ───────────────────────────── */
export type POStatus = "draft" | "pending_approval" | "approved" | "ordered" | "delivered" | "cancelled";

export interface PurchaseOrder {
  id:          string;
  poNumber:    string;
  projectId:   string;
  projectName: string;
  vendorId:    string;
  vendorName:  string;
  status:      POStatus;
  items:       { description: string; unit: string; qty: number; unitPrice: number; total: number }[];
  totalAmount: number;
  requestedBy: string;
  approvedBy?: string;
  createdAt:   string;
  deliveryDate:string;
  notes:       string;
}

/* ── ERP: Inventory / Warehouse ──────────────────────────────────── */
export type StockStatus = "in_stock" | "low_stock" | "out_of_stock";

export interface StockItem {
  id:          string;
  code:        string;
  name:        string;
  category:    string;
  unit:        string;
  qtyOnHand:   number;
  minQty:      number;
  location:    string;
  projectId?:  string;
  lastMovement:string;
  status:      StockStatus;
  unitCost:    number;
}

export interface StockMovement {
  id:        string;
  itemId:    string;
  itemName:  string;
  type:      "receipt" | "issue" | "transfer" | "adjustment";
  qty:       number;
  date:      string;
  reference: string;
  by:        string;
}

/* ── ERP: Project Phase / Task ───────────────────────────────────── */
export interface ErpTask {
  id:          string;
  phaseId:     string;
  name:        string;
  startDate:   string;
  endDate:     string;
  progress:    number;
  assignedTo:  string;
  status:      "not_started" | "in_progress" | "completed" | "delayed";
  dependencies:string[];
}

export interface ErpPhase {
  id:        string;
  projectId: string;
  name:      string;
  startDate: string;
  endDate:   string;
  progress:  number;
  color:     string;
  tasks:     ErpTask[];
}

/* ── Feature flags / SaaS ────────────────────────────────────────── */
export type Plan = "starter" | "pro" | "business" | "enterprise";

export interface OrgSubscription {
  plan:            Plan;
  status:          "active" | "trialing" | "past_due" | "canceled";
  trialEndsAt?:    string;
  currentPeriodEnd:string;
  maxProjects:     number | "unlimited";
  maxUsers:        number | "unlimited";
  features:        string[];
}
