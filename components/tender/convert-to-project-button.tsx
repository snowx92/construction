"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useProjectStore, useInsightsStore } from "@/store";
import { FolderKanban, Loader2 } from "lucide-react";
import type { Tender } from "@/types";

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
          className="btn-secondary gap-1.5 text-xs py-1.5 px-3"
          onClick={() => router.push(`/projects/${existingWs.id}?tab=proposals&source=tender`)}
        >
          <FolderKanban className="h-3 w-3" strokeWidth={1.5} />
          Open
        </button>
      );
    }

    return (
      <button
        className="btn-primary gap-1.5 text-xs py-1.5 px-3"
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
          className="btn-primary gap-2"
          onClick={() => router.push(`/projects/${existingWs.id}?tab=proposals&source=tender`)}
        >
          <FolderKanban className="h-4 w-4" strokeWidth={1.5} />
          Open Project
        </button>
        <div
          className="flex items-center justify-between gap-4 rounded-[14px] px-5 py-4"
          style={{ background: "var(--color-success-sub)", border: "1px solid var(--color-border-sub)" }}
        >
          <div className="flex items-center gap-3">
            <div className="h-4 w-4 rounded-full" style={{ background: "var(--color-success)" }} />
            <p className="text-sm font-medium" style={{ color: "var(--color-text-1)" }}>
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
        className="btn-primary gap-2"
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
      <div
        className="flex items-center justify-between gap-4 rounded-[14px] px-5 py-4"
        style={{ background: "var(--color-accent-muted)", border: "1px solid var(--color-accent-sub)" }}
      >
        <div className="flex items-center gap-3">
          <FolderKanban className="h-4 w-4 shrink-0" strokeWidth={1.5} style={{ color: "var(--color-accent)" }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--color-text-1)" }}>
              Ready to proceed with this tender?
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--color-text-2)" }}>
              Convert it into a project workspace to manage phases, procurement, and proposals in one place.
            </p>
          </div>
        </div>
        <button
          className="btn-primary shrink-0 gap-2"
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
