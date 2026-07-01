import { apiFetch } from "./client";
import type {
  CreateChatSessionBody,
  RateChatMessageBody,
  SendChatMessageBody,
} from "./types";

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
