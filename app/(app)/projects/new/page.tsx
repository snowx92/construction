"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Zap, ArrowRight, ArrowLeft, AlertCircle, Loader2 } from "lucide-react";
import { useT, useLocale } from "@/lib/i18n";
import { useProjects } from "@/lib/use-projects";
import { ApiError } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import type { ContractType, TenderType } from "@/lib/api/types";

const TENDER_TYPES: TenderType[]    = ["open", "limited", "single_source", "framework", "emergency"];
const CONTRACT_TYPES: ContractType[] = ["lump_sum", "admeasurement", "cost_plus", "turnkey", "framework"];

const DISCIPLINE_OPTIONS = [
  "civil", "mechanical", "electrical", "plumbing",
  "fire_protection", "hvac", "finishing", "infrastructure",
];

export default function NewProjectPage() {
  const t = useT();
  const { dir } = useLocale();
  const router = useRouter();
  const { create } = useProjects();

  const [name, setName] = useState("");
  const [client, setClient] = useState("");
  const [location, setLocation] = useState("");
  const [tenderType, setTenderType] = useState<TenderType | "">("");
  const [contractType, setContractType] = useState<ContractType | "">("");
  const [disciplines, setDisciplines] = useState<Set<string>>(new Set());
  const [deadline, setDeadline] = useState("");
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);

  const Arrow = dir === "rtl" ? ArrowLeft : ArrowRight;

  function toggleDiscipline(d: string) {
    setDisciplines((prev) => {
      const next = new Set(prev);
      if (next.has(d)) next.delete(d); else next.add(d);
      return next;
    });
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setError("");
    setCreating(true);
    try {
      const res = await create({
        name: name.trim(),
        client: client.trim() || undefined,
        location: location.trim() || undefined,
        tenderType: tenderType || undefined,
        contractType: contractType || undefined,
        disciplines: disciplines.size > 0 ? Array.from(disciplines) : undefined,
        submissionDeadline: deadline ? new Date(deadline).toISOString() : undefined,
      });
      router.push(`/projects/${res.projectId}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create project");
      setCreating(false);
    }
  }

  return (
    <div className="mx-auto max-w-[680px] px-8 py-12">
      <div className="mb-10">
        <p className="text-xs font-medium uppercase tracking-widest text-foreground-subtle mb-1">
          {t("newProject.eyebrow")}
        </p>
        <h1 className="text-3xl font-semibold text-foreground">{t("newProject.title")}</h1>
        <p className="mt-1 text-sm text-foreground-muted">{t("newProject.subtitle")}</p>
      </div>

      <form onSubmit={handleCreate} className="space-y-5">
        {/* Project name */}
        <div>
          <label className="block text-xs font-medium mb-1.5 text-foreground-muted">
            {t("newProject.projectName")} <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            required
            minLength={2}
            placeholder={t("newProject.projectNamePh")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input text-base"
          />
          <p className="mt-1.5 text-xs text-foreground-subtle">{t("newProject.projectNameHint")}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium mb-1.5 text-foreground-muted">
              {t("newProject.client")}
            </label>
            <input
              type="text"
              placeholder={t("newProject.clientPh")}
              value={client}
              onChange={(e) => setClient(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5 text-foreground-muted">
              {t("projects.fieldLocation")}
            </label>
            <input
              type="text"
              placeholder="Muscat, Oman"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="input"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium mb-1.5 text-foreground-muted">
              {t("projects.fieldTenderType")}
            </label>
            <select
              value={tenderType}
              onChange={(e) => setTenderType(e.target.value as TenderType | "")}
              className="input bg-transparent"
            >
              <option value="">—</option>
              {TENDER_TYPES.map((tt) => (
                <option key={tt} value={tt}>{t(`projects.tender_${tt}`)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5 text-foreground-muted">
              {t("projects.fieldContractType")}
            </label>
            <select
              value={contractType}
              onChange={(e) => setContractType(e.target.value as ContractType | "")}
              className="input bg-transparent"
            >
              <option value="">—</option>
              {CONTRACT_TYPES.map((ct) => (
                <option key={ct} value={ct}>{t(`projects.contract_${ct}`)}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium mb-1.5 text-foreground-muted">
            {t("projects.fieldDisciplines")}
          </label>
          <div className="flex flex-wrap gap-2">
            {DISCIPLINE_OPTIONS.map((d) => {
              const active = disciplines.has(d);
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggleDiscipline(d)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs transition capitalize",
                    active
                      ? "border-primary bg-primary-soft text-primary"
                      : "border-black/[0.08] bg-white text-foreground-muted hover:border-primary"
                  )}
                >
                  {d.replace("_", " ")}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium mb-1.5 text-foreground-muted">
            {t("projects.fieldDeadline")}
          </label>
          <input
            type="datetime-local"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="input"
          />
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={!name.trim() || creating}
          className="btn-primary w-full justify-center py-3 text-base disabled:opacity-40"
        >
          {creating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("newProject.creating")}
            </>
          ) : (
            <>
              <Zap className="h-4 w-4" strokeWidth={1.5} />
              {t("newProject.create")}
              <Arrow className="h-4 w-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
