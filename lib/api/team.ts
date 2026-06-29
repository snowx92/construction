import { apiFetch } from "./client";
import type {
  AcceptInviteBody,
  ChangeRoleBody,
  CompanyMember,
  DeactivateUserBody,
  InviteUserBody,
  InviteUserResponse,
} from "./types";

export function listMembers(companyId: string) {
  return apiFetch<CompanyMember[] | { members: CompanyMember[] }>("/api/admin/users", {
    query: { companyId },
  }).then((data) => (Array.isArray(data) ? data : data.members ?? []));
}

export function inviteUser(body: InviteUserBody) {
  return apiFetch<InviteUserResponse>("/api/admin/users/invite", { method: "POST", body });
}

export function changeRole(body: ChangeRoleBody) {
  return apiFetch<{ userId: string; role: string }>("/api/admin/users/role", { method: "PUT", body });
}

export function deactivateUser(userId: string, body: DeactivateUserBody) {
  return apiFetch<{ userId: string; deactivated: boolean }>(`/api/admin/users/${userId}`, {
    method: "DELETE",
    body,
  });
}

export function acceptInvite(body: AcceptInviteBody) {
  return apiFetch<{ companyId: string; joined: boolean }>("/api/users/invites/accept", {
    method: "POST",
    body,
  });
}
