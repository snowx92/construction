import type { CompanyProfile } from "@/types";

export type PDFTheme = "corporate" | "classic" | "modern" | "bold";

interface ThemeVars {
  headerBg:   string;
  headerText: string;
  accent:     string;
  accentSub:  string;
  bodyBg:     string;
  sectionBg:  string;
  border:     string;
  text1:      string;
  text2:      string;
  fontFamily: string;
}

const THEMES: Record<PDFTheme, ThemeVars> = {
  corporate: {
    headerBg:   "#1e3a5f",
    headerText: "#ffffff",
    accent:     "#e67e22",
    accentSub:  "#fdf0e0",
    bodyBg:     "#f5f7fa",
    sectionBg:  "#ffffff",
    border:     "#d0d9e6",
    text1:      "#1e3a5f",
    text2:      "#4a5568",
    fontFamily: "'Segoe UI', Arial, sans-serif",
  },
  classic: {
    headerBg:   "#1a1a1a",
    headerText: "#ffffff",
    accent:     "#c9a227",
    accentSub:  "#fdf8e8",
    bodyBg:     "#fffef8",
    sectionBg:  "#ffffff",
    border:     "#d4c9a0",
    text1:      "#1a1a1a",
    text2:      "#555555",
    fontFamily: "Georgia, 'Times New Roman', serif",
  },
  modern: {
    headerBg:   "#ffffff",
    headerText: "#1a1a2e",
    accent:     "#2563eb",
    accentSub:  "#eff6ff",
    bodyBg:     "#f8fafc",
    sectionBg:  "#ffffff",
    border:     "#e2e8f0",
    text1:      "#0f172a",
    text2:      "#475569",
    fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
  },
  bold: {
    headerBg:   "#000000",
    headerText: "#e5b800",
    accent:     "#e5b800",
    accentSub:  "#fffbeb",
    bodyBg:     "#fafafa",
    sectionBg:  "#ffffff",
    border:     "#d4a000",
    text1:      "#000000",
    text2:      "#444444",
    fontFamily: "'Helvetica Neue', Arial, sans-serif",
  },
};

function fmt(n: number) {
  return n.toLocaleString("en-US");
}

function row(cells: string[], header = false): string {
  const tag = header ? "th" : "td";
  return `<tr>${cells.map((c) => `<${tag}>${c}</${tag}>`).join("")}</tr>`;
}

export function generateCompanyPDF(profile: CompanyProfile, theme: PDFTheme): void {
  const t = THEMES[theme];

  const headerBorderStyle = theme === "modern"
    ? `border-top: 4px solid ${t.accent};`
    : "";

  const logoBlock = `
    <div style="display:flex;align-items:center;gap:16px;">
      <div style="width:52px;height:52px;border-radius:12px;background:${t.accent};display:flex;align-items:center;justify-content:center;">
        <span style="color:${theme === "bold" ? "#000" : "#fff"};font-size:20px;font-weight:900;">
          ${(profile.tradeName || profile.legalName).slice(0, 2).toUpperCase()}
        </span>
      </div>
      <div>
        <div style="font-size:22px;font-weight:800;letter-spacing:-0.5px;">${profile.legalName}</div>
        ${profile.tagline ? `<div style="font-size:13px;margin-top:3px;opacity:0.8;">${profile.tagline}</div>` : ""}
      </div>
    </div>`;

  const metaLine = [
    profile.headquarters,
    `Est. ${profile.established}`,
    profile.registration,
    profile.website,
  ].filter(Boolean).join("  ·  ");

  function section(title: string, content: string) {
    return `
      <div class="section">
        <div class="section-title">${title}</div>
        ${content}
      </div>`;
  }

  function kv(label: string, value?: string) {
    if (!value) return "";
    return `<div class="kv"><span class="kv-label">${label}</span><span class="kv-val">${value}</span></div>`;
  }

  /* About section */
  const aboutContent = `
    ${profile.vision ? `<div class="vision-block"><strong>Vision</strong><p>${profile.vision}</p></div>` : ""}
    ${profile.bio ? `<p class="bio">${profile.bio.replace(/\n/g, "</p><p class='bio'>")}</p>` : ""}
    <div class="kv-grid">
      ${kv("Headquarters", profile.headquarters)}
      ${kv("Established", String(profile.established))}
      ${kv("Registration", profile.registration)}
      ${kv("VAT Number", profile.vatNumber)}
      ${kv("Website", profile.website)}
      ${kv("LinkedIn", profile.linkedin)}
      ${kv("Instagram", profile.instagram)}
      ${kv("Twitter / X", profile.twitter)}
    </div>`;

  /* Certifications */
  const certsContent = profile.certifications.length
    ? `<ul class="cert-list">${profile.certifications.map((c) => `<li>${c}</li>`).join("")}</ul>`
    : "<p>—</p>";

  /* Track record */
  const totalVal = profile.pastProjects.reduce((s, p) => s + p.value, 0);
  const trackContent = `
    <table>
      ${row(["Project", "Client", "Year", "Value (AED)", "Category", "Status"], true)}
      ${profile.pastProjects.map((p) =>
        row([p.name, p.client, String(p.year), fmt(p.value), p.category, p.status.replace("_", " ")])
      ).join("")}
      <tr class="total-row">
        <td colspan="3"><strong>Total value delivered</strong></td>
        <td><strong>AED ${fmt(totalVal)}</strong></td>
        <td colspan="2"></td>
      </tr>
    </table>`;

  /* Staff */
  const staffContent = profile.staff.length
    ? `<table>
        ${row(["Name", "Employee ID", "Title", "Department", "Nationality"], true)}
        ${profile.staff.map((s) => row([s.name, s.employeeId, s.title, s.department, s.nationality ?? "—"])).join("")}
      </table>`
    : "<p>—</p>";

  /* Equipment */
  const totalUnits = profile.equipment.reduce((s, e) => s + e.quantity, 0);
  const equipContent = profile.equipment.length
    ? `<table>
        ${row(["Equipment", "Model", "Ownership", "Qty", "Daily Rate (AED)", "Status"], true)}
        ${profile.equipment.map((e) =>
          row([e.name, e.model ?? "—", e.ownership, String(e.quantity), e.dailyRate ? fmt(e.dailyRate) : "—", e.status.replace("_", " ")])
        ).join("")}
        <tr class="total-row">
          <td colspan="3"><strong>Total units</strong></td>
          <td><strong>${totalUnits}</strong></td>
          <td colspan="2"></td>
        </tr>
      </table>`
    : "<p>—</p>";

  /* Labour */
  const totalHc = profile.labour.reduce((s, l) => s + l.headcount, 0);
  const labourContent = profile.labour.length
    ? `<table>
        ${row(["Role", "Trade", "Headcount", "Daily Rate (AED)", "Skill Level", "Nationality"], true)}
        ${profile.labour.map((l) =>
          row([l.title, l.trade, String(l.headcount), fmt(l.dailyRate), l.skillLevel.replace("_", " "), l.nationality ?? "—"])
        ).join("")}
        <tr class="total-row">
          <td colspan="2"><strong>Total workforce</strong></td>
          <td><strong>${totalHc}</strong></td>
          <td colspan="3"></td>
        </tr>
      </table>`
    : "<p>—</p>";

  const css = `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: ${t.fontFamily};
      font-size: 12px;
      color: ${t.text1};
      background: ${t.bodyBg};
    }
    .header {
      background: ${t.headerBg};
      color: ${t.headerText};
      padding: 32px 40px 28px;
      ${headerBorderStyle}
    }
    .header .meta {
      margin-top: 14px;
      font-size: 11px;
      opacity: 0.75;
      letter-spacing: 0.3px;
    }
    .body { padding: 28px 40px; }
    .section {
      background: ${t.sectionBg};
      border: 1px solid ${t.border};
      border-radius: 8px;
      padding: 20px 24px;
      margin-bottom: 18px;
      break-inside: avoid;
    }
    .section-title {
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: ${t.accent};
      border-bottom: 2px solid ${t.accentSub};
      padding-bottom: 8px;
      margin-bottom: 14px;
    }
    .vision-block {
      background: ${t.accentSub};
      border-left: 3px solid ${t.accent};
      padding: 12px 16px;
      border-radius: 4px;
      margin-bottom: 14px;
    }
    .vision-block strong { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: ${t.accent}; }
    .vision-block p { margin-top: 6px; line-height: 1.5; color: ${t.text1}; }
    .bio { line-height: 1.65; color: ${t.text2}; margin-bottom: 10px; }
    .kv-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-top: 14px; }
    .kv { display: flex; flex-direction: column; }
    .kv-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: ${t.text2}; margin-bottom: 2px; }
    .kv-val { font-size: 12px; font-weight: 600; color: ${t.text1}; }
    .cert-list { list-style: none; display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; }
    .cert-list li::before { content: "✓  "; color: ${t.accent}; font-weight: 700; }
    .cert-list li { font-size: 11px; color: ${t.text2}; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th { background: ${t.accentSub}; color: ${t.text1}; text-align: left; padding: 8px 10px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid ${t.border}; }
    td { padding: 7px 10px; border-bottom: 1px solid ${t.border}; color: ${t.text2}; vertical-align: middle; }
    tr:last-child td { border-bottom: none; }
    .total-row td { background: ${t.accentSub}; color: ${t.text1}; font-weight: 600; }
    .footer {
      text-align: center;
      font-size: 10px;
      color: ${t.text2};
      padding: 16px 40px;
      border-top: 1px solid ${t.border};
      margin-top: 8px;
    }
    @media print {
      body { background: white; }
      .section { break-inside: avoid; }
      @page { margin: 12mm 14mm; size: A4; }
    }
  `;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${profile.legalName} — Company Profile</title>
  <style>${css}</style>
</head>
<body>
  <div class="header">
    ${logoBlock}
    <div class="meta">${metaLine}</div>
  </div>
  <div class="body">
    ${section("About", aboutContent)}
    ${section("Certifications & Approvals", certsContent)}
    ${section("Track Record", trackContent)}
    ${section("Staff & Organisation", staffContent)}
    ${section("Equipment & Machinery", equipContent)}
    ${section("Labour & Workforce", labourContent)}
  </div>
  <div class="footer">
    ${profile.legalName} · ${profile.headquarters} · Generated ${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}
  </div>
</body>
</html>`;

  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => {
    win.print();
  }, 400);
}
