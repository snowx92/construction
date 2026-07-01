"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { db } from "./firebase";
import { useAuth } from "./auth-context";
import type { ChatMessage, ChatSession } from "./api/types";

/**
 * Real-time chat sessions for a project.
 * Reads from `companies/{cid}/chatSessions` filtered by projectId.
 */
export function useChatSessions(projectId: string | null | undefined) {
  const { profile } = useAuth();
  const companyId = profile?.activeCompanyId;
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!companyId || !projectId) { setLoading(false); return; }
    setLoading(true);
    const ref = collection(db, "companies", companyId, "chatSessions");
    let q;
    try {
      q = query(ref, where("projectId", "==", projectId), orderBy("createdAt", "desc"));
    } catch {
      q = ref;
    }
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: ChatSession[] = snap.docs.map((d) => ({
          sessionId: d.id,
          companyId,
          projectId,
          ...(d.data() as Omit<ChatSession, "sessionId" | "companyId" | "projectId">),
        }));
        setSessions(list);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return unsub;
  }, [companyId, projectId]);

  return { sessions, loading };
}

/**
 * Real-time messages for a chat session.
 * Reads from `companies/{cid}/chatMessages` filtered by sessionId, oldest first.
 */
export function useChatMessages(sessionId: string | null | undefined) {
  const { profile } = useAuth();
  const companyId = profile?.activeCompanyId;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!companyId || !sessionId) { setLoading(false); setMessages([]); return; }
    setLoading(true);
    const ref = collection(db, "companies", companyId, "chatMessages");
    let q;
    try {
      q = query(ref, where("sessionId", "==", sessionId), orderBy("createdAt", "asc"));
    } catch {
      q = ref;
    }
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: ChatMessage[] = snap.docs.map((d) => ({
          messageId: d.id,
          sessionId,
          ...(d.data() as Omit<ChatMessage, "messageId" | "sessionId">),
        }));
        setMessages(list);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return unsub;
  }, [companyId, sessionId]);

  return { messages, loading };
}
