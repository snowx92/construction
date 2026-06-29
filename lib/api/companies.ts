import { apiFetch } from "./client";
import type { CreateCompanyBody, CreateCompanyResponse } from "./types";

export function createCompany(body: CreateCompanyBody) {
  return apiFetch<CreateCompanyResponse>("/api/admin/companies", { method: "POST", body });
}
