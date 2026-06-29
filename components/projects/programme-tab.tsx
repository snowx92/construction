"use client";

import { useState } from "react";
import { Download, Zap, ChevronLeft, ChevronRight } from "lucide-react";
import type { ProjectWorkspace } from "@/types";

/* ── Data ──────────────────────────────────────────────────────────── */
type Category = "Mobilisation" | "Civil" | "Structural" | "MEP" | "Finishing" | "External" | "Commissioning";

interface Activity {
  id: string;
  name: string;
  category: Category;
  start: number; // week (1-based)
  end: number;   // week (inclusive)
  critical?: boolean;
}

const CAT_COLORS: Record<Category, string> = {
  Mobilisation:  "#6b7280",
  Civil:         "#d97706",
  Structural:    "#2563eb",
  MEP:           "#7c3aed",
  Finishing:     "#16a34a",
  External:      "#0891b2",
  Commissioning: "#dc2626",
};

const DEFAULT_ACTIVITIES: Activity[] = [
  { id: "a01", name: "Mobilisation & Site Setup",          category: "Mobilisation",  start: 1,  end: 3  },
  { id: "a02", name: "Earthworks & Bulk Excavation",       category: "Civil",         start: 2,  end: 7,  critical: true },
  { id: "a03", name: "Drainage & Underground Services",    category: "Civil",         start: 5,  end: 10 },
  { id: "a04", name: "Foundation Concrete — Block A",      category: "Structural",    start: 6,  end: 12, critical: true },
  { id: "a05", name: "Foundation Concrete — Block B",      category: "Structural",    start: 8,  end: 14, critical: true },
  { id: "a06", name: "Foundation Concrete — Block C",      category: "Structural",    start: 10, end: 16 },
  { id: "a07", name: "Superstructure Frame — Block A",     category: "Structural",    start: 12, end: 18, critical: true },
  { id: "a08", name: "Superstructure Frame — Block B",     category: "Structural",    start: 14, end: 20, critical: true },
  { id: "a09", name: "Superstructure Frame — Block C",     category: "Structural",    start: 16, end: 22 },
  { id: "a10", name: "Roofing & Waterproofing",            category: "Civil",         start: 17, end: 22 },
  { id: "a11", name: "MEP Rough-in — Block A",             category: "MEP",           start: 18, end: 24 },
  { id: "a12", name: "MEP Rough-in — Block B & C",         category: "MEP",           start: 20, end: 26 },
  { id: "a13", name: "External Masonry & Cladding",        category: "External",      start: 20, end: 28 },
  { id: "a14", name: "Internal Plaster & Floor Screeds",   category: "Finishing",     start: 22, end: 29 },
  { id: "a15", name: "MEP Finishes & Fixtures",            category: "MEP",           start: 24, end: 31 },
  { id: "a16", name: "Internal Finishes — Tiling & Paint", category: "Finishing",     start: 26, end: 33, critical: true },
  { id: "a17", name: "Joinery, Kitchens & Doors",          category: "Finishing",     start: 28, end: 34 },
  { id: "a18", name: "Roads, Parking & External Paving",   category: "External",      start: 28, end: 35 },
  { id: "a19", name: "Landscaping & Irrigation",           category: "External",      start: 31, end: 37 },
  { id: "a20", name: "Testing & Commissioning",            category: "Commissioning", start: 33, end: 37, critical: true },
  { id: "a21", name: "Snagging & Final Handover",          category: "Commissioning", start: 36, end: 38, critical: true },
];

/* ── Constants ─────────────────────────────────────────────────────── */
const TOTAL_WEEKS    = 38;
const ROW_H          = 36;
const HEADER_H       = 44;
const NAME_W         = 224;
const WEEK_W         = 28;
const CHART_W        = NAME_W + TOTAL_WEEKS * WEEK_W;

/* ── Component ─────────────────────────────────────────────────────── */
export function ProgrammeTab({ ws }: { ws: ProjectWorkspace }) {
  const [activities]  = useState<Activity[]>(DEFAULT_ACTIVITIES);
  const [visibleCats, setVisibleCats] = useState<Set<Category>>(
    new Set(Object.keys(CAT_COLORS) as Category[])
  );
  const [scrollLeft, setScrollLeft] = useState(0);

  const visible = activities.filter((a) => visibleCats.has(a.category));
  const totalH  = HEADER_H + visible.length * ROW_H;

  function toggleCat(cat: Category) {
    setVisibleCats((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) { if (next.size > 1) next.delete(cat); }
      else next.add(cat);
      return next;
    });
  }

  function exportPDF() {
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<html><head><title>Construction Programme</title><style>body{font-family:Arial,sans-serif;font-size:11px;padding:20px;}h1{font-size:14px;}table{width:100%;border-collapse:collapse;}th,td{border:1px solid #ddd;padding:6px 8px;text-align:left;}th{background:#f0f0f0;}</style></head><body><h1>Construction Programme — ${ws.name}</h1><table><tr><th>#</th><th>Activity</th><th>Category</th><th>Start Week</th><th>End Week</th><th>Duration</th></tr>${activities.map((a, i) => `<tr><td>${i + 1}</td><td>${a.name}</td><td>${a.category}</td><td>${a.start}</td><td>${a.end}</td><td>${a.end - a.start + 1} weeks</td></tr>`).join("")}</table></body></html>`);
    win.document.close();
    win.print();
  }

  const visibleWeekStart = Math.floor(scrollLeft / WEEK_W) + 1;

  return (
    <div className="space-y-4">

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div>
          <p className="text-sm font-semibold" style={{ color: "rgb(var(--foreground))" }}>Construction Programme</p>
          <p className="text-xs" style={{ color: "rgb(var(--foreground-subtle))" }}>
            {activities.length} activities · {TOTAL_WEEKS} weeks · {ws.name}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button className="btn-ghost text-xs py-1.5 px-3 gap-1.5" style={{ color: "rgb(var(--primary))" }}>
            <Zap className="h-3.5 w-3.5" strokeWidth={1.5} />Generate from BOQ
          </button>
          <button onClick={exportPDF} className="btn-secondary text-xs py-1.5 px-3 gap-1.5">
            <Download className="h-3.5 w-3.5" strokeWidth={1.5} />Export PDF
          </button>
        </div>
      </div>

      {/* Legend / category filter */}
      <div className="flex flex-wrap gap-2">
        {(Object.entries(CAT_COLORS) as [Category, string][]).map(([cat, color]) => (
          <button
            key={cat}
            onClick={() => toggleCat(cat)}
            className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full border transition-all"
            style={{
              borderColor: visibleCats.has(cat) ? color : "rgb(var(--border) / 0.06)",
              color: visibleCats.has(cat) ? color : "rgb(var(--foreground-subtle))",
              background: visibleCats.has(cat) ? `color-mix(in srgb, ${color} 12%, transparent)` : "transparent",
              fontWeight: visibleCats.has(cat) ? 600 : 400,
            }}
          >
            <span className="h-2 w-2 rounded-full shrink-0" style={{ background: visibleCats.has(cat) ? color : "rgb(var(--border) / 0.06)" }} />
            {cat}
          </button>
        ))}
      </div>

      {/* Gantt chart */}
      <div className="card overflow-hidden">
        <div
          className="overflow-x-auto scrollbar-thin"
          onScroll={(e) => setScrollLeft((e.target as HTMLElement).scrollLeft)}
        >
          <div style={{ width: CHART_W, minWidth: CHART_W }}>
            <svg width={CHART_W} height={totalH} style={{ display: "block" }}>

              {/* ── Background fill ── */}
              <rect width={CHART_W} height={totalH} fill="rgb(var(--surface))" />

              {/* ── Alternating row stripes ── */}
              {visible.map((_, i) => (
                i % 2 === 1 ? (
                  <rect
                    key={i}
                    x={0}
                    y={HEADER_H + i * ROW_H}
                    width={CHART_W}
                    height={ROW_H}
                    fill="rgb(var(--surface-2))"
                  />
                ) : null
              ))}

              {/* ── Week grid lines ── */}
              {Array.from({ length: TOTAL_WEEKS + 1 }, (_, w) => (
                <line
                  key={w}
                  x1={NAME_W + w * WEEK_W}
                  y1={0}
                  x2={NAME_W + w * WEEK_W}
                  y2={totalH}
                  stroke="rgb(var(--border) / 0.05)"
                  strokeWidth={w % 4 === 0 ? 1.5 : 0.5}
                />
              ))}

              {/* ── Row dividers ── */}
              {visible.map((_, i) => (
                <line
                  key={i}
                  x1={0}
                  y1={HEADER_H + i * ROW_H}
                  x2={CHART_W}
                  y2={HEADER_H + i * ROW_H}
                  stroke="rgb(var(--border) / 0.05)"
                  strokeWidth={0.5}
                />
              ))}

              {/* ── Header background ── */}
              <rect width={CHART_W} height={HEADER_H} fill="rgb(var(--surface-2))" />
              <line x1={0} y1={HEADER_H} x2={CHART_W} y2={HEADER_H} stroke="rgb(var(--border) / 0.06)" strokeWidth={1} />

              {/* ── Name column header ── */}
              <rect width={NAME_W} height={totalH} fill="rgb(var(--surface-2))" opacity={0.6} />
              <line x1={NAME_W} y1={0} x2={NAME_W} y2={totalH} stroke="rgb(var(--border) / 0.06)" strokeWidth={1} />
              <text x={12} y={HEADER_H / 2 + 5} fontSize={10} fontWeight={600} fill="rgb(var(--foreground-subtle))">ACTIVITY</text>

              {/* ── Week numbers ── */}
              {Array.from({ length: TOTAL_WEEKS }, (_, w) => {
                const wk = w + 1;
                const cx = NAME_W + w * WEEK_W + WEEK_W / 2;
                return (
                  <g key={wk}>
                    {wk % 2 === 0 && (
                      <text x={cx} y={HEADER_H / 2 + 5} textAnchor="middle" fontSize={9} fill="rgb(var(--foreground-subtle))" fontWeight={wk % 4 === 0 ? 600 : 400}>
                        {wk}
                      </text>
                    )}
                    {wk % 4 === 0 && (
                      <text x={cx} y={HEADER_H - 8} textAnchor="middle" fontSize={8} fill="rgb(var(--foreground-subtle))" opacity={0.6}>
                        M{Math.ceil(wk / 4)}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* ── Activity rows ── */}
              {visible.map((act, i) => {
                const y    = HEADER_H + i * ROW_H;
                const barX = NAME_W + (act.start - 1) * WEEK_W + 2;
                const barW = (act.end - act.start + 1) * WEEK_W - 4;
                const barY = y + 6;
                const barH = ROW_H - 12;
                const color = CAT_COLORS[act.category];

                return (
                  <g key={act.id}>
                    {/* Activity name */}
                    <text
                      x={8}
                      y={y + ROW_H / 2 + 4}
                      fontSize={10.5}
                      fill="rgb(var(--foreground))"
                      style={{ userSelect: "none" }}
                    >
                      {act.name.length > 26 ? act.name.slice(0, 26) + "…" : act.name}
                    </text>

                    {/* Gantt bar */}
                    <rect
                      x={barX}
                      y={barY}
                      width={barW}
                      height={barH}
                      rx={4}
                      fill={color}
                      opacity={0.85}
                    />

                    {/* Critical path indicator */}
                    {act.critical && (
                      <rect
                        x={barX}
                        y={barY + barH - 3}
                        width={barW}
                        height={3}
                        rx={0}
                        fill="rgba(220,38,38,0.7)"
                      />
                    )}

                    {/* Duration label inside bar */}
                    {barW > 40 && (
                      <text
                        x={barX + barW / 2}
                        y={barY + barH / 2 + 4}
                        textAnchor="middle"
                        fontSize={9}
                        fill="white"
                        fontWeight={600}
                        style={{ userSelect: "none" }}
                      >
                        {act.end - act.start + 1}w
                      </text>
                    )}
                  </g>
                );
              })}

              {/* ── Today line (week 1 indicator) ── */}
              <line
                x1={NAME_W + 0.5 * WEEK_W}
                y1={HEADER_H}
                x2={NAME_W + 0.5 * WEEK_W}
                y2={totalH}
                stroke="rgb(var(--danger))"
                strokeWidth={1.5}
                strokeDasharray="4 3"
                opacity={0.5}
              />
            </svg>
          </div>
        </div>

        {/* Summary footer */}
        <div className="flex items-center gap-6 px-5 py-3" style={{ borderTop: "1px solid rgb(var(--border) / 0.05)", background: "rgb(var(--surface-2))" }}>
          <span className="text-xs" style={{ color: "rgb(var(--foreground-subtle))" }}>
            <span className="font-semibold" style={{ color: "rgb(var(--foreground))" }}>{visible.length}</span> activities shown
          </span>
          <span className="text-xs" style={{ color: "rgb(var(--foreground-subtle))" }}>
            <span className="font-semibold" style={{ color: "rgb(var(--foreground))" }}>{activities.filter((a) => a.critical).length}</span> on critical path
          </span>
          <span className="text-xs" style={{ color: "rgb(var(--foreground-subtle))" }}>
            Duration: <span className="font-semibold" style={{ color: "rgb(var(--foreground))" }}>{TOTAL_WEEKS} weeks</span>
          </span>
          <div className="flex items-center gap-1 ml-2">
            <span className="h-2 w-8 rounded" style={{ background: "rgb(var(--danger))", display: "inline-block", opacity: 0.7 }} />
            <span className="text-[10px]" style={{ color: "rgb(var(--foreground-subtle))" }}>Critical path</span>
          </div>
        </div>
      </div>
    </div>
  );
}
