"use client";

import { useEffect, useRef, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "./firebase";
import { useAuth } from "./auth-context";
import { listChatMessages } from "./api/chat";
import type { ChatMessage, ChatMessageStatus, ChatSession } from "./api/types";
import { normalizeChatStatus } from "./normalize-status";
import { copilotMessageText } from "./copilot-content";

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

function normalizeChatMessage(
  data: Record<string, unknown>,
  messageId: string,
  sessionId: string,
): ChatMessage {
  const rating = data.feedback as { rating?: string } | undefined;
  const role = data.role as ChatMessage["role"];
  const rawContent = (data.content ?? data.body) as string | undefined;
  return {
    messageId,
    sessionId,
    projectId: data.projectId as string | undefined,
    role,
    content: role === "assistant" ? copilotMessageText(rawContent) : rawContent,
    status: normalizeChatStatus(data.status as string | undefined),
    rating: (rating?.rating ?? data.rating) as ChatMessage["rating"],
    ratingComment: (data.ratingComment as string | null) ?? null,
    citations: data.citations as ChatMessage["citations"],
    jobId: (data.jobId as string | null) ?? null,
    error: data.error as ChatMessage["error"],
    createdAt: data.createdAt as ChatMessage["createdAt"],
    updatedAt: data.updatedAt as ChatMessage["updatedAt"],
  };
}

/**
 * Real-time chat sessions for a project.
 * Reads from `companies/{cid}/projects/{pid}/chatSessions`.
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

    const ref = collection(db, "companies", companyId, "projects", projectId, "chatSessions");

    const unsub = onSnapshot(
      ref,
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
 * Primary: `companies/{cid}/projects/{pid}/chatMessages` filtered by sessionId.
 * Fallback: GET /api/chat/messages when Firestore is empty.
 */
export function useChatMessages(
  projectId: string | null | undefined,
  sessionId: string | null | undefined,
) {
  const { profile } = useAuth();
  const companyId = profile?.activeCompanyId;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const apiFetched = useRef(false);

  useEffect(() => {
    apiFetched.current = false;
    if (!companyId || !projectId || !sessionId) {
      setLoading(false);
      setMessages([]);
      return;
    }
    setLoading(true);
    setError(null);

    const ref = collection(db, "companies", companyId, "projects", projectId, "chatMessages");
    const q = query(ref, where("sessionId", "==", sessionId));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) =>
          normalizeChatMessage(d.data() as Record<string, unknown>, d.id, sessionId)
        );
        list.sort((a, b) => toMillis(a.createdAt) - toMillis(b.createdAt));
        setMessages(list);
        setLoading(false);

        if (list.length === 0 && !apiFetched.current) {
          apiFetched.current = true;
          listChatMessages(companyId, projectId, sessionId)
            .then((apiMsgs) => {
              if (apiMsgs.length > 0) setMessages(apiMsgs);
            })
            .catch((e) => console.warn("[chat-messages api fallback]", e));
        }
      },
      (err) => {
        console.error("[chat-messages]", err);
        setError(err.message);
        setLoading(false);
        if (!apiFetched.current) {
          apiFetched.current = true;
          listChatMessages(companyId, projectId, sessionId)
            .then(setMessages)
            .catch((e) => setError(e instanceof Error ? e.message : "Failed to load messages"));
        }
      }
    );

    return unsub;
  }, [companyId, projectId, sessionId]);

  return { messages, loading, error };
}
