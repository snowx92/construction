"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, AlertCircle, RefreshCw, Save } from "lucide-react";
import { useT } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import { showToast } from "@/lib/toast";
import { ApiError } from "@/lib/api/client";
import { extractBoq, listBoqItems, updateBoqItem, type BoqItem } from "@/lib/api/projects";

interface Props {
  projectId: string;
}

export function BoqTab({ projectId }: Props) {
  const t = useT();
  const { profile } = useAuth();
  const companyId = profile?.activeCompanyId;
  const [items, setItems] = useState<BoqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, Partial<BoqItem>>>({});

  const load = useCallback(async () => {
    if (!companyId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const list = await listBoqItems(projectId, companyId);
      setItems(list);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }, [companyId, projectId]);

  useEffect(() => { load(); }, [load]);

  async function handleExtract() {
    if (!companyId) return;
    setExtracting(true);
    try {
      await extractBoq(projectId, companyId);
      showToast(t("boqTab.extractQueued"), "success");
      setTimeout(load, 3000);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Failed", "error");
    } finally {
      setExtracting(false);
    }
  }

  function draft(id: string, field: keyof BoqItem, value: string | number) {
    setDrafts((d) => ({ ...d, [id]: { ...d[id], [field]: value } }));
  }

  function rowValue(item: BoqItem, field: keyof BoqItem) {
    const id = item.boqItemId || item.id || "";
    const d = drafts[id];
    if (d && field in d) return d[field as keyof typeof d];
    return item[field];
  }

  async function saveRow(item: BoqItem) {
    if (!companyId) return;
    const id = item.boqItemId || item.id || "";
    const d = drafts[id];
    if (!d) return;
    setSavingId(id);
    try {
      await updateBoqItem(projectId, id, {
        companyId,
        description: d.description as string | undefined,
        quantity: d.quantity != null ? Number(d.quantity) : undefined,
        unit: d.unit as string | undefined,
      });
      showToast(t("boqTab.saved"), "success");
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      load();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Failed", "error");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">{t("boqTab.title")}</h2>
          <p className="text-xs text-foreground-subtle">{t("boqTab.subtitle")}</p>
        </div>
        <button
          onClick={handleExtract}
          disabled={extracting || !companyId}
          className="inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] border border-black/[0.08] bg-white px-3 py-2 text-xs font-medium hover:bg-black/[0.03] disabled:opacity-50"
        >
          {extracting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          {t("boqTab.extract")}
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4" /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex h-32 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-foreground-subtle" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <p className="text-sm text-foreground-subtle">{t("boqTab.empty")}</p>
          <button
            type="button"
            onClick={handleExtract}
            disabled={extracting || !companyId}
            className="inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] bg-primary px-4 py-2 text-xs font-medium text-white hover:bg-primary-hover disabled:opacity-50"
          >
            {extracting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            {t("boqTab.extract")}
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-black/[0.06]">
          <table className="w-full text-left text-xs">
            <thead className="bg-black/[0.02] text-[10px] uppercase text-foreground-subtle">
              <tr>
                <th className="px-3 py-2">#</th>
                <th className="px-3 py-2">{t("boqTab.description")}</th>
                <th className="px-3 py-2">{t("boqTab.unit")}</th>
                <th className="px-3 py-2">{t("boqTab.qty")}</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04]">
              {items.map((item) => {
                const id = item.boqItemId || item.id || "";
                const hasDraft = Boolean(drafts[id]);
                return (
                  <tr key={id}>
                    <td className="px-3 py-2 text-foreground-subtle">{item.itemNumber || "—"}</td>
                    <td className="px-3 py-2">
                      <input
                        className="w-full min-w-[200px] rounded border border-black/[0.08] px-2 py-1"
                        value={String(rowValue(item, "description") ?? "")}
                        onChange={(e) => draft(id, "description", e.target.value)}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        className="w-16 rounded border border-black/[0.08] px-2 py-1"
                        value={String(rowValue(item, "unit") ?? "")}
                        onChange={(e) => draft(id, "unit", e.target.value)}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        className="w-20 rounded border border-black/[0.08] px-2 py-1"
                        value={String(rowValue(item, "quantity") ?? "")}
                        onChange={(e) => draft(id, "quantity", Number(e.target.value))}
                      />
                    </td>
                    <td className="px-3 py-2">
                      {hasDraft && (
                        <button
                          onClick={() => saveRow(item)}
                          disabled={savingId === id}
                          className="inline-flex items-center gap-1 rounded-md bg-primary px-2 py-1 text-[10px] font-medium text-white disabled:opacity-50"
                        >
                          {savingId === id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                          {t("common.save")}
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
    </div>
  );
}
