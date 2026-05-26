"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { mockTenders } from "@/data/mock";
import { formatCurrency, formatDate } from "@/lib/utils";
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
    pending:       { label: t("tender.statusPending"),    cls: "badge-neutral"  },
    analyzing:     { label: t("tender.statusAnalyzing"),  cls: "badge-ai"       },
    ready:         { label: t("tender.statusReady"),      cls: "badge-success"  },
    proposal_sent: { label: t("tender.statusSent"),       cls: "badge-neutral"  },
    won:           { label: t("tender.statusWon"),        cls: "badge-success"  },
    lost:          { label: t("tender.statusLost"),       cls: "badge-danger"   },
  } as const;

  const COMPLEXITY_CONFIG = {
    simple:     { label: t("tender.complexitySimple"),     cls: "badge-success"  },
    moderate:   { label: t("tender.complexityModerate"),   cls: "badge-warning"  },
    complex:    { label: t("tender.complexityComplex"),    cls: "badge-danger"   },
    enterprise: { label: t("tender.complexityEnterprise"), cls: "badge-ai"       },
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
          <p
            className="text-xs font-medium uppercase tracking-widest mb-1"
            style={{ color: "var(--color-text-3)" }}
          >
            {t("tender.subtitle")}
          </p>
          <h1
            className="text-3xl font-semibold"
            style={{ color: "var(--color-text-1)" }}
          >
            {t("tender.title")}
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--color-text-2)" }}>
            {displayCount} {t("tender.title").toLowerCase()} · {displayReady} {t("tender.countSuffix")}
          </p>
        </div>
        <label
          className="btn-primary cursor-pointer"
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
            className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2"
            strokeWidth={1.5}
            style={{ color: "var(--color-text-3)" }}
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
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium"
              style={{ color: "var(--color-text-3)" }}
            >
              {t("common.cancel")}
            </button>
          )}
        </div>
        <button className="btn-secondary gap-2">
          <Filter className="h-4 w-4" strokeWidth={1.5} />
          {t("common.filter")}
        </button>
      </div>

      {/* Upload zone (drag & drop) */}
      <div
        className={`mb-6 rounded-[20px] border-2 border-dashed p-10 text-center transition-all ${
          isDragOver
            ? "border-accent bg-accent/10"
            : "border-border bg-surface"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={
          !isDragOver
            ? {
                borderColor: "var(--color-border)",
                background: "var(--color-surface)",
              }
            : {
                borderColor: "var(--color-accent)",
                background: "oklch(var(--color-accent) / 0.1)",
              }
        }
      >
        <div
          className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-[14px]"
          style={{ background: "var(--color-accent-muted)" }}
        >
          <Upload
            className="h-5 w-5"
            strokeWidth={1.5}
            style={{ color: "var(--color-accent)" }}
          />
        </div>
        <p className="text-sm font-medium mb-1" style={{ color: "var(--color-text-1)" }}>
          {t("tender.uploadZoneTitle")}
        </p>
        <p className="text-xs" style={{ color: "var(--color-text-3)" }}>
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
        <div className="fixed bottom-4 right-4 rounded-[12px] px-4 py-3 text-sm font-medium shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-300"
          style={{
            background: toast.type === "success" ? "var(--color-success)" : "var(--color-danger)",
            color: "white",
          }}
        >
          {toast.message}
        </div>
      )}

      {/* Tender list - grid or list view */}
      <div className="space-y-3">
        {filteredTenders.length === 0 ? (
          <div className="text-center py-8" style={{ color: "var(--color-text-3)" }}>
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
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px]"
                  style={{ background: "var(--color-panel)" }}
                >
                  <FileText
                    className="h-5 w-5"
                    strokeWidth={1.5}
                    style={{ color: "var(--color-text-3)" }}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p
                      className="text-sm font-semibold truncate"
                      style={{ color: "var(--color-text-1)" }}
                    >
                      {tender.title}
                    </p>
                    {cc && (
                      <span className={`badge ${cc.cls} shrink-0`}>
                        {cc.label}
                      </span>
                    )}
                  </div>
                  <p className="text-xs" style={{ color: "var(--color-text-3)" }}>
                    {tender.client} · {t("tender.uploaded")} {formatDate(tender.submittedAt)} · {t("tender.due")}{" "}
                    {formatDate(tender.deadline)}
                    {aiConfidence && (
                      <>
                        {" "}
                        · <span className="text-accent font-medium">
                          AI {aiConfidence}% {t("tender.confidence")}
                        </span>
                      </>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  {tender.value && (
                    <div className="text-right">
                      <p
                        className="text-sm font-semibold"
                        style={{ color: "var(--color-text-1)" }}
                      >
                        {formatCurrency(tender.value, "AED")}
                      </p>
                      <p
                        className="text-xs"
                        style={{ color: "var(--color-text-3)" }}
                      >
                        {t("tender.estValue")}
                      </p>
                    </div>
                  )}
                  <span className={`badge ${sc.cls}`}>{sc.label}</span>
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
