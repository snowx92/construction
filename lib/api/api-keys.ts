import { apiFetch } from "./client";

export interface ApiKeyRecord {
  keyId: string;
  name?: string;
  prefix?: string;
  scopes?: string[];
  lastUsedAt?: string;
  createdAt?: string;
}

export function listApiKeys(companyId: string) {
  return apiFetch<{ keys: ApiKeyRecord[] }>("/api/company/api-keys", {
    query: { companyId },
  }).then((d) => d.keys ?? []);
}

export function createApiKey(companyId: string, name: string, scopes?: string[]) {
  return apiFetch<{ keyId: string; key: string; name: string }>("/api/company/api-keys", {
    method: "POST",
    body: { companyId, name, scopes },
  });
}

export function deleteApiKey(companyId: string, keyId: string) {
  return apiFetch<{ keyId: string; deleted: boolean }>(`/api/company/api-keys/${keyId}`, {
    method: "DELETE",
    query: { companyId },
  });
}
