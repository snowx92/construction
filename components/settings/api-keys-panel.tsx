"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus, Trash2, Copy } from "lucide-react";
import { useT } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import { useIsAdmin } from "@/lib/use-role";
import { showToast } from "@/lib/toast";
import { ApiError } from "@/lib/api/client";
import { createApiKey, deleteApiKey, listApiKeys, type ApiKeyRecord } from "@/lib/api/api-keys";

export function ApiKeysPanel() {
  const t = useT();
  const { profile } = useAuth();
  const companyId = profile?.activeCompanyId;
  const isAdmin = useIsAdmin();
  const [keys, setKeys] = useState<ApiKeyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      setKeys(await listApiKeys(companyId));
    } catch {
      setKeys([]);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => { load(); }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!companyId || !name.trim()) return;
    setCreating(true);
    try {
      const res = await createApiKey(companyId, name.trim());
      setNewKey(res.key);
      setName("");
      load();
      showToast(t("settings.apiKeyCreated"), "success");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Failed", "error");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(keyId: string) {
    if (!companyId || !confirm(t("settings.apiKeyDeleteConfirm"))) return;
    try {
      await deleteApiKey(companyId, keyId);
      load();
      showToast(t("settings.apiKeyDeleted"), "success");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Failed", "error");
    }
  }

  if (!isAdmin) {
    return <p className="text-sm text-foreground-subtle">{t("settings.apiKeysAdminOnly")}</p>;
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleCreate} className="flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("settings.apiKeyNamePh")}
          className="input flex-1"
        />
        <button
          type="submit"
          disabled={creating}
          className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          {t("settings.apiKeyCreate")}
        </button>
      </form>

      {newKey && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
          <p className="font-medium text-amber-800 mb-1">{t("settings.apiKeyCopyOnce")}</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 truncate text-xs">{newKey}</code>
            <button
              type="button"
              onClick={() => { navigator.clipboard.writeText(newKey); showToast(t("settings.copied"), "success"); }}
              className="rounded p-1 hover:bg-amber-100"
            >
              <Copy className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin text-foreground-subtle" />
      ) : keys.length === 0 ? (
        <p className="text-sm text-foreground-subtle">{t("settings.apiKeysEmpty")}</p>
      ) : (
        <ul className="divide-y divide-black/[0.06] rounded-xl border border-black/[0.06]">
          {keys.map((k) => (
            <li key={k.keyId} className="flex items-center justify-between px-4 py-3 text-sm">
              <div>
                <p className="font-medium">{k.name || k.keyId}</p>
                <p className="text-xs text-foreground-subtle">{k.prefix}••••</p>
              </div>
              <button
                onClick={() => handleDelete(k.keyId)}
                className="rounded-md p-1.5 text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
