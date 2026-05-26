"use client";

import { useState, useRef, useEffect } from "react";
import { Zap, Loader2, Download, Edit3, Check, RefreshCw } from "lucide-react";
import type { ProjectWorkspace } from "@/types";

const TRADES = ["Civil", "MEP", "Electrical", "Structural", "Finishing", "Earthworks", "Roads", "Drainage"];
const DURATIONS = ["4 weeks", "8 weeks", "12 weeks", "16 weeks", "6 months", "9 months", "12 months", "18 months", "24 months"];

function buildText(fields: FormFields): string {
  const tradeLine = fields.trades.length ? fields.trades.join(", ") : "Civil, MEP";
  return `METHOD STATEMENT
${fields.projectName || "Project"}
${"─".repeat(60)}

1. SCOPE OF WORKS
${fields.scope || "The works comprise the construction of [describe scope]."}

2. CONSTRUCTION METHODOLOGY
${fields.methodology || "Works will be executed in a logical sequence to maximise programme efficiency and quality."}

3. CONSTRUCTION SEQUENCE & PROGRAMME
Overall duration: ${fields.duration || "TBD"}

Phase 1 — Mobilisation & Site Establishment (Weeks 1–2)
Site clearance, hoarding, temporary facilities, traffic management, and establishment of site offices, storage areas, and welfare facilities.

Phase 2 — Enabling & Substructure Works
Excavation, levelling, and substructure construction per structural drawings. All earthworks to be compacted to 95% MDD per BS 1377.

Phase 3 — Superstructure & Main Works
${fields.methodology ? fields.methodology.split(".")[0] + "." : "Superstructure works to proceed in logical sequence with continuous quality hold points."}

Phase 4 — Services & MEP
MEP installation to follow structural completion on a zone-by-zone basis, enabling early commissioning and client handover of completed sections.

Phase 5 — Finishing & Commissioning
Internal and external finishes, testing and commissioning of all services, and preparation for handover.

4. KEY TRADES & RESOURCES
Trades involved: ${tradeLine}

5. CONSTRAINTS & SPECIAL CONSIDERATIONS
${fields.constraints || "No unusual constraints identified at this stage. Site access to be confirmed with Client prior to mobilisation."}

6. HEALTH, SAFETY & ENVIRONMENT
${fields.safety || "A full project-specific HSE plan will be issued prior to mobilisation. Key measures include: daily toolbox talks, weekly HSE inspections, mandatory PPE, exclusion zones, and emergency response procedures."}

All works to be executed in full compliance with ISO 45001:2018, the Client's HSE requirements, and applicable local regulations.

7. QUALITY ASSURANCE
Works will be governed by our ISO 9001:2015 certified QMS. All material submittals, inspection and test plans (ITPs), and method statements for specialist activities to be approved prior to commencement.

8. COMMUNICATION & REPORTING
Weekly progress meetings with Client. Fortnightly programme updates. Immediate notification of any variation or delay event per contract conditions.

Prepared by: ConstructCo LLC · ${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}`;
}

interface FormFields {
  projectName: string;
  scope: string;
  methodology: string;
  duration: string;
  trades: string[];
  constraints: string;
  safety: string;
}

export function MethodStatementTab({ ws }: { ws: ProjectWorkspace }) {
  const [fields, setFields] = useState<FormFields>({
    projectName: ws.name,
    scope: ws.analysis?.summary?.slice(0, 180) ?? "",
    methodology: "",
    duration: "",
    trades: [],
    constraints: "",
    safety: "",
  });

  const [outputText, setOutputText] = useState(() => buildText({ projectName: ws.name, scope: ws.analysis?.summary?.slice(0, 180) ?? "", methodology: "", duration: "", trades: [], constraints: "", safety: "" }));
  const [generating, setGenerating]   = useState(false);
  const [editingOutput, setEditingOutput] = useState(false);
  const [saved, setSaved]             = useState(false);
  const textRef = useRef<HTMLTextAreaElement>(null);

  function update<K extends keyof FormFields>(k: K, v: FormFields[K]) {
    setFields((f) => ({ ...f, [k]: v }));
  }

  function toggleTrade(t: string) {
    setFields((f) => ({
      ...f,
      trades: f.trades.includes(t) ? f.trades.filter((x) => x !== t) : [...f.trades, t],
    }));
  }

  async function generate() {
    setGenerating(true);
    setEditingOutput(false);
    // Simulate streaming: reveal text character-by-character in chunks
    const full = buildText(fields);
    setOutputText("");
    const chunkSize = 30;
    let i = 0;
    const interval = setInterval(() => {
      i += chunkSize;
      setOutputText(full.slice(0, i));
      if (i >= full.length) {
        setOutputText(full);
        clearInterval(interval);
        setGenerating(false);
      }
    }, 30);
  }

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function printText() {
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<html><head><title>Method Statement</title><style>body{font-family:monospace;white-space:pre-wrap;padding:40px;font-size:12px;line-height:1.7;}</style></head><body>${outputText.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</body></html>`);
    win.document.close();
    win.print();
  }

  return (
    <div className="flex gap-6 h-[calc(100vh-260px)] min-h-[520px]">

      {/* ── Left: form ── */}
      <div className="w-[300px] shrink-0 flex flex-col gap-4 overflow-y-auto pr-1">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--color-text-3)" }}>Project details</p>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: "var(--color-text-2)" }}>Project name</label>
              <input className="input text-sm w-full py-2" value={fields.projectName} onChange={(e) => update("projectName", e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: "var(--color-text-2)" }}>Scope summary</label>
              <textarea
                rows={3}
                className="input text-sm w-full py-2 resize-none"
                value={fields.scope}
                onChange={(e) => update("scope", e.target.value)}
                placeholder="Brief description of the works…"
              />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: "var(--color-text-2)" }}>Overall duration</label>
              <select className="input text-sm w-full py-2" value={fields.duration} onChange={(e) => update("duration", e.target.value)}>
                <option value="">Select…</option>
                {DURATIONS.map((d) => <option key={d}>{d}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--color-text-3)" }}>Methodology</p>
          <textarea
            rows={4}
            className="input text-sm w-full py-2 resize-none"
            value={fields.methodology}
            onChange={(e) => update("methodology", e.target.value)}
            placeholder="Describe the construction approach and sequence…"
          />
        </div>

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--color-text-3)" }}>Key trades</p>
          <div className="flex flex-wrap gap-1.5">
            {TRADES.map((t) => (
              <button
                key={t}
                onClick={() => toggleTrade(t)}
                className="text-[11px] px-2.5 py-1 rounded-full border transition-colors"
                style={fields.trades.includes(t)
                  ? { background: "var(--color-accent)", color: "#fff", borderColor: "var(--color-accent)" }
                  : { background: "transparent", color: "var(--color-text-2)", borderColor: "var(--color-border)" }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--color-text-3)" }}>Constraints</p>
          <textarea
            rows={2}
            className="input text-sm w-full py-2 resize-none"
            value={fields.constraints}
            onChange={(e) => update("constraints", e.target.value)}
            placeholder="Site access, noise restrictions, working hours…"
          />
        </div>

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--color-text-3)" }}>HSE notes</p>
          <textarea
            rows={2}
            className="input text-sm w-full py-2 resize-none"
            value={fields.safety}
            onChange={(e) => update("safety", e.target.value)}
            placeholder="Key safety measures and controls…"
          />
        </div>

        <button
          onClick={generate}
          disabled={generating}
          className="btn-primary w-full justify-center gap-2 disabled:opacity-60 mt-auto"
        >
          {generating
            ? <><Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.5} />Generating…</>
            : <><Zap className="h-4 w-4" strokeWidth={1.5} />Generate with AI</>}
        </button>
      </div>

      {/* Divider */}
      <div className="w-px shrink-0" style={{ background: "var(--color-border)" }} />

      {/* ── Right: output ── */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center gap-2 mb-3 shrink-0">
          <p className="text-xs font-semibold" style={{ color: "var(--color-text-2)" }}>Method Statement</p>
          {generating && <span className="badge badge-ai animate-pulse">Writing…</span>}
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setEditingOutput((v) => !v)}
              className="btn-ghost text-xs py-1.5 px-3 gap-1.5"
              style={{ color: editingOutput ? "var(--color-accent)" : undefined }}
            >
              <Edit3 className="h-3.5 w-3.5" strokeWidth={1.5} />
              {editingOutput ? "Done editing" : "Edit"}
            </button>
            <button onClick={handleSave} className="btn-ghost text-xs py-1.5 px-3 gap-1.5" style={{ color: saved ? "var(--color-success)" : undefined }}>
              {saved ? <><Check className="h-3.5 w-3.5" strokeWidth={2} />Saved</> : "Save draft"}
            </button>
            <button onClick={printText} className="btn-secondary text-xs py-1.5 px-3 gap-1.5">
              <Download className="h-3.5 w-3.5" strokeWidth={1.5} />Export PDF
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-0 card overflow-hidden" style={{ display: "flex", flexDirection: "column" }}>
          {editingOutput ? (
            <textarea
              ref={textRef}
              value={outputText}
              onChange={(e) => setOutputText(e.target.value)}
              className="flex-1 w-full p-6 text-xs font-mono leading-7 resize-none outline-none"
              style={{ color: "var(--color-text-1)", background: "var(--color-surface)", border: "none" }}
            />
          ) : (
            <div className="flex-1 overflow-y-auto p-6">
              <pre className="text-xs font-mono leading-7 whitespace-pre-wrap" style={{ color: "var(--color-text-1)" }}>
                {outputText}
                {generating && <span className="animate-pulse" style={{ color: "var(--color-ai)" }}>▌</span>}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
