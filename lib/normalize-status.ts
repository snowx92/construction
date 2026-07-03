import type { ChatMessageStatus } from "./api/types";

/** Backend uses `complete`; frontend types use `completed`. */
export function normalizeChatStatus(status?: string): ChatMessageStatus | undefined {
  if (!status) return undefined;
  if (status === "complete") return "completed";
  return status as ChatMessageStatus;
}

/** Backend proposal sections use `complete`; UI may also accept `ready`. */
export function normalizeSectionStatus(status?: string): string {
  if (!status) return "pending";
  if (status === "complete") return "complete";
  return status;
}

export function sectionStatusLabelKey(status: string): string {
  if (status === "complete") return "ready";
  return status;
}
