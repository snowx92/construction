"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "./firebase";
import { useAuth } from "./auth-context";
import type { DocumentRecord } from "./api/types";

/**
 * Subscribes to /companies/{companyId}/projects/{projectId}/documents in real time.
 * Returns the list with live status updates (no polling needed).
 */
export function useDocuments(projectId: string | null | undefined) {
  const { profile } = useAuth();
  const companyId = profile?.activeCompanyId;
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!companyId || !projectId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    const ref = collection(db, "companies", companyId, "projects", projectId, "documents");
    let q;
    try {
      q = query(ref, orderBy("createdAt", "desc"));
    } catch {
      q = ref;
    }

    const unsub = onSnapshot(
      q,
      (snap) => {
        const docs: DocumentRecord[] = snap.docs.map((d) => ({
          documentId: d.id,
          companyId,
          projectId,
          ...(d.data() as Omit<DocumentRecord, "documentId" | "companyId" | "projectId">),
        }));
        setDocuments(docs);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return unsub;
  }, [companyId, projectId]);

  return { documents, loading, error };
}
