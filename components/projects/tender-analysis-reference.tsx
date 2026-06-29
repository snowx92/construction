"use client";

import { CheckCircle, Clock, Zap } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import type { TenderAnalysis } from "@/types";

interface TenderAnalysisReferenceProps {
  analysis?: TenderAnalysis;
  tenderId?: string;
  tenderTitle?: string;
}

export function TenderAnalysisReference({
  analysis,
  tenderId,
  tenderTitle,
}: TenderAnalysisReferenceProps) {
  const t = useT();
  if (!analysis) return null;

  return (
    <div className="space-y-4 sticky top-20">
      {/* Header */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-1.5 w-1.5 rounded-full" style={{ background: "rgb(var(--primary))" }} />
          <p className="text-xs font-medium" style={{ color: "rgb(var(--foreground-subtle))" }}>
            {t("tenderAnalysis.title")}
          </p>
        </div>
        <p className="text-xs leading-snug" style={{ color: "rgb(var(--foreground-muted))" }}>
          {tenderTitle ? (
            <>
              {t("tenderAnalysis.basedOn", { title: tenderTitle })}
              {tenderId && (
                <>
                  {" "}
                  <span style={{ color: "rgb(var(--foreground-subtle))" }}>({tenderId})</span>
                </>
              )}
            </>
          ) : (
            t("tenderAnalysis.fallbackSub")
          )}
        </p>
      </div>

      {/* BOQ Preview */}
      {analysis.boqItems.length > 0 && (
        <div className="card p-5">
          <p className="text-xs font-medium mb-3 uppercase tracking-widest" style={{ color: "rgb(var(--foreground-subtle))" }}>
            {t("tenderAnalysis.boqHeading", { count: analysis.boqItems.length })}
          </p>
          <div className="space-y-2">
            {analysis.boqItems.slice(0, 3).map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-2 pb-2 border-b" style={{ borderColor: "rgb(var(--border) / 0.05)" }}>
                <p className="text-xs font-medium truncate" style={{ color: "rgb(var(--foreground))" }}>
                  {item.description}
                </p>
                <p className="text-xs font-mono shrink-0" style={{ color: "rgb(var(--foreground-muted))" }}>
                  {formatCurrency(item.total, "AED")}
                </p>
              </div>
            ))}
          </div>
          {analysis.boqItems.length > 3 && (
            <p className="text-xs mt-3" style={{ color: "rgb(var(--foreground-subtle))" }}>
              {t("tenderAnalysis.moreItems", { count: analysis.boqItems.length - 3 })}
            </p>
          )}
        </div>
      )}

      {/* Requirements */}
      {analysis.requirements.length > 0 && (
        <div className="card p-5">
          <p className="text-xs font-medium mb-3 uppercase tracking-widest" style={{ color: "rgb(var(--foreground-subtle))" }}>
            {t("tenderAnalysis.requirements", { count: analysis.requirements.length })}
          </p>
          <ul className="space-y-2">
            {analysis.requirements.slice(0, 3).map((req, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <CheckCircle className="h-3 w-3 mt-0.5 shrink-0" strokeWidth={2} style={{ color: "rgb(var(--success))" }} />
                <span className="text-xs" style={{ color: "rgb(var(--foreground-muted))" }}>
                  {req}
                </span>
              </li>
            ))}
          </ul>
          {analysis.requirements.length > 3 && (
            <p className="text-xs mt-2" style={{ color: "rgb(var(--foreground-subtle))" }}>
              {t("tenderAnalysis.moreRequirements", { count: analysis.requirements.length - 3 })}
            </p>
          )}
        </div>
      )}

      {/* Key Dates */}
      {analysis.deadlines.length > 0 && (
        <div className="card p-5">
          <p className="text-xs font-medium mb-3 uppercase tracking-widest" style={{ color: "rgb(var(--foreground-subtle))" }}>
            {t("tenderAnalysis.keyDates")}
          </p>
          <div className="space-y-2">
            {analysis.deadlines.map((d) => (
              <div key={d.label} className="flex items-start gap-2">
                <Clock className="h-3 w-3 mt-0.5 shrink-0" strokeWidth={2} style={{ color: "rgb(var(--foreground-subtle))" }} />
                <div>
                  <p className="text-xs font-medium" style={{ color: "rgb(var(--foreground))" }}>
                    {d.label}
                  </p>
                  <p className="text-xs" style={{ color: "rgb(var(--foreground-subtle))" }}>
                    {d.date}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Estimated Value */}
      {analysis.estimatedValue > 0 && (
        <div className="card p-5" style={{ background: "rgb(var(--primary-soft))", border: "1px solid rgb(var(--primary-soft))" }}>
          <p className="text-xs font-medium mb-2" style={{ color: "rgb(var(--foreground-subtle))" }}>
            {t("tenderAnalysis.estimatedValue")}
          </p>
          <p className="text-2xl font-bold" style={{ color: "rgb(var(--primary))" }}>
            {formatCurrency(analysis.estimatedValue, "AED")}
          </p>
        </div>
      )}

      {/* AI Confidence */}
      <div className="card p-4 flex items-center gap-2" style={{ background: "rgb(var(--primary-soft))", border: "1px solid rgb(var(--primary))" }}>
        <Zap className="h-3.5 w-3.5 shrink-0" strokeWidth={2} style={{ color: "rgb(var(--primary))" }} />
        <p className="text-xs" style={{ color: "rgb(var(--primary))" }}>
          {t("tenderAnalysis.confidence", { percent: Math.round(analysis.aiConfidence * 100) })}
        </p>
      </div>
    </div>
  );
}
