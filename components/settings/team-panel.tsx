"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus, X, AlertCircle, Trash2 } from "lucide-react";
import { useT } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import { showToast } from "@/lib/toast";
import { ApiError } from "@/lib/api/client";
import { changeRole, deactivateUser, inviteUser, listMembers } from "@/lib/api/team";
import { initials } from "@/lib/initials";
import type { CompanyMember, UserRole } from "@/lib/api/types";

const ROLES: UserRole[] = ["company_owner", "admin", "tender_manager", "estimator", "finance", "legal"];

export function TeamPanel() {
  const t = useT();
  const { profile } = useAuth();
  const companyId = profile?.activeCompanyId;

  const [members, setMembers] = useState<CompanyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [forbidden, setForbidden] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);

  const myRole = members.find((m) => m.userId === profile?.userId)?.role;
  const isAdmin = myRole === "company_owner" || myRole === "admin";

  const reload = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    setError("");
    setForbidden(false);
    try {
      const data = await listMembers(companyId);
      setMembers(data);
    } catch (err) {
      if (err instanceof ApiError && (err.status === 403 || err.code === "permission-denied")) {
        setForbidden(true);
      } else {
        setError(err instanceof ApiError ? err.message : "Failed to load members");
      }
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => { reload(); }, [reload]);

  async function handleRoleChange(userId: string, role: UserRole) {
    if (!companyId) return;
    try {
      await changeRole({ companyId, userId, role });
      showToast(t("team.roleUpdated"), "success");
      setMembers((prev) => prev.map((m) => (m.userId === userId ? { ...m, role } : m)));
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Failed", "error");
    }
  }

  async function handleRemove(m: CompanyMember) {
    if (!companyId) return;
    if (!confirm(t("team.confirmRemove", { name: m.displayName || m.email }))) return;
    try {
      await deactivateUser(m.userId, { companyId });
      showToast(t("team.removed"), "success");
      setMembers((prev) => prev.filter((x) => x.userId !== m.userId));
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Failed", "error");
    }
  }

  if (forbidden) {
    return (
      <div className="card p-6">
        <div className="flex items-center gap-2 text-sm text-foreground-muted">
          <AlertCircle className="h-4 w-4" />
          {t("team.onlyAdmin")}
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <div className="mb-5 flex items-start justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">{t("team.title")}</h2>
          <p className="mt-0.5 text-xs text-foreground-subtle">{t("team.subtitle")}</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setInviteOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] bg-primary px-4 py-2 text-xs font-medium text-white hover:bg-primary-hover"
          >
            <Plus className="h-3.5 w-3.5" />
            {t("team.invite")}
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex h-32 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-foreground-subtle" />
        </div>
      ) : error ? (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4" />
          <span>{error}</span>
        </div>
      ) : members.length === 0 ? (
        <p className="py-8 text-center text-sm text-foreground-subtle">{t("team.empty")}</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-black/[0.06]">
          <table className="w-full text-sm">
            <thead className="bg-surface-2 text-xs font-medium text-foreground-subtle">
              <tr>
                <th className="px-4 py-2.5 text-left">{t("team.member")}</th>
                <th className="px-4 py-2.5 text-left">{t("team.role")}</th>
                <th className="px-4 py-2.5 text-left">{t("team.status")}</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => {
                const isSelf = m.userId === profile?.userId;
                const displayName = m.displayName || (isSelf ? profile?.displayName : undefined);
                const email       = m.email       || (isSelf ? profile?.email       : undefined);
                const photoURL    = m.photoURL    || (isSelf ? profile?.photoURL    : undefined);
                return (
                  <tr key={m.userId} className="border-t border-black/[0.05]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {photoURL ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={photoURL} alt="" className="h-8 w-8 rounded-full object-cover" />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                            {initials(displayName, email)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">
                            {displayName || email || m.userId.slice(0, 8)}
                            {isSelf && <span className="ml-2 text-xs text-foreground-subtle">(you)</span>}
                          </p>
                          <p className="truncate text-xs text-foreground-subtle">{email || m.userId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {isAdmin ? (
                        <select
                          value={m.role}
                          onChange={(e) => handleRoleChange(m.userId, e.target.value as UserRole)}
                          disabled={isSelf || m.role === "company_owner"}
                          className="rounded-lg border border-black/[0.08] bg-white px-2 py-1 text-xs font-medium text-foreground disabled:opacity-60"
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>{t(`team.role_${r}`)}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-xs font-medium text-foreground">{t(`team.role_${m.role}`)}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        m.status === "invited" ? "bg-amber-50 text-amber-700"
                        : m.status === "deactivated" ? "bg-foreground-subtle/10 text-foreground-subtle"
                        : "bg-emerald-50 text-emerald-700"
                      }`}>
                        {t(`team.${m.status ?? "active"}`)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {isAdmin && !isSelf && m.role !== "company_owner" && (
                        <button
                          onClick={() => handleRemove(m)}
                          className="rounded-md p-1.5 text-foreground-subtle hover:bg-red-50 hover:text-red-600"
                          title={t("team.remove")}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {inviteOpen && companyId && (
        <InviteModal
          companyId={companyId}
          onClose={() => setInviteOpen(false)}
          onInvited={() => { setInviteOpen(false); reload(); }}
        />
      )}
    </div>
  );
}

function InviteModal({ companyId, onClose, onInvited }: { companyId: string; onClose: () => void; onInvited: () => void }) {
  const t = useT();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("estimator");
  const [jobTitle, setJobTitle] = useState("");
  const [department, setDepartment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await inviteUser({
        companyId,
        email: email.trim(),
        role,
        jobTitle: jobTitle.trim() || undefined,
        department: department.trim() || undefined,
      });
      showToast(t("team.inviteSent", { email }), "success");
      onInvited();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to invite");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="text-base font-semibold text-foreground">{t("team.inviteTitle")}</h3>
            <p className="mt-0.5 text-xs text-foreground-subtle">{t("team.inviteSubtitle")}</p>
          </div>
          <button onClick={onClose} className="rounded-md p-1 text-foreground-subtle hover:bg-black/[0.05]">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground-muted">{t("team.inviteEmail")}</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="teammate@company.om"
              className="w-full rounded-xl border border-black/[0.08] bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary-soft"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground-muted">{t("team.inviteRole")}</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full rounded-xl border border-black/[0.08] bg-white px-3 py-2 text-sm outline-none focus:border-primary"
            >
              {ROLES.filter((r) => r !== "company_owner").map((r) => (
                <option key={r} value={r}>{t(`team.role_${r}`)}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground-muted">{t("team.inviteJobTitle")}</label>
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className="w-full rounded-xl border border-black/[0.08] bg-white px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground-muted">{t("team.inviteDept")}</label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full rounded-xl border border-black/[0.08] bg-white px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-50"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("team.inviteSend")}
          </button>
        </form>
      </div>
    </div>
  );
}
