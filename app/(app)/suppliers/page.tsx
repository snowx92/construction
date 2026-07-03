"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Loader2, Plus, X, AlertCircle, Building2, Mail, Phone, MapPin, Globe, Pencil, Trash2,
} from "lucide-react";
import { useT } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import { showToast } from "@/lib/toast";
import { ApiError } from "@/lib/api/client";
import { createSupplier, deleteSupplier, listSuppliers, updateSupplier } from "@/lib/api/suppliers";
import { timeAgoFromIso } from "@/lib/project-status";
import type { Supplier } from "@/lib/api/types";

export default function SuppliersPage() {
  const t = useT();
  const { profile } = useAuth();
  const companyId = profile?.activeCompanyId;
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    setError("");
    try {
      const data = await listSuppliers(companyId);
      setSuppliers(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => { reload(); }, [reload]);

  async function handleDelete(s: Supplier) {
    if (!companyId) return;
    if (!confirm(t("suppliersPage.deleteConfirm"))) return;
    setDeletingId(s.supplierId);
    try {
      await deleteSupplier(s.supplierId, companyId);
      showToast(t("suppliersPage.deleted"), "success");
      reload();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Failed", "error");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="mx-auto max-w-[1100px] px-8 py-10">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-foreground-subtle mb-1">
            {t("suppliersPage.eyebrow")}
          </p>
          <h1 className="text-3xl font-semibold text-foreground">{t("suppliersPage.title")}</h1>
          <p className="mt-1 text-sm text-foreground-muted">{t("suppliersPage.subtitle")}</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] bg-primary px-4 py-2 text-xs font-medium text-white hover:bg-primary-hover"
        >
          <Plus className="h-3.5 w-3.5" /> {t("suppliersPage.newSupplier")}
        </button>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-foreground-subtle" />
        </div>
      ) : error ? (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4" />
          <span>{t("suppliersPage.loadFailed")}: {error}</span>
        </div>
      ) : suppliers.length === 0 ? (
        <div className="rounded-[24px] p-10 text-center bg-surface border border-dashed border-black/[0.06]">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-[16px] bg-primary-soft">
            <Building2 className="h-5 w-5 text-primary" strokeWidth={1.5} />
          </div>
          <p className="text-sm font-semibold mb-1 text-foreground">{t("suppliersPage.empty")}</p>
          <button onClick={() => setShowAdd(true)} className="mt-4 btn-primary mx-auto w-fit">
            <Plus className="h-4 w-4" /> {t("suppliersPage.newSupplier")}
          </button>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {suppliers.map((s) => (
            <div key={s.supplierId} className="card p-5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{s.name}</p>
                  {s.category && <p className="text-xs text-foreground-subtle">{s.category}</p>}
                </div>
                {s.status && (
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    s.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-foreground-subtle/10 text-foreground-subtle"
                  }`}>
                    {s.status}
                  </span>
                )}
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => setEditing(s)}
                    className="rounded-md p-1.5 text-foreground-subtle hover:bg-black/[0.04]"
                    title={t("suppliersPage.edit")}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(s)}
                    disabled={deletingId === s.supplierId}
                    className="rounded-md p-1.5 text-foreground-subtle hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                    title={t("suppliersPage.delete")}
                  >
                    {deletingId === s.supplierId
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <Trash2 className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5 text-xs text-foreground-muted">
                {s.contactName && <p>{s.contactName}</p>}
                {s.email && <p className="flex items-center gap-1.5"><Mail className="h-3 w-3" /> {s.email}</p>}
                {s.phone && <p className="flex items-center gap-1.5"><Phone className="h-3 w-3" /> {s.phone}</p>}
                {(s.city || s.country) && (
                  <p className="flex items-center gap-1.5">
                    <MapPin className="h-3 w-3" /> {[s.city, s.country].filter(Boolean).join(", ")}
                  </p>
                )}
                {s.website && (
                  <p className="flex items-center gap-1.5">
                    <Globe className="h-3 w-3" />
                    <a href={s.website} target="_blank" rel="noopener noreferrer" className="text-primary truncate hover:underline">
                      {s.website}
                    </a>
                  </p>
                )}
              </div>
              {s.createdAt && (
                <p className="mt-3 pt-3 border-t border-black/[0.05] text-[10px] text-foreground-subtle">
                  {timeAgoFromIso(s.createdAt)}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {showAdd && companyId && (
        <SupplierFormModal
          companyId={companyId}
          onClose={() => setShowAdd(false)}
          onSaved={() => { setShowAdd(false); reload(); }}
        />
      )}
      {editing && companyId && (
        <SupplierFormModal
          companyId={companyId}
          supplier={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); reload(); }}
        />
      )}
    </div>
  );
}

function SupplierFormModal({
  companyId, supplier, onClose, onSaved,
}: {
  companyId: string;
  supplier?: Supplier;
  onClose: () => void;
  onSaved: () => void;
}) {
  const t = useT();
  const isEdit = Boolean(supplier);
  const [form, setForm] = useState({
    name: supplier?.name ?? "",
    category: supplier?.category ?? "",
    contactName: supplier?.contactName ?? "",
    email: supplier?.email ?? "",
    phone: supplier?.phone ?? "",
    country: supplier?.country ?? "",
    city: supplier?.city ?? "",
    website: supplier?.website ?? "",
    notes: supplier?.notes ?? "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const payload = {
        companyId,
        name: form.name.trim(),
        category: form.category.trim() || undefined,
        contactName: form.contactName.trim() || undefined,
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        country: form.country.trim() || undefined,
        city: form.city.trim() || undefined,
        website: form.website.trim() || undefined,
        notes: form.notes.trim() || undefined,
      };
      if (isEdit && supplier) {
        await updateSupplier(supplier.supplierId, payload);
      } else {
        await createSupplier(payload);
      }
      showToast(t("suppliersPage.save"), "success");
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed");
    } finally {
      setSubmitting(false);
    }
  }

  function up<K extends keyof typeof form>(k: K, v: string) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg rounded-2xl bg-card p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="mb-4 flex items-start justify-between">
          <h3 className="text-base font-semibold text-foreground">
            {isEdit ? t("suppliersPage.editTitle") : t("suppliersPage.modalTitle")}
          </h3>
          <button onClick={onClose} className="rounded-md p-1 text-foreground-subtle hover:bg-black/[0.05]">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <Field label={t("suppliersPage.name")} required>
            <input
              required
              minLength={2}
              value={form.name}
              onChange={(e) => up("name", e.target.value)}
              placeholder={t("suppliersPage.namePh")}
              className="input"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("suppliersPage.category")}>
              <input value={form.category} onChange={(e) => up("category", e.target.value)} placeholder={t("suppliersPage.categoryPh")} className="input" />
            </Field>
            <Field label={t("suppliersPage.contactName")}>
              <input value={form.contactName} onChange={(e) => up("contactName", e.target.value)} className="input" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("suppliersPage.email")}>
              <input type="email" value={form.email} onChange={(e) => up("email", e.target.value)} className="input" />
            </Field>
            <Field label={t("suppliersPage.phone")}>
              <input type="tel" value={form.phone} onChange={(e) => up("phone", e.target.value)} className="input" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("suppliersPage.country")}>
              <input value={form.country} onChange={(e) => up("country", e.target.value)} className="input" />
            </Field>
            <Field label={t("suppliersPage.city")}>
              <input value={form.city} onChange={(e) => up("city", e.target.value)} className="input" />
            </Field>
          </div>
          <Field label={t("suppliersPage.website")}>
            <input type="url" value={form.website} onChange={(e) => up("website", e.target.value)} className="input" />
          </Field>
          <Field label={t("suppliersPage.notes")}>
            <textarea value={form.notes} onChange={(e) => up("notes", e.target.value)} rows={2} className="input" />
          </Field>

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4" /> <span>{error}</span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-black/[0.08] bg-white px-3 py-2 text-sm hover:bg-black/[0.03]">
              {t("suppliersPage.cancel")}
            </button>
            <button type="submit" disabled={submitting} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50">
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {t("suppliersPage.save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-foreground-muted">
        {label} {required && <span className="text-red-600">*</span>}
      </label>
      {children}
    </div>
  );
}
