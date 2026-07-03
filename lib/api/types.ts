export type UserRole =
  | "company_owner"
  | "admin"
  | "tender_manager"
  | "estimator"
  | "finance"
  | "legal";

export type SupportedCountry = "OM" | "EG";

export interface ApiSuccess<T> {
  status: number;
  message: string;
  data: T;
}

export interface ApiErrorBody {
  status: number;
  message: string;
  code?: string;
}

export interface UserProfile {
  userId: string;
  email: string;
  emailVerified?: boolean;
  displayName?: string;
  photoURL?: string | null;
  phone?: string;
  phoneCountryCode?: string;
  jobTitle?: string;
  department?: string;
  locale?: "en" | "ar";
  timezone?: string;
  companyIds?: string[];
  activeCompanyId?: string | null;
  /** Role in activeCompanyId (from company membership). */
  role?: UserRole | null;
  hasPassword?: boolean;
}

export interface ChangePasswordBody {
  currentPassword?: string;
  newPassword: string;
}

export interface CompanySettings {
  quotas?: {
    maxProjects?: number;
    maxStorageBytes?: number;
    maxAiRequestsPerMonth?: number;
    maxUsers?: number;
    maxConcurrentJobs?: number;
  };
  aiSettings?: {
    defaultModel?: string;
    embeddingModel?: string;
    ocrModel?: string;
  };
  retentionPolicy?: {
    archiveAfterDays?: number;
    deleteAfterDays?: number;
    tempFileTtlHours?: number;
  };
  featureFlags?: Record<string, boolean>;
  defaultCurrency?: string;
  country?: SupportedCountry;
}

export interface UpdateCompanySettingsBody {
  companyId: string;
  settings: CompanySettings;
}

export interface UpdateUserProfileBody {
  displayName?: string;
  email?: string;
  currentPassword?: string;
  avatarImage?: string | null;
  phone?: string;
  phoneCountryCode?: string;
  jobTitle?: string;
  department?: string;
  locale?: "en" | "ar";
  timezone?: string;
  activeCompanyId?: string;
}

export interface CreateCompanyBody {
  name: string;
  country?: SupportedCountry;
  defaultCurrency?: string;
  tradeCategories?: string[];
}

export interface CreateCompanyResponse {
  companyId: string;
  name: string;
}

export interface CompanyMember {
  userId: string;
  email: string;
  displayName?: string;
  photoURL?: string | null;
  role: UserRole;
  jobTitle?: string;
  department?: string;
  status?: "active" | "invited" | "deactivated";
  invitedAt?: string;
  joinedAt?: string;
}

export interface InviteUserBody {
  companyId: string;
  email: string;
  role: UserRole;
  department?: string;
  jobTitle?: string;
}

export interface InviteUserResponse {
  inviteId: string;
  email: string;
  status: string;
  emailSent?: boolean;
}

export interface ChangeRoleBody {
  companyId: string;
  userId: string;
  role: UserRole;
}

export interface DeactivateUserBody {
  companyId: string;
  reason?: string;
}

export interface AcceptInviteBody {
  companyId: string;
  inviteId: string;
}

export type ProjectStatus =
  | "draft" | "uploading" | "processing" | "needs_review" | "ready"
  | "pricing" | "generating_proposal" | "submitted" | "awarded" | "lost" | "archived";

export type TenderType = "open" | "limited" | "single_source" | "framework" | "emergency";

export type ContractType = "lump_sum" | "admeasurement" | "cost_plus" | "turnkey" | "framework";

export interface ProjectProgressSummary {
  currentStep?: string;
  percentComplete?: number;
  documentsReady?: number;
  jobsPending?: number;
}

export interface Project {
  projectId: string;
  companyId: string;
  name: string;
  client?: string;
  location?: string;
  status: ProjectStatus;
  tenderType?: TenderType;
  contractType?: ContractType;
  disciplines?: string[];
  submissionDeadline?: string;
  progressSummary?: ProjectProgressSummary;
  createdBy?: string;
  createdAt?: { _seconds: number; _nanoseconds: number } | string;
  updatedAt?: { _seconds: number; _nanoseconds: number } | string;
}

export interface CreateProjectBody {
  companyId: string;
  name: string;
  client?: string;
  location?: string;
  tenderType?: TenderType;
  contractType?: ContractType;
  disciplines?: string[];
  submissionDeadline?: string;
}

export interface UpdateProjectBody {
  companyId: string;
  name?: string;
  client?: string;
  location?: string;
  tenderType?: TenderType;
  contractType?: ContractType;
  disciplines?: string[];
  submissionDeadline?: string;
}

export interface ChangeStatusBody {
  companyId: string;
  status: ProjectStatus;
  statusReason?: string;
}

export type DocumentStep =
  | "upload_confirm" | "document_classify" | "ocr" | "parse"
  | "thumbnail" | "chunk" | "embedding" | "document_ready";

export type DocumentStatus =
  | "pending" | "uploaded" | "processing" | "ready" | "failed";

export type JobStatus =
  | "pending" | "ready" | "running" | "retry" | "completed" | "failed" | "cancelled";

export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/zip",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "image/png",
  "image/jpeg",
  "image/webp",
  "text/plain",
  "text/csv",
] as const;

export type AllowedMimeType = typeof ALLOWED_MIME_TYPES[number];

export interface UploadFileSpec {
  name: string;
  sizeBytes: number;
  mimeType: AllowedMimeType;
}

export interface CreateUploadSessionsBody {
  companyId: string;
  projectId: string;
  files: UploadFileSpec[];
}

export interface UploadSlot {
  documentId: string;
  uploadUrl: string;
  expiresIn: number;
  r2ObjectKey: string;
}

export interface CreateUploadSessionsResponse {
  uploads: UploadSlot[];
}

export interface ConfirmUploadBody {
  companyId: string;
  projectId: string;
  checksum?: string;
}

export interface RetryDocumentBody {
  companyId: string;
  projectId: string;
  fromStep?: DocumentStep;
}

export interface DocumentRecord {
  documentId: string;
  projectId: string;
  companyId: string;
  filename?: string;
  name?: string;
  mimeType?: string;
  sizeBytes?: number;
  status?: DocumentStatus;
  currentStep?: DocumentStep;
  progressPercent?: number;
  error?: { code?: string; message?: string; retryable?: boolean } | null;
  uploadedAt?: { _seconds: number; _nanoseconds: number } | string;
  createdAt?:  { _seconds: number; _nanoseconds: number } | string;
  updatedAt?:  { _seconds: number; _nanoseconds: number } | string;
  thumbnailUrl?: string | null;
}

export interface JobView {
  jobId: string;
  jobType: string;
  status: JobStatus;
  documentId?: string | null;
  priority?: string;
  progressPercent?: number;
  currentStep?: string;
  attemptCount?: number;
  maxAttempts?: number;
  error?: { code?: string; message?: string; retryable?: boolean } | null;
  outputRefs?: Record<string, unknown> | null;
  createdAt?: string;
  updatedAt?: string;
  completedAt?: string | null;
}

export interface DownloadUrlResponse {
  documentId: string;
  downloadUrl: string;
  expiresIn: number;
  filename: string;
}

// Aliases for backward compatibility with earlier code
export type DocumentMime = AllowedMimeType;
export type UploadSessionFile = UploadFileSpec;
export type UploadSessionsBody = CreateUploadSessionsBody;
export type DocumentDoc = DocumentRecord;

export type PricingRunStatus = "estimating" | "review" | "draft" | "locked";

export type PricingRunType = "ai_assisted" | "manual" | "benchmark";

export interface PricingTotals {
  subtotal?: number;
  overhead?: number;
  contingency?: number;
  profit?: number;
  grandTotal?: number;
  /** @deprecated use grandTotal */
  margin?: number;
  /** @deprecated use grandTotal */
  total?: number;
  currency?: string;
}

export interface MarginPolicy {
  overheadPercent?: number;
  profitPercent?: number;
  contingencyPercent?: number;
  riskPercent?: number;
  targetMarginPct?: number;
  riskContingencyPct?: number;
}

export interface PricingRun {
  pricingRunId: string;
  projectId: string;
  companyId: string;
  status: PricingRunStatus;
  runType?: PricingRunType;
  currency?: string;
  marginPolicy?: MarginPolicy;
  totals?: PricingTotals;
  createdAt?: { _seconds: number; _nanoseconds: number } | string;
  updatedAt?: { _seconds: number; _nanoseconds: number } | string;
  approvedAt?: { _seconds: number; _nanoseconds: number } | string | null;
  approvedBy?: string | null;
  lockedAt?:   { _seconds: number; _nanoseconds: number } | string | null;
}

export interface PricingLineItem {
  itemId: string;
  boqItemId?: string;
  description?: string;
  category?: string;
  quantity?: number;
  unit?: string;
  aiRate?: number;
  manualRate?: number;
  finalRate?: number;
  amount?: number;
  material?: number;
  labor?: number;
  equipment?: number;
  subcontract?: number;
  source?: "ai" | "manual" | "benchmark";
  notes?: string;
}

export interface StartPricingRunBody {
  companyId: string;
  projectId: string;
  currency?: string;
  runType?: PricingRunType;
  marginPolicy?: MarginPolicy;
}

export interface OverrideRateBody {
  companyId: string;
  projectId: string;
  boqItemId: string;
  finalRate?: number;
  quantity?: number;
  unit?: string;
  description?: string;
  material?: number;
  labor?: number;
  equipment?: number;
  subcontract?: number;
  notes?: string;
}

export interface UpdatePricingRunBody {
  companyId: string;
  projectId: string;
  marginPolicy?: MarginPolicy;
  currency?: string;
}

export type ProposalStatus =
  | "draft" | "generating" | "review" | "approved" | "exported" | "locked";

export type ProposalSectionKey =
  | "executive_summary" | "methodology" | "pricing" | "schedule" | "compliance" | "team";

export interface ProposalSection {
  sectionId: string;
  sectionKey?: ProposalSectionKey | string;
  title?: string;
  content?: string;
  /** @deprecated use content */
  body?: string;
  status?: "pending" | "generating" | "complete" | "ready" | "failed";
  wordCount?: number;
  updatedAt?: { _seconds: number; _nanoseconds: number } | string;
}

export interface Proposal {
  proposalId: string;
  projectId: string;
  companyId: string;
  title?: string;
  status: ProposalStatus;
  pricingRunId?: string;
  approvedBy?: string | null;
  approvedAt?: { _seconds: number; _nanoseconds: number } | string | null;
  lockedBy?: string | null;
  lockedAt?:   { _seconds: number; _nanoseconds: number } | string | null;
  createdAt?:  { _seconds: number; _nanoseconds: number } | string;
  updatedAt?:  { _seconds: number; _nanoseconds: number } | string;
}

export interface GenerateProposalBody {
  companyId: string;
  projectId: string;
  title?: string;
  pricingRunId?: string;
}

export interface RegenerateSectionBody {
  companyId: string;
  projectId: string;
  sectionId?: string;
  sectionKey?: ProposalSectionKey;
}

export interface UpdateProposalSectionBody {
  companyId: string;
  projectId: string;
  title?: string;
  content?: string;
}

export interface UpdateProposalBody {
  companyId: string;
  projectId: string;
  title: string;
}

export type ComplianceChecklistStatus = "complete" | "missing" | "partial" | string;

export interface ComplianceChecklistItem {
  title?: string;
  status?: ComplianceChecklistStatus;
  requirementId?: string;
  priority?: string;
  notes?: string;
}

export interface ComplianceRun {
  id: string;
  companyId?: string;
  projectId?: string;
  status?: "generating" | "complete" | "failed" | string;
  checklist?: ComplianceChecklistItem[];
  requiredDocuments?: string[];
  requiredCertificates?: string[];
  requiredStaff?: string[];
  missingItems?: ComplianceChecklistItem[];
  readinessScore?: number;
  blockers?: ComplianceChecklistItem[];
  createdAt?: { _seconds: number; _nanoseconds: number } | string;
  updatedAt?: { _seconds: number; _nanoseconds: number } | string;
}

export interface ProgrammeMilestone {
  name?: string;
  week?: number;
  date?: string;
}

export interface ProgrammeRun {
  id: string;
  companyId?: string;
  projectId?: string;
  status?: "generating" | "complete" | "failed" | string;
  milestones?: ProgrammeMilestone[];
  criticalPath?: string[];
  calendarAssumptions?: {
    workingDaysPerWeek?: number;
    hoursPerDay?: number;
  };
  createdAt?: { _seconds: number; _nanoseconds: number } | string;
  updatedAt?: { _seconds: number; _nanoseconds: number } | string;
}

export interface ProgrammeActivity {
  id: string;
  programmeId?: string;
  name?: string;
  durationDays?: number;
  dependencies?: string[];
  isMilestone?: boolean;
}

export type ExportType = "zip" | "pdf" | "word" | "excel" | "submission_package";

export type ExportStatus = "queued" | "processing" | "ready" | "failed";

export type ExportArtifact =
  | "proposal" | "pricing" | "boq" | "compliance" | "schedule" | "requirements" | "risks";

export const EXPORT_TYPES: ExportType[] = ["submission_package", "pdf", "word", "excel", "zip"];

export const EXPORT_ARTIFACTS: ExportArtifact[] = [
  "proposal", "pricing", "boq", "compliance", "schedule", "requirements", "risks",
];

export interface ExportRecord {
  exportId: string;
  projectId: string;
  companyId: string;
  exportType: ExportType;
  status: ExportStatus;
  proposalId?: string | null;
  pricingRunId?: string | null;
  selectedArtifacts?: ExportArtifact[];
  filename?: string;
  mimeType?: string;
  sizeBytes?: number;
  checksum?: string;
  version?: number;
  jobId?: string | null;
  error?: { code?: string; message?: string } | null;
  createdAt?:   { _seconds: number; _nanoseconds: number } | string;
  updatedAt?:   { _seconds: number; _nanoseconds: number } | string;
  completedAt?: { _seconds: number; _nanoseconds: number } | string | null;
}

export interface CreateExportBody {
  companyId: string;
  projectId: string;
  exportType: ExportType;
  proposalId?: string;
  pricingRunId?: string;
  selectedArtifacts?: ExportArtifact[];
}

export interface ExportDownloadResponse {
  exportId: string;
  downloadUrl: string;
  expiresIn: number;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  checksum?: string;
}

export type ChatRating = "up" | "down";

export type ChatMessageRole = "user" | "assistant" | "system";

export type ChatMessageStatus = "pending" | "running" | "completed" | "failed";

export interface ChatSession {
  sessionId: string;
  companyId: string;
  projectId: string;
  title?: string;
  createdBy?: string;
  createdAt?: { _seconds: number; _nanoseconds: number } | string;
  updatedAt?: { _seconds: number; _nanoseconds: number } | string;
  lastMessageAt?: { _seconds: number; _nanoseconds: number } | string;
}

export interface ChatMessage {
  messageId: string;
  sessionId: string;
  projectId?: string;
  role: ChatMessageRole;
  content?: string;
  status?: ChatMessageStatus;
  rating?: ChatRating | null;
  ratingComment?: string | null;
  citations?: Array<{ documentId?: string; quote?: string }>;
  jobId?: string | null;
  error?: { code?: string; message?: string } | null;
  createdAt?: { _seconds: number; _nanoseconds: number } | string;
  updatedAt?: { _seconds: number; _nanoseconds: number } | string;
}

export interface CreateChatSessionBody {
  companyId: string;
  projectId: string;
  title?: string;
}

export interface SendChatMessageBody {
  companyId: string;
  projectId: string;
  sessionId: string;
  content: string;
}

export interface RateChatMessageBody {
  companyId: string;
  projectId: string;
  rating: ChatRating;
  comment?: string;
}

export interface Supplier {
  supplierId: string;
  companyId: string;
  name: string;
  category?: string;
  contactName?: string;
  email?: string;
  phone?: string;
  country?: string;
  city?: string;
  website?: string;
  rating?: number;
  notes?: string;
  status?: "active" | "inactive";
  createdAt?: { _seconds: number; _nanoseconds: number } | string;
  updatedAt?: { _seconds: number; _nanoseconds: number } | string;
}

export interface CreateSupplierBody {
  companyId: string;
  name: string;
  category?: string;
  contactName?: string;
  email?: string;
  phone?: string;
  country?: string;
  city?: string;
  website?: string;
  notes?: string;
}

export interface OpsHealth {
  llmHealthy?: boolean;
  llmLatencyMs?: number;
  embeddingModel?: string;
  ocrModel?: string;
  error?: string | null;
  checkedAt?: string;
}

export interface OpsAlert {
  alertId: string;
  alertType?: string;
  severity?: "info" | "warning" | "critical";
  title?: string;
  message?: string;
  createdAt?: string;
  resolvedAt?: string | null;
}

export interface OpsJobsMetrics {
  total?: number;
  completed?: number;
  failed?: number;
  retry?: number;
  running?: number;
  ready?: number;
  byType?: Record<string, number>;
  failureRate?: number;
}

export interface OpsAiMetrics {
  recentExecutions?: number;
  calls?: number;
  tokens?: number;
  latencyMsAvg?: number;
  costEstimateUsd?: number;
  byModel?: Record<string, number>;
}

export interface OpsBusinessMetrics {
  total?: number;
  submitted?: number;
  awarded?: number;
  lost?: number;
  avgCompletionHours?: number;
  winRate?: number;
}

export interface OpsQualityMetrics {
  copilotRatingsUp?: number;
  copilotRatingsDown?: number;
  lowConfidenceRate?: number;
  citationCoverage?: number;
}

export interface OpsAnalyticsDashboard {
  periodDays?: number;
  projects?: OpsBusinessMetrics;
  jobs?:     { total?: number; failed?: number; failureRate?: number };
  ai?:       OpsAiMetrics;
  quality?:  OpsQualityMetrics;
  embeddingModel?: string;
}

export interface OpsUsage {
  storageBytes?: number;
  maxStorageBytes?: number;
  projects?: number;
  maxProjects?: number;
  users?: number;
  maxUsers?: number;
  aiRequestsThisMonth?: number;
  maxAiRequestsPerMonth?: number;
}

export interface OpsAuditLog {
  logId: string;
  action?: string;
  actorUserId?: string;
  resource?: string;
  resourceId?: string;
  createdAt?: string;
  metadata?: Record<string, unknown>;
}

export interface OpsKnowledgeItem {
  itemId: string;
  title?: string;
  type?: string;
  status?: string;
  updatedAt?: string;
}

export type InsightSeverity = "critical" | "high" | "medium" | "low";
export type InsightType = "risk" | "opportunity" | "pricing" | "vendor" | "market";

export interface CompanyInsight {
  insightId: string;
  type: InsightType;
  severity: InsightSeverity;
  title: string;
  body: string;
  projectId?: string | null;
  projectName?: string | null;
  relatedTo?: { type: string; id: string; label: string } | null;
  read: boolean;
  createdAt: string;
}

export type MarketPriceTrend = "up" | "down" | "stable";

export interface MarketPrice {
  id: string;
  name: string;
  category?: string;
  unit: string;
  currency: string;
  price: number;
  trend: MarketPriceTrend;
  changePercent: number;
  updatedAt?: string;
  source?: string;
}
