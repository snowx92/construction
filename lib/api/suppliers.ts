import { apiFetch } from "./client";
import type { CreateSupplierBody, Supplier, UpdateSupplierBody } from "./types";

export function listSuppliers(companyId: string) {
  return apiFetch<Supplier[] | { suppliers: Supplier[] }>("/api/suppliers", {
    query: { companyId },
  }).then((d) => (Array.isArray(d) ? d : d.suppliers ?? []));
}

export function getSupplier(supplierId: string, companyId: string) {
  return apiFetch<Supplier | { supplier: Supplier }>(`/api/suppliers/${supplierId}`, {
    query: { companyId },
  }).then((d) => ("supplier" in (d as object) ? (d as { supplier: Supplier }).supplier : (d as Supplier)));
}

export function createSupplier(body: CreateSupplierBody) {
  return apiFetch<{ supplierId: string }>("/api/suppliers", {
    method: "POST",
    body,
  });
}

export function updateSupplier(supplierId: string, body: UpdateSupplierBody) {
  return apiFetch<{ supplierId: string; updated: boolean }>(`/api/suppliers/${supplierId}`, {
    method: "PUT",
    body,
  });
}

export function deleteSupplier(supplierId: string, companyId: string) {
  return apiFetch<{ supplierId: string; deleted: boolean }>(`/api/suppliers/${supplierId}`, {
    method: "DELETE",
    query: { companyId },
  });
}
