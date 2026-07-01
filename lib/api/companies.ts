import { apiFetch } from "./client";
import type {
  CreateCompanyBody,
  CreateCompanyResponse,
  UpdateCompanySettingsBody,
} from "./types";

export function createCompany(body: CreateCompanyBody) {
  return apiFetch<CreateCompanyResponse>("/api/admin/companies", { method: "POST", body });
}

export function updateCompanySettings(body: UpdateCompanySettingsBody) {
  return apiFetch<{ companyId: string; updated: boolean }>(
    "/api/admin/companies/settings",
    { method: "PUT", body }
  );
}
