import { apiFetch } from "./client";
import type {
  CompanyProfile,
  Equipment,
  LabourCategory,
  PastProject,
  StaffMember,
} from "@/types";

export type CompanyProfileFields = Omit<
  CompanyProfile,
  "pastProjects" | "staff" | "equipment" | "labour"
>;

function unwrapList<T>(data: T[] | Record<string, T[]>, key: string): T[] {
  if (Array.isArray(data)) return data;
  return (data as Record<string, T[]>)[key] ?? [];
}

function unwrapItem<T>(data: T | Record<string, T>, key: string): T {
  if (data && typeof data === "object" && key in (data as object)) {
    return (data as Record<string, T>)[key];
  }
  return data as T;
}

export function getCompanyProfile(companyId: string) {
  return apiFetch<{ profile: CompanyProfileFields } | CompanyProfileFields>(
    "/api/company/profile",
    { query: { companyId } },
  ).then((d) => ("profile" in (d as object) ? (d as { profile: CompanyProfileFields }).profile : d as CompanyProfileFields));
}

export function updateCompanyProfile(companyId: string, profile: Partial<CompanyProfileFields>) {
  return apiFetch<{ profile: CompanyProfileFields; updated: boolean }>(
    "/api/company/profile",
    { method: "PUT", body: { companyId, ...profile } },
  );
}

export function listStaff(companyId: string) {
  return apiFetch<StaffMember[] | { staff: StaffMember[] }>("/api/company/staff", {
    query: { companyId },
  }).then((d) => unwrapList(d, "staff"));
}

export function createStaff(companyId: string, body: Omit<StaffMember, "id">) {
  return apiFetch<{ staff: StaffMember }>("/api/company/staff", {
    method: "POST",
    body: { companyId, ...body },
  }).then((d) => unwrapItem(d, "staff"));
}

export function updateStaff(staffId: string, companyId: string, body: Partial<Omit<StaffMember, "id">>) {
  return apiFetch<{ staff: StaffMember }>(`/api/company/staff/${staffId}`, {
    method: "PUT",
    body: { companyId, ...body },
  }).then((d) => unwrapItem(d, "staff"));
}

export function deleteStaff(staffId: string, companyId: string) {
  return apiFetch<{ itemId: string; deleted: boolean }>(`/api/company/staff/${staffId}`, {
    method: "DELETE",
    body: { companyId },
  });
}

export function listEquipment(companyId: string) {
  return apiFetch<Equipment[] | { equipment: Equipment[] }>("/api/company/equipment", {
    query: { companyId },
  }).then((d) => unwrapList(d, "equipment"));
}

export function createEquipment(companyId: string, body: Omit<Equipment, "id">) {
  return apiFetch<{ equipment: Equipment }>("/api/company/equipment", {
    method: "POST",
    body: { companyId, ...body },
  }).then((d) => unwrapItem(d, "equipment"));
}

export function updateEquipment(equipmentId: string, companyId: string, body: Partial<Omit<Equipment, "id">>) {
  return apiFetch<{ equipment: Equipment }>(`/api/company/equipment/${equipmentId}`, {
    method: "PUT",
    body: { companyId, ...body },
  }).then((d) => unwrapItem(d, "equipment"));
}

export function deleteEquipment(equipmentId: string, companyId: string) {
  return apiFetch<{ itemId: string; deleted: boolean }>(`/api/company/equipment/${equipmentId}`, {
    method: "DELETE",
    body: { companyId },
  });
}

export function listLabour(companyId: string) {
  return apiFetch<LabourCategory[] | { labour: LabourCategory[] }>("/api/company/labour", {
    query: { companyId },
  }).then((d) => unwrapList(d, "labour"));
}

export function createLabour(companyId: string, body: Omit<LabourCategory, "id">) {
  return apiFetch<{ labour: LabourCategory }>("/api/company/labour", {
    method: "POST",
    body: { companyId, ...body },
  }).then((d) => unwrapItem(d, "labour"));
}

export function updateLabour(labourId: string, companyId: string, body: Partial<Omit<LabourCategory, "id">>) {
  return apiFetch<{ labour: LabourCategory }>(`/api/company/labour/${labourId}`, {
    method: "PUT",
    body: { companyId, ...body },
  }).then((d) => unwrapItem(d, "labour"));
}

export function deleteLabour(labourId: string, companyId: string) {
  return apiFetch<{ itemId: string; deleted: boolean }>(`/api/company/labour/${labourId}`, {
    method: "DELETE",
    body: { companyId },
  });
}

export function listPastProjects(companyId: string) {
  return apiFetch<PastProject[] | { pastProjects: PastProject[] }>("/api/company/past-projects", {
    query: { companyId },
  }).then((d) => unwrapList(d, "pastProjects"));
}

export function createPastProject(companyId: string, body: Omit<PastProject, "id">) {
  return apiFetch<{ pastProject: PastProject }>("/api/company/past-projects", {
    method: "POST",
    body: { companyId, ...body },
  }).then((d) => unwrapItem(d, "pastProject"));
}

export function updatePastProject(projectId: string, companyId: string, body: Partial<Omit<PastProject, "id">>) {
  return apiFetch<{ pastProject: PastProject }>(`/api/company/past-projects/${projectId}`, {
    method: "PUT",
    body: { companyId, ...body },
  }).then((d) => unwrapItem(d, "pastProject"));
}

export function deletePastProject(projectId: string, companyId: string) {
  return apiFetch<{ itemId: string; deleted: boolean }>(`/api/company/past-projects/${projectId}`, {
    method: "DELETE",
    body: { companyId },
  });
}

/** Loads profile scalar fields and all subcollections in parallel. */
export async function loadFullCompanyProfile(companyId: string): Promise<CompanyProfile> {
  const [profile, pastProjects, staff, equipment, labour] = await Promise.all([
    getCompanyProfile(companyId),
    listPastProjects(companyId),
    listStaff(companyId),
    listEquipment(companyId),
    listLabour(companyId),
  ]);

  return { ...profile, pastProjects, staff, equipment, labour };
}
