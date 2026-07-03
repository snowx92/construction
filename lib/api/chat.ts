import { apiFetch } from "./client";
import { normalizeChatStatus } from "../normalize-status";
import { copilotMessageText } from "../copilot-content";
import type {
  ChatMessage,
  ChatSession,
  CreateChatSessionBody,
  RateChatMessageBody,
  SendChatMessageBody,
} from "./types";

function normalizeApiMessage(m: ChatMessage & { id?: string; body?: string }): ChatMessage {
  const role = m.role;
  const rawContent = m.content ?? m.body;
  return {
    ...m,
    messageId: m.messageId ?? m.id ?? "",
    content: role === "assistant" ? copilotMessageText(rawContent) : rawContent,
    status: normalizeChatStatus(m.status) ?? m.status,
  };
}

export function createChatSession(body: CreateChatSessionBody) {
  return apiFetch<{ sessionId: string; title: string }>("/api/chat/sessions", {
    method: "POST",
    body,
  });
}

export function sendChatMessage(body: SendChatMessageBody) {
  return apiFetch<{ messageId: string; jobId?: string; status: string }>(
    "/api/chat/messages",
    { method: "POST", body }
  );
}

export function rateChatMessage(messageId: string, body: RateChatMessageBody) {
  return apiFetch<{ messageId: string; rated: boolean }>(
    `/api/chat/messages/${messageId}/rate`,
    { method: "POST", body }
  );
}

export function listChatSessions(companyId: string, projectId: string, limit = 50) {
  return apiFetch<{ sessions: (ChatSession & { id?: string })[] }>("/api/chat/sessions", {
    query: { companyId, projectId, limit },
  }).then((d) =>
    (d.sessions ?? []).map((s) => ({
      ...s,
      sessionId: s.sessionId ?? s.id ?? "",
      companyId,
      projectId,
    }))
  );
}

export function listChatMessages(companyId: string, projectId: string, sessionId: string, limit = 50) {
  return apiFetch<{ messages: (ChatMessage & { id?: string; body?: string })[] }>(
    "/api/chat/messages",
    { query: { companyId, projectId, sessionId, limit } }
  ).then((d) => (d.messages ?? []).map((m) => normalizeApiMessage({ ...m, sessionId })));
}
