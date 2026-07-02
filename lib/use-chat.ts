"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "./firebase";
import { useAuth } from "./auth-context";
import type { ChatMessage, ChatSession } from "./api/types";

/**
 * Firestore timestamp normalisation. Docs may carry either a Firebase
 * Timestamp object, a `{_seconds, _nanoseconds}` shape, or an ISO string.
 */
function toMillis(value: unknown): number {
  if (!value) return 0;
  if (typeof value === "string") return new Date(value).getTime() || 0;
  const v = value as { seconds?: number; _seconds?: number; nanoseconds?: number; _nanoseconds?: number; toMillis?: () => number };
  if (typeof v.toMillis === "function") return v.toMillis();
  const secs = v.seconds ?? v._seconds;
  const ns   = v.nanoseconds ?? v._nanoseconds ?? 0;
  return secs != null ? secs * 1000 + Math.floor(ns / 1e6) : 0;
}

/**
 * Real-time chat sessions for a project.
 * Reads from `companies/{cid}/chatSessions` filtered by projectId.
 *
 * We omit orderBy from the Firestore query so no composite index is required;
 * sort is done client-side.
 */
export function useChatSessions(projectId: string | null | undefined) {
  const { profile } = useAuth();
  const companyId = profile?.activeCompanyId;
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!companyId || !projectId) { setLoading(false); return; }
    setLoading(true);
    setError(null);

    const ref = collection(db, "companies", companyId, "chatSessions");
    const q = query(ref, where("projectId", "==", projectId));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: ChatSession[] = snap.docs.map((d) => ({
          sessionId: d.id,
          companyId,
          projectId,
          ...(d.data() as Omit<ChatSession, "sessionId" | "companyId" | "projectId">),
        }));
        list.sort((a, b) => toMillis(b.lastMessageAt || b.updatedAt || b.createdAt) - toMillis(a.lastMessageAt || a.updatedAt || a.createdAt));
        setSessions(list);
        setLoading(false);
      },
      (err) => {
        console.error("[chat-sessions]", err);
        setError(err.message);
        setLoading(false);
      }
    );
    return unsub;
  }, [companyId, projectId]);

  return { sessions, loading, error };
}

/**
 * Real-time messages for a chat session.
 *
 * The backend can store messages at either:
 *   (A) companies/{cid}/chatSessions/{sid}/messages           (nested)
 *   (B) companies/{cid}/chatMessages   with sessionId field   (flat)
 *
 * We subscribe to BOTH and merge — whichever the backend actually writes to
 * shows up. Sort is done client-side to avoid composite-index requirements.
 */
export function useChatMessages(sessionId: string | null | undefined) {
  const { profile } = useAuth();
  const companyId = profile?.activeCompanyId;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!companyId || !sessionId) { setLoading(false); setMessages([]); return; }
    setLoading(true);
    setError(null);

    let nested: ChatMessage[] = [];
    let flat: ChatMessage[]   = [];

    const emit = () => {
      const byId = new Map<string, ChatMessage>();
      for (const m of [...nested, ...flat]) byId.set(m.messageId, m);
      const list = [...byId.values()];
      list.sort((a, b) => toMillis(a.createdAt) - toMillis(b.createdAt));
      setMessages(list);
      setLoading(false);
    };

    // (A) Nested subcollection: companies/{cid}/chatSessions/{sid}/messages
    // Some backends don't use this path — permission-denied here is expected
    // and we drop the listener silently so it doesn't retry/log-spam.
    const nestedRef = collection(db, "companies", companyId, "chatSessions", sessionId, "messages");
    let nestedUnsub: (() => void) | null = null;
    nestedUnsub = onSnapshot(
      nestedRef,
      (snap) => {
        nested = snap.docs.map((d) => ({
          messageId: d.id,
          sessionId,
          ...(d.data() as Omit<ChatMessage, "messageId" | "sessionId">),
        }));
        emit();
      },
      (err) => {
        // permission-denied = path not used by this backend; unfailable-path = 400
        if ((err as { code?: string }).code !== "permission-denied") {
          console.warn("[chat-messages nested]", err.message);
        }
        if (nestedUnsub) { nestedUnsub(); nestedUnsub = null; }
      }
    );

    // (B) Flat collection with sessionId filter — no orderBy so no composite index
    const flatRef = collection(db, "companies", companyId, "chatMessages");
    const flatQ = query(flatRef, where("sessionId", "==", sessionId));
    const unsubFlat = onSnapshot(
      flatQ,
      (snap) => {
        flat = snap.docs.map((d) => ({
          messageId: d.id,
          sessionId,
          ...(d.data() as Omit<ChatMessage, "messageId" | "sessionId">),
        }));
        emit();
      },
      (err) => {
        console.error("[chat-messages flat]", err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => {
      if (nestedUnsub) nestedUnsub();
      unsubFlat();
    };
  }, [companyId, sessionId]);

  return { messages, loading, error };
}
