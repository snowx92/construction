"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "./auth-context";
import {
  archiveProject as apiArchive,
  changeProjectStatus as apiChangeStatus,
  createProject as apiCreate,
  listProjects,
  restoreProject as apiRestore,
  updateProject as apiUpdate,
} from "./api/projects";
import type {
  ChangeStatusBody,
  CreateProjectBody,
  Project,
  UpdateProjectBody,
} from "./api/types";

/**
 * Module-level cache so multiple components (sidebar, list page) share data
 * without each triggering its own request.
 */
let cache: { companyId: string; projects: Project[] } | null = null;
const listeners = new Set<() => void>();

function notify() {
  for (const l of listeners) l();
}

export function useProjects() {
  const { profile } = useAuth();
  const companyId = profile?.activeCompanyId ?? null;

  const [, setTick] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const l = () => setTick((t) => t + 1);
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);

  const projects = cache && cache.companyId === companyId ? cache.projects : [];

  const reload = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await listProjects(companyId);
      cache = { companyId, projects: data };
      notify();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load projects");
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    if (companyId && (!cache || cache.companyId !== companyId)) reload();
  }, [companyId, reload]);

  const create = useCallback(async (body: Omit<CreateProjectBody, "companyId">) => {
    if (!companyId) throw new Error("No active company");
    const res = await apiCreate({ ...body, companyId });
    await reload();
    return res;
  }, [companyId, reload]);

  const update = useCallback(async (projectId: string, body: Omit<UpdateProjectBody, "companyId">) => {
    if (!companyId) throw new Error("No active company");
    const res = await apiUpdate(projectId, { ...body, companyId });
    await reload();
    return res;
  }, [companyId, reload]);

  const setStatus = useCallback(async (projectId: string, body: Omit<ChangeStatusBody, "companyId">) => {
    if (!companyId) throw new Error("No active company");
    const res = await apiChangeStatus(projectId, { ...body, companyId });
    await reload();
    return res;
  }, [companyId, reload]);

  const archive = useCallback(async (projectId: string) => {
    if (!companyId) throw new Error("No active company");
    const res = await apiArchive(projectId, companyId);
    await reload();
    return res;
  }, [companyId, reload]);

  const restore = useCallback(async (projectId: string) => {
    if (!companyId) throw new Error("No active company");
    const res = await apiRestore(projectId, companyId);
    await reload();
    return res;
  }, [companyId, reload]);

  return { projects, loading, error, reload, create, update, setStatus, archive, restore };
}
