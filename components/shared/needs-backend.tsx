"use client";

/**
 * NEEDS_BACKEND — visible marker for UI sections that don't yet have a
 * backing API endpoint. Backend team: search the codebase for this tag
 * to find every unwired surface.
 *
 * Usage:
 *   <NeedsBackend endpoint="GET /api/insights" what="AI insight feed" />
 *   <NeedsBackend endpoint="GET /api/billing/subscription" what="Stripe subscription" details="Also POST /portal-session, GET /invoices" />
 */

import { Server } from "lucide-react";

interface NeedsBackendProps {
  /** Proposed endpoint(s), e.g. "GET /api/insights" */
  endpoint: string;
  /** Short description of what this UI needs */
  what: string;
  /** Optional extra context for the backend team */
  details?: string;
  /** Inline (chip) or block (banner) — defaults to block */
  variant?: "inline" | "block";
}

export function NeedsBackend({ endpoint, what, details, variant = "block" }: NeedsBackendProps) {
  if (variant === "inline") {
    return (
      <span
        data-needs-backend={endpoint}
        title={`NEEDS_BACKEND: ${endpoint} — ${what}${details ? `\n${details}` : ""}`}
        className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-800"
      >
        <Server className="h-2.5 w-2.5" />
        NEEDS_BACKEND
      </span>
    );
  }

  return (
    <div
      data-needs-backend={endpoint}
      className="my-2 flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50/70 px-4 py-3 text-sm"
    >
      <Server className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-widest text-amber-800">
          NEEDS_BACKEND
        </p>
        <p className="mt-0.5 text-sm font-medium text-amber-900">{what}</p>
        <code className="mt-1 inline-block rounded bg-amber-100 px-1.5 py-0.5 font-mono text-[11px] text-amber-900">
          {endpoint}
        </code>
        {details && (
          <p className="mt-1 text-xs text-amber-800/80">{details}</p>
        )}
      </div>
    </div>
  );
}
