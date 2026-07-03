"use client";

import { useEffect, useRef, useState } from "react";
import {
  Loader2, Plus, Send, ThumbsUp, ThumbsDown, MessageSquare,
  AlertCircle, User as UserIcon, Sparkles, X,
} from "lucide-react";
import { useT, useLocale } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import { showToast } from "@/lib/toast";
import { ApiError } from "@/lib/api/client";
import { createChatSession, rateChatMessage, sendChatMessage } from "@/lib/api/chat";
import { useChatMessages, useChatSessions } from "@/lib/use-chat";
import { useJob } from "@/lib/use-job";
import { timeAgoFromIso } from "@/lib/project-status";
import { copilotMessageText } from "@/lib/copilot-content";
import { cn } from "@/lib/utils";
import type { ChatMessage, ChatRating } from "@/lib/api/types";

export function CopilotTab({ projectId }: { projectId: string }) {
  const t = useT();
  const { profile } = useAuth();
  const companyId = profile?.activeCompanyId;
  const { sessions, loading: sessionsLoading } = useChatSessions(projectId);

  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  // Auto-select most recent session
  useEffect(() => {
    if (!activeSessionId && sessions.length > 0) {
      setActiveSessionId(sessions[0].sessionId);
    }
  }, [sessions, activeSessionId]);

  async function handleNewSession() {
    if (!companyId) return;
    setCreating(true);
    try {
      const res = await createChatSession({
        companyId,
        projectId,
        title: t("copilotTab.newSessionTitle"),
      });
      setActiveSessionId(res.sessionId);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Failed", "error");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">{t("copilotTab.title")}</h2>
          <p className="mt-0.5 text-xs text-foreground-subtle">{t("copilotTab.subtitle")}</p>
        </div>
        <button
          onClick={handleNewSession}
          disabled={creating}
          className="inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] bg-primary px-4 py-2 text-xs font-medium text-white hover:bg-primary-hover disabled:opacity-50"
        >
          {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
          {t("copilotTab.newSession")}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-[calc(100vh-260px)] min-h-[480px]">
        {/* Sessions sidebar */}
        <aside className="md:col-span-1 rounded-xl border border-black/[0.06] bg-card overflow-y-auto">
          <p className="px-3 pt-3 text-[10px] font-medium uppercase tracking-widest text-foreground-subtle">
            {t("copilotTab.sessions")}
          </p>
          {sessionsLoading ? (
            <div className="flex h-24 items-center justify-center">
              <Loader2 className="h-4 w-4 animate-spin text-foreground-subtle" />
            </div>
          ) : sessions.length === 0 ? (
            <p className="p-3 text-xs text-foreground-subtle">{t("copilotTab.noSessions")}</p>
          ) : (
            <ul className="py-2">
              {sessions.map((s) => {
                const active = s.sessionId === activeSessionId;
                return (
                  <li key={s.sessionId}>
                    <button
                      onClick={() => setActiveSessionId(s.sessionId)}
                      className={cn(
                        "w-full px-3 py-2 text-left transition-colors",
                        active ? "bg-primary-soft" : "hover:bg-black/[0.025]"
                      )}
                    >
                      <p className={cn(
                        "truncate text-xs font-medium",
                        active ? "text-primary" : "text-foreground"
                      )}>
                        {s.title || s.sessionId.slice(0, 8)}
                      </p>
                      <p className="text-[10px] text-foreground-subtle">
                        {timeAgoFromIso(s.lastMessageAt || s.updatedAt || s.createdAt)}
                      </p>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>

        {/* Chat panel */}
        <div className="md:col-span-3 rounded-xl border border-black/[0.06] bg-card flex flex-col overflow-hidden">
          {activeSessionId ? (
            <ChatPanel projectId={projectId} sessionId={activeSessionId} />
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
              <MessageSquare className="h-8 w-8 text-foreground-subtle" />
              <p className="text-sm text-foreground-subtle">{t("copilotTab.empty")}</p>
              <button
                onClick={handleNewSession}
                disabled={creating}
                className="inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] bg-primary px-4 py-2 text-xs font-medium text-white hover:bg-primary-hover disabled:opacity-50"
              >
                <Plus className="h-3.5 w-3.5" /> {t("copilotTab.newSession")}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface PendingMessage {
  clientId: string;
  content: string;
  createdAt: number;
  serverMessageId?: string;
}

function ChatPanel({ projectId, sessionId }: { projectId: string; sessionId: string }) {
  const t = useT();
  const { dir } = useLocale();
  const { profile } = useAuth();
  const companyId = profile?.activeCompanyId;
  const { messages, loading } = useChatMessages(projectId, sessionId);

  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [pending, setPending] = useState<PendingMessage[]>([]);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { job: activeJob } = useJob(activeJobId, projectId);

  // Drop pending entries once the Firestore mirror catches up
  useEffect(() => {
    if (pending.length === 0) return;
    setPending((prev) => prev.filter((p) => {
      // Prefer serverMessageId match if we have it, otherwise match by content+role
      if (p.serverMessageId && messages.some((m) => m.messageId === p.serverMessageId)) return false;
      if (messages.some((m) => m.role === "user" && m.content === p.content)) return false;
      return true;
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length]);

  // Merge pending + Firestore messages for display
  const displayMessages: Array<ChatMessage | (PendingMessage & { __pending: true })> = [
    ...messages,
    ...pending.map((p) => ({ ...p, __pending: true as const })),
  ];

  // Auto-scroll on new content
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [displayMessages.length, messages[messages.length - 1]?.content]);

  const lastReal = messages[messages.length - 1];
  const awaitingAi =
    pending.length > 0 ||
    (activeJobId && activeJob && !["completed", "failed", "cancelled"].includes(activeJob.status)) ||
    lastReal?.role === "user" ||
    (lastReal?.role === "assistant" && (lastReal.status === "pending" || lastReal.status === "running"));

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!companyId || !input.trim() || sending) return;
    const content = input.trim();
    setInput("");
    setSending(true);

    const clientId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setPending((prev) => [...prev, { clientId, content, createdAt: Date.now() }]);

    try {
      const res = await sendChatMessage({ companyId, projectId, sessionId, content });
      setPending((prev) => prev.map((p) =>
        p.clientId === clientId ? { ...p, serverMessageId: res.messageId } : p
      ));
      if (res.jobId) setActiveJobId(res.jobId);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Failed", "error");
      setInput(content);
      setPending((prev) => prev.filter((p) => p.clientId !== clientId));
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4" dir={dir}>
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-foreground-subtle" />
          </div>
        ) : displayMessages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <Sparkles className="h-6 w-6 text-foreground-subtle" />
            <p className="text-sm text-foreground-subtle">{t("copilotTab.empty")}</p>
          </div>
        ) : (
          displayMessages.map((m) => {
            if ("__pending" in m) {
              return (
                <MessageBubble
                  key={m.clientId}
                  message={{
                    messageId: m.clientId,
                    sessionId,
                    role: "user",
                    content: m.content,
                    status: "completed",
                  }}
                  projectId={projectId}
                />
              );
            }
            return <MessageBubble key={m.messageId} message={m} projectId={projectId} />;
          })
        )}
        {awaitingAi && (
          <div className="flex items-center gap-2 text-xs text-foreground-subtle">
            <Sparkles className="h-3.5 w-3.5" />
            <span>{t("copilotTab.thinking")}</span>
            <Loader2 className="h-3 w-3 animate-spin" />
          </div>
        )}
      </div>

      <form onSubmit={handleSend} className="border-t border-black/[0.05] p-3">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend(e);
              }
            }}
            placeholder={t("copilotTab.placeholder")}
            rows={1}
            className="flex-1 resize-none rounded-xl border border-black/[0.08] bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary-soft max-h-32"
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-white hover:bg-primary-hover disabled:opacity-50"
            title={t("copilotTab.send")}
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      </form>
    </>
  );
}

function MessageBubble({ message, projectId }: { message: ChatMessage; projectId: string }) {
  const t = useT();
  const { profile } = useAuth();
  const companyId = profile?.activeCompanyId;
  const isUser = message.role === "user";
  const status = message.status ?? "completed";

  const [rating, setRating] = useState<ChatRating | null>(message.rating ?? null);
  const [showComment, setShowComment] = useState(false);
  const [pendingRating, setPendingRating] = useState<ChatRating | null>(null);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  async function submitRating(r: ChatRating, withComment = false) {
    if (!companyId) return;
    if (withComment) {
      setPendingRating(r);
      setShowComment(true);
      return;
    }
    setSaving(true);
    try {
      await rateChatMessage(message.messageId, {
        companyId,
        projectId,
        rating: r,
      });
      setRating(r);
      showToast(t("copilotTab.ratingThanks"), "success");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Failed", "error");
    } finally {
      setSaving(false);
    }
  }

  async function submitWithComment() {
    if (!companyId || !pendingRating) return;
    setSaving(true);
    try {
      await rateChatMessage(message.messageId, {
        companyId,
        projectId,
        rating: pendingRating,
        comment: comment.trim() || undefined,
      });
      setRating(pendingRating);
      showToast(t("copilotTab.ratingThanks"), "success");
      setShowComment(false);
      setPendingRating(null);
      setComment("");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Failed", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={cn("flex gap-3", isUser && "flex-row-reverse")}>
      <div className={cn(
        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
        isUser ? "bg-primary text-white" : "bg-primary-soft text-primary"
      )}>
        {isUser ? <UserIcon className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
      </div>

      <div className={cn("min-w-0 max-w-[80%]", isUser && "items-end flex flex-col")}>
        <p className="mb-1 text-[10px] font-medium text-foreground-subtle">
          {isUser ? t("copilotTab.you") : t("copilotTab.ai")}
        </p>
        <div className={cn(
          "rounded-2xl px-4 py-2.5 text-sm",
          isUser ? "bg-primary text-white" : "bg-surface-2 text-foreground"
        )}>
          {status === "pending" || status === "running" ? (
            <span className="inline-flex items-center gap-1.5 text-foreground-subtle">
              <Loader2 className="h-3 w-3 animate-spin" /> {t("copilotTab.typing")}
            </span>
          ) : status === "failed" ? (
            <span className="inline-flex items-center gap-1 text-red-600">
              <AlertCircle className="h-3 w-3" /> {message.error?.message || t("copilotTab.failed")}
            </span>
          ) : (
            <p className="whitespace-pre-wrap leading-relaxed">{copilotMessageText(message.content)}</p>
          )}
        </div>

        {/* Rating buttons (AI messages only, when complete) */}
        {!isUser && status === "completed" && (
          <div className="mt-1.5 flex items-center gap-1">
            <button
              onClick={() => submitRating("up")}
              disabled={saving || rating === "up"}
              className={cn(
                "rounded-md p-1 transition-colors",
                rating === "up"
                  ? "bg-emerald-50 text-emerald-700"
                  : "text-foreground-subtle hover:bg-black/[0.04] hover:text-emerald-700"
              )}
              title={t("copilotTab.helpful")}
            >
              <ThumbsUp className="h-3 w-3" />
            </button>
            <button
              onClick={() => submitRating("down", true)}
              disabled={saving || rating === "down"}
              className={cn(
                "rounded-md p-1 transition-colors",
                rating === "down"
                  ? "bg-red-50 text-red-700"
                  : "text-foreground-subtle hover:bg-black/[0.04] hover:text-red-700"
              )}
              title={t("copilotTab.notHelpful")}
            >
              <ThumbsDown className="h-3 w-3" />
            </button>
            {rating && (
              <span className="ml-1 text-[10px] text-foreground-subtle">
                {t("copilotTab.ratingThanks")}
              </span>
            )}
          </div>
        )}

        {/* Comment modal-ish inline */}
        {showComment && (
          <div className="mt-2 w-full rounded-xl border border-black/[0.08] bg-card p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-medium text-foreground">{t("copilotTab.ratingComment")}</p>
              <button
                onClick={() => { setShowComment(false); setPendingRating(null); setComment(""); }}
                className="rounded-md p-1 text-foreground-subtle hover:bg-black/[0.05]"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-black/[0.08] bg-white px-2 py-1.5 text-xs outline-none focus:border-primary"
            />
            <div className="mt-2 flex justify-end gap-2">
              <button
                onClick={() => { setShowComment(false); setPendingRating(null); setComment(""); }}
                className="rounded-md border border-black/[0.08] bg-white px-2.5 py-1 text-xs"
              >
                {t("copilotTab.ratingCancel")}
              </button>
              <button
                onClick={submitWithComment}
                disabled={saving}
                className="inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-white disabled:opacity-50"
              >
                {saving && <Loader2 className="h-3 w-3 animate-spin" />}
                {t("copilotTab.ratingSubmit")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
