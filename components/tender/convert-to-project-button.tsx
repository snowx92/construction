"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useProjectStore, useInsightsStore } from "@/store";
import { FolderKanban, Loader2 } from "lucide-react";
import type { Tender } from "@/types";
import { cn } from "@/lib/utils";

interface ConvertToProjectButtonProps {
  tender: Tender;
  variant?: "default" | "inline";
}

export function ConvertToProjectButton({ tender, variant = "default" }: ConvertToProjectButtonProps) {
  const router = useRouter();
  const addWorkspace = useProjectStore((s) => s.addWorkspace);
  const workspaces = useProjectStore((s) => s.workspaces);

  const addInsight = useInsightsStore((s) => s.addInsight);
  const [converting, setConverting] = useState(false);

  // Check if already converted
  const existingWs = workspaces.find((w) => w.tenderId === tender.id);

  async function handleConvert() {
    if (existingWs) {
      router.push(`/projects/${existingWs.id}?tab=proposals&source=tender`);
      return;
    }
    setConverting(true);
    await new Promise((r) => setTimeout(r, 500));
    const wsId = addWorkspace({
      name: tender.title,
      status: tender.analysis ? "ready" : "analyzing",
      pinned: false,
      tenderId: tender.id,
      clientName: tender.client,
      projectType: tender.tags[0] ?? "Construction",
      analysis: tender.analysis,
    });

    // Push each risk to AI Insights
    if (tender.analysis) {
      tender.analysis.risks.forEach((risk) => {
        addInsight({
          type: "risk",
          title: `${tender.title}: ${risk.title}`,
          body: risk.description + (risk.clause ? ` (${risk.clause})` : ""),
          severity: risk.level,
          relatedTo: { type: "project", id: wsId, label: tender.title },
          createdAt: new Date().toISOString(),
          read: false,
        });
      });
    }

    router.push(`/projects/${wsId}?tab=proposals&source=tender`);
  }

  // Inline variant - just show a small button for use in lists
  if (variant === "inline") {
    if (existingWs) {
      return (
        <button
          className={cn(
            "inline-flex items-center gap-2 h-10 px-5 rounded-[var(--radius-pill)] bg-surface text-foreground border border-black/[0.06] text-sm font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] transition-all duration-500 ease-out hover:bg-black/[0.035]",
            "gap-1.5 text-xs py-1.5 px-3"
          )}
          onClick={() => router.push(`/projects/${existingWs.id}?tab=proposals&source=tender`)}
        >
          <FolderKanban className="h-3 w-3" strokeWidth={1.5} />
          Open
        </button>
      );
    }

    return (
      <button
        className={cn(
          "inline-flex items-center gap-2 h-10 px-5 rounded-[var(--radius-pill)] bg-primary text-white text-sm font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] transition-all duration-500 ease-out hover:bg-primary-hover hover:scale-[1.02]",
          "gap-1.5 text-xs py-1.5 px-3"
        )}
        onClick={handleConvert}
        disabled={converting}
      >
        {converting ? (
          <Loader2 className="h-3 w-3 animate-spin" strokeWidth={1.5} />
        ) : (
          <FolderKanban className="h-3 w-3" strokeWidth={1.5} />
        )}
        {converting ? "Converting…" : "Convert"}
      </button>
    );
  }

  // Default variant - full button with banner
  if (existingWs) {
    return (
      <>
        <button
          className="inline-flex items-center gap-2 h-10 px-5 rounded-[var(--radius-pill)] bg-primary text-white text-sm font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] transition-all duration-500 ease-out hover:bg-primary-hover hover:scale-[1.02]"
          onClick={() => router.push(`/projects/${existingWs.id}?tab=proposals&source=tender`)}
        >
          <FolderKanban className="h-4 w-4" strokeWidth={1.5} />
          Open Project
        </button>
        <div className="flex items-center justify-between gap-4 rounded-[14px] px-5 py-4 bg-success-soft border border-black/[0.05]">
          <div className="flex items-center gap-3">
            <div className="h-4 w-4 rounded-full bg-success" />
            <p className="text-sm font-medium text-foreground">
              This tender has been converted to a project workspace.
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <button
        className="inline-flex items-center gap-2 h-10 px-5 rounded-[var(--radius-pill)] bg-primary text-white text-sm font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] transition-all duration-500 ease-out hover:bg-primary-hover hover:scale-[1.02]"
        onClick={handleConvert}
        disabled={converting}
      >
        {converting ? (
          <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.5} />
        ) : (
          <FolderKanban className="h-4 w-4" strokeWidth={1.5} />
        )}
        {converting ? "Converting…" : "Convert to Project"}
      </button>
      <div className="flex items-center justify-between gap-4 rounded-[14px] px-5 py-4 bg-primary-soft border border-primary-soft">
        <div className="flex items-center gap-3">
          <FolderKanban className="h-4 w-4 shrink-0 text-primary" strokeWidth={1.5} />
          <div>
            <p className="text-sm font-semibold text-foreground">
              Ready to proceed with this tender?
            </p>
            <p className="text-xs mt-0.5 text-foreground-muted">
              Convert it into a project workspace to manage phases, procurement, and proposals in one place.
            </p>
          </div>
        </div>
        <button
          className={cn(
            "inline-flex items-center gap-2 h-10 px-5 rounded-[var(--radius-pill)] bg-primary text-white text-sm font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] transition-all duration-500 ease-out hover:bg-primary-hover hover:scale-[1.02]",
            "shrink-0"
          )}
          onClick={handleConvert}
          disabled={converting}
        >
          {converting ? (
            <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.5} />
          ) : (
            <FolderKanban className="h-4 w-4" strokeWidth={1.5} />
          )}
          {converting ? "Converting…" : "Convert"}
        </button>
      </div>
    </>
  );
}
