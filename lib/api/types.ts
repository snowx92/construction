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
  hasPassword?: boolean;
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
