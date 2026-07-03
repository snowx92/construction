/** Turn proposal section body (string or AI JSON) into display text. */
export function proposalSectionText(content: unknown, sectionKey?: string): string {
  if (content == null) return "";
  if (typeof content === "string") return content;
  if (typeof content === "number" || typeof content === "boolean") return String(content);

  if (typeof content === "object") {
    const obj = content as Record<string, unknown>;
    if (typeof obj.content === "string") return obj.content;
    if (typeof obj.text === "string") return obj.text;

    if (sectionKey) {
      const keyed = obj[sectionKey];
      if (typeof keyed === "string") return keyed;
      if (keyed && typeof keyed === "object") return structuredSectionToText(keyed);
    }

    return structuredSectionToText(obj);
  }

  return String(content);
}

function structuredSectionToText(value: unknown, depth = 0): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);

  if (Array.isArray(value)) {
    return value
      .map((item) => {
        const line = structuredSectionToText(item, depth + 1);
        return line ? (depth > 0 ? `• ${line.replace(/\n/g, "\n  ")}` : line) : "";
      })
      .filter(Boolean)
      .join("\n");
  }

  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .map(([key, val]) => {
        const body = structuredSectionToText(val, depth + 1);
        if (!body) return "";
        const label = key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
        if (depth === 0) return `${label}:\n${body}`;
        return `${label}: ${body}`;
      })
      .filter(Boolean)
      .join("\n\n");
  }

  return String(value);
}

export function truncateProposalSectionText(text: string, max = 600): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}…`;
}
