import { apiFetch } from "./client";
import type { CreateSupplierBody, Supplier } from "./types";

export function listSuppliers(companyId: string) {
  return apiFetch<Supplier[] | { suppliers: Supplier[] }>("/api/suppliers", {
    query: { companyId },
  }).then((d) => (Array.isArray(d) ? d : d.suppliers ?? []));
}

export function createSupplier(body: CreateSupplierBody) {
  return apiFetch<{ supplierId: string }>("/api/suppliers", {
    method: "POST",
    body,
  });
}
