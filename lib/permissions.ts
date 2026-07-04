import type { UserRole } from "./api/types";

/** Mirrors Backend/functions/api/helper/permissionsHelper.js PERMISSIONS. */
export const PERMISSIONS = {
  manageBilling: ["company_owner"],
  manageRoles: ["company_owner", "admin"],
  manageCompanySettings: ["company_owner", "admin"],
  createProject: ["company_owner", "admin", "tender_manager"],
  archiveProject: ["company_owner", "admin", "tender_manager"],
  uploadDocuments: ["company_owner", "admin", "tender_manager", "estimator"],
  viewDocuments: [
    "company_owner", "admin", "tender_manager", "estimator",
    "planner", "finance", "legal", "read_only",
  ],
  viewJobs: [
    "company_owner", "admin", "tender_manager", "estimator",
    "planner", "finance", "legal", "read_only",
  ],
  manageBoq: ["company_owner", "admin", "tender_manager", "estimator"],
  managePricing: ["company_owner", "admin", "tender_manager", "estimator", "finance"],
  approvePricing: ["company_owner", "admin", "estimator", "finance"],
  generateProposal: ["company_owner", "admin", "tender_manager"],
  approveProposal: ["company_owner", "admin", "tender_manager", "legal"],
  manageSchedule: ["company_owner", "admin", "tender_manager", "planner"],
  manageCompliance: ["company_owner", "admin", "tender_manager", "legal"],
  useCopilot: [
    "company_owner", "admin", "tender_manager", "estimator",
    "planner", "finance", "legal", "read_only",
  ],
  exportPackage: ["company_owner", "admin", "tender_manager", "estimator", "finance"],
  viewAuditLogs: ["company_owner", "admin"],
} as const satisfies Record<string, readonly UserRole[]>;

export type PermissionKey = keyof typeof PERMISSIONS;

export function hasPermission(role: UserRole | null | undefined, permission: PermissionKey): boolean {
  if (!role) return false;
  return (PERMISSIONS[permission] as readonly UserRole[]).includes(role);
}
