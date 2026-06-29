"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { mockTenders } from "@/data/mock";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { Upload, Search, Filter, FileText, X } from "lucide-react";
import { ConvertToProjectButton } from "@/components/tender/convert-to-project-button";
import { useT } from "@/lib/i18n";
import { useLocalizedTenders } from "@/lib/i18n/use-localized-data";
import type { Tender, TenderStatus } from "@/types";

interface UploadedTender extends Tender {
  uploadedNow?: boolean;
}

export default function TenderListPage() {
  const t = useT();
  const STATUS_CONFIG = {
    pending:       { label: t("tender.statusPending"),    cls: "bg-surface-2 text-foreground-muted border border-black/[0.06]" },
    analyzing:     { label: t("tender.statusAnalyzing"),  cls: "bg-primary-soft text-primary" },
    ready:         { label: t("tender.statusReady"),      cls: "bg-success-soft text-success"  },
    proposal_sent: { label: t("tender.statusSent"),       cls: "bg-surface-2 text-foreground-muted border border-black/[0.06]" },
    won:           { label: t("tender.statusWon"),        cls: "bg-success-soft text-success"  },
    lost:          { label: t("tender.statusLost"),       cls: "bg-danger-soft text-danger"   },
  } as const;

  const COMPLEXITY_CONFIG = {
    simple:     { label: t("tender.complexitySimple"),     cls: "bg-success-soft text-success"  },
    moderate:   { label: t("tender.complexityModerate"),   cls: "bg-warning-soft text-warning"  },
    complex:    { label: t("tender.complexityComplex"),    cls: "bg-danger-soft text-danger"   },
    enterprise: { label: t("tender.complexityEnterprise"), cls: "bg-primary-soft text-primary"  },
  } as const;

  const [tenders, setTenders] = useState<UploadedTender[]>(mockTenders);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Show toast notifications
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Simulate AI processing animation: pending → analyzing → ready
  const simulateProcessing = async (fileName: string): Promise<TenderStatus> => {
    return new Promise((resolve) => {
      const steps: TenderStatus[] = ["pending", "analyzing", "ready"];
      let stepIndex = 0;

      const processStep = () => {
        if (stepIndex < steps.length) {
          setTenders((prev) => [
            {
              ...prev[0],
              status: steps[stepIndex],
            },
            ...prev.slice(1),
          ]);
          stepIndex++;
          setTimeout(processStep, 1000);
        } else {
          resolve("ready");
        }
      };

      processStep();
    });
  };

  // Handle file upload with processing simulation
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsProcessing(true);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileName = file.name.replace(/\.[^/.]+$/, "");

      // Create new tender with pending status
      const newTender: UploadedTender = {
        id: `t-${Date.now()}-${i}`,
        title: fileName,
        client: "New Upload",
        status: "pending",
        submittedAt: new Date().toISOString().split("T")[0],
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        value: undefined,
        tags: ["uploaded", "pending-analysis"],
        files: [],
        analysis: {
          aiConfidence: Math.round(Math.random() * 20 + 80) / 100, // 80-100%
          summary: "Analyzing document structure and extracting key information...",
          requirements: [],
          risks: [],
          penalties: [],
          deadlines: [],
          boqItems: [],
          estimatedValue: 0,
          complexity: "moderate",
          missingInfo: [],
        },
        uploadedNow: true,
      };

      setTenders((prev) => [newTender, ...prev]);

      // Simulate processing animation
      await simulateProcessing(fileName);

      setToast({
        message: `${fileName} uploaded and analyzed successfully`,
        type: "success",
      });
    }

    setIsProcessing(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    handleFileUpload(e.dataTransfer.files);
  };

  // Apply Arabic translations to tenders when locale is AR
  const localizedTenders = useLocalizedTenders(tenders) as UploadedTender[];

  // Filter tenders by search query
  const filteredTenders = localizedTenders.filter((t) => {
    const query = searchQuery.toLowerCase();
    return (
      t.title.toLowerCase().includes(query) ||
      t.client.toLowerCase().includes(query) ||
      t.status.toLowerCase().includes(query)
    );
  });

  const readyCount = filteredTenders.filter((t) => t.status === "ready").length;
  const displayCount = searchQuery ? filteredTenders.length : tenders.length;
  const displayReady = searchQuery ? readyCount : tenders.filter((t) => t.status === "ready").length;

  return (
    <div className="mx-auto max-w-[1200px] px-8 py-10">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest mb-1 text-foreground-subtle">
            {t("tender.subtitle")}
          </p>
          <h1 className="text-3xl font-semibold text-foreground">
            {t("tender.title")}
          </h1>
          <p className="mt-1 text-sm text-foreground-muted">
            {displayCount} {t("tender.title").toLowerCase()} · {displayReady} {t("tender.countSuffix")}
          </p>
        </div>
        <label
          className={cn(
            "inline-flex items-center gap-2 h-10 px-5 rounded-[var(--radius-pill)] bg-primary text-white text-sm font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] transition-all duration-500 ease-out hover:bg-primary-hover hover:scale-[1.02]",
            "cursor-pointer"
          )}
          htmlFor="tender-upload"
          role="button"
          tabIndex={0}
        >
          <Upload className="h-4 w-4" strokeWidth={1.5} />
          {t("tender.uploadTender")}
          <input
            ref={fileInputRef}
            id="tender-upload"
            type="file"
            accept=".pdf,.dwg,.xlsx"
            className="sr-only"
            multiple
            onChange={(e) => handleFileUpload(e.target.files)}
            disabled={isProcessing}
          />
        </label>
      </div>

      {/* Search bar */}
      <div className="mb-6 flex gap-3">
        <div className="relative flex-1">
          <Search
            className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-subtle"
            strokeWidth={1.5}
          />
          <input
            type="text"
            placeholder={t("tender.searchPlaceholder")}
            className="input pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-foreground-subtle"
            >
              {t("common.cancel")}
            </button>
          )}
        </div>
        <button className="inline-flex items-center gap-2 h-10 px-5 rounded-[var(--radius-pill)] bg-surface text-foreground border border-black/[0.06] text-sm font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] transition-all duration-500 ease-out hover:bg-black/[0.035]">
          <Filter className="h-4 w-4" strokeWidth={1.5} />
          {t("common.filter")}
        </button>
      </div>

      {/* Upload zone (drag & drop) */}
      <div
        className={cn(
          "mb-6 rounded-[20px] border-2 border-dashed p-10 text-center transition-all",
          isDragOver ? "border-primary bg-primary-soft" : "border-black/[0.06] bg-surface"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-[14px] bg-primary-soft">
          <Upload
            className="h-5 w-5 text-primary"
            strokeWidth={1.5}
          />
        </div>
        <p className="text-sm font-medium mb-1 text-foreground">
          {t("tender.uploadZoneTitle")}
        </p>
        <p className="text-xs text-foreground-subtle">
          {t("tender.uploadZoneSub")}
        </p>
        <input
          type="file"
          accept=".pdf,.dwg,.xlsx"
          multiple
          className="mt-4 cursor-pointer"
          onChange={(e) => handleFileUpload(e.target.files)}
          disabled={isProcessing}
          style={{ display: "none" }}
          onClick={(e) => e.currentTarget.click()}
        />
      </div>

      {/* Toast notification */}
      {toast && (
        <div className={cn(
          "fixed bottom-4 right-4 rounded-[12px] px-4 py-3 text-sm font-medium shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-300 text-white",
          toast.type === "success" ? "bg-success" : "bg-danger"
        )}>
          {toast.message}
        </div>
      )}

      {/* Tender list - grid or list view */}
      <div className="space-y-3">
        {filteredTenders.length === 0 ? (
          <div className="text-center py-8 text-foreground-subtle">
            <p>{t("tender.noMatch")}</p>
          </div>
        ) : (
          filteredTenders.map((tender) => {
            const sc = STATUS_CONFIG[tender.status];
            const cc = tender.analysis ? COMPLEXITY_CONFIG[tender.analysis.complexity] : null;
            const aiConfidence = tender.analysis?.aiConfidence
              ? Math.round(tender.analysis.aiConfidence * 100)
              : null;

            return (
              <div
                key={tender.id}
                className="card flex items-center gap-5 p-5 transition-all"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-surface-2">
                  <FileText
                    className="h-5 w-5 text-foreground-subtle"
                    strokeWidth={1.5}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-semibold truncate text-foreground">
                      {tender.title}
                    </p>
                    {cc && (
                      <span className={cn("inline-flex items-center gap-1 rounded-[var(--radius-pill)] px-2.5 py-0.5 text-xs font-medium shrink-0", cc.cls)}>
                        {cc.label}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-foreground-subtle">
                    {tender.client} · {t("tender.uploaded")} {formatDate(tender.submittedAt)} · {t("tender.due")}{" "}
                    {formatDate(tender.deadline)}
                    {aiConfidence && (
                      <>
                        {" "}
                        · <span className="text-primary font-medium">
                          AI {aiConfidence}% {t("tender.confidence")}
                        </span>
                      </>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  {tender.value && (
                    <div className="text-right">
                      <p className="text-sm font-semibold text-foreground">
                        {formatCurrency(tender.value, "AED")}
                      </p>
                      <p className="text-xs text-foreground-subtle">
                        {t("tender.estValue")}
                      </p>
                    </div>
                  )}
                  <span className={cn("inline-flex items-center gap-1 rounded-[var(--radius-pill)] px-2.5 py-0.5 text-xs font-medium", sc.cls)}>{sc.label}</span>
                  <ConvertToProjectButton tender={tender as Tender} variant="inline" />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
