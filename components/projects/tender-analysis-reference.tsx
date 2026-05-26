import { CheckCircle, Clock, Zap } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
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
  if (!analysis) return null;

  return (
    <div className="space-y-4 sticky top-20">
      {/* Header */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--color-ai)" }} />
          <p className="text-xs font-medium" style={{ color: "var(--color-text-3)" }}>
            TENDER ANALYSIS
          </p>
        </div>
        <p className="text-xs leading-snug" style={{ color: "var(--color-text-2)" }}>
          {tenderTitle ? (
            <>
              Based on <span className="font-semibold">{tenderTitle}</span>
              {tenderId && (
                <>
                  {" "}
                  <span style={{ color: "var(--color-text-3)" }}>({tenderId})</span>
                </>
              )}
            </>
          ) : (
            "Documents generated from tender analysis"
          )}
        </p>
      </div>

      {/* BOQ Preview */}
      {analysis.boqItems.length > 0 && (
        <div className="card p-5">
          <p className="text-xs font-medium mb-3 uppercase tracking-widest" style={{ color: "var(--color-text-3)" }}>
            BOQ ({analysis.boqItems.length} items)
          </p>
          <div className="space-y-2">
            {analysis.boqItems.slice(0, 3).map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-2 pb-2 border-b" style={{ borderColor: "var(--color-border-sub)" }}>
                <p className="text-xs font-medium truncate" style={{ color: "var(--color-text-1)" }}>
                  {item.description}
                </p>
                <p className="text-xs font-mono shrink-0" style={{ color: "var(--color-text-2)" }}>
                  {formatCurrency(item.total, "AED")}
                </p>
              </div>
            ))}
          </div>
          {analysis.boqItems.length > 3 && (
            <p className="text-xs mt-3" style={{ color: "var(--color-text-3)" }}>
              +{analysis.boqItems.length - 3} more items
            </p>
          )}
        </div>
      )}

      {/* Requirements */}
      {analysis.requirements.length > 0 && (
        <div className="card p-5">
          <p className="text-xs font-medium mb-3 uppercase tracking-widest" style={{ color: "var(--color-text-3)" }}>
            Requirements ({analysis.requirements.length})
          </p>
          <ul className="space-y-2">
            {analysis.requirements.slice(0, 3).map((req, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <CheckCircle className="h-3 w-3 mt-0.5 shrink-0" strokeWidth={2} style={{ color: "var(--color-success)" }} />
                <span className="text-xs" style={{ color: "var(--color-text-2)" }}>
                  {req}
                </span>
              </li>
            ))}
          </ul>
          {analysis.requirements.length > 3 && (
            <p className="text-xs mt-2" style={{ color: "var(--color-text-3)" }}>
              +{analysis.requirements.length - 3} more requirements
            </p>
          )}
        </div>
      )}

      {/* Key Dates */}
      {analysis.deadlines.length > 0 && (
        <div className="card p-5">
          <p className="text-xs font-medium mb-3 uppercase tracking-widest" style={{ color: "var(--color-text-3)" }}>
            Key Dates
          </p>
          <div className="space-y-2">
            {analysis.deadlines.map((d) => (
              <div key={d.label} className="flex items-start gap-2">
                <Clock className="h-3 w-3 mt-0.5 shrink-0" strokeWidth={2} style={{ color: "var(--color-text-3)" }} />
                <div>
                  <p className="text-xs font-medium" style={{ color: "var(--color-text-1)" }}>
                    {d.label}
                  </p>
                  <p className="text-xs" style={{ color: "var(--color-text-3)" }}>
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
        <div className="card p-5" style={{ background: "var(--color-accent-muted)", border: "1px solid var(--color-accent-sub)" }}>
          <p className="text-xs font-medium mb-2" style={{ color: "var(--color-text-3)" }}>
            Estimated Value
          </p>
          <p className="text-2xl font-bold" style={{ color: "var(--color-accent)" }}>
            {formatCurrency(analysis.estimatedValue, "AED")}
          </p>
        </div>
      )}

      {/* AI Confidence */}
      <div className="card p-4 flex items-center gap-2" style={{ background: "var(--color-ai-sub)", border: "1px solid var(--color-ai-line)" }}>
        <Zap className="h-3.5 w-3.5 shrink-0" strokeWidth={2} style={{ color: "var(--color-ai)" }} />
        <p className="text-xs" style={{ color: "var(--color-ai)" }}>
          <strong>{Math.round(analysis.aiConfidence * 100)}%</strong> analysis confidence
        </p>
      </div>
    </div>
  );
}
