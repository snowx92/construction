/** Turn copilot message body (plain text or AI JSON) into display text. */
export function copilotMessageText(content: unknown): string {
  if (content == null) return "";
  if (typeof content !== "string") return String(content);

  const trimmed = content.trim();
  if (!trimmed) return "";

  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) {
    return content;
  }

  const parsed = tryParseJson(trimmed);
  if (parsed) {
    const answer = pickAnswerField(parsed);
    if (answer) return answer;
  }

  const extracted = extractJsonStringField(trimmed, "answer");
  if (extracted) return extracted;

  return content;
}

function pickAnswerField(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;
  const obj = value as Record<string, unknown>;
  for (const key of ["answer", "content", "response", "text"]) {
    if (typeof obj[key] === "string" && obj[key]) return obj[key] as string;
  }
  return null;
}

function stripMarkdownJsonFence(text: string): string {
  const match = text.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return match ? match[1].trim() : text;
}

function tryParseJson(text: string): unknown | null {
  const raw = stripMarkdownJsonFence(text);
  try {
    return JSON.parse(raw);
  } catch {
    const start = raw.indexOf("{");
    if (start === -1) return null;

    let depth = 0;
    for (let i = start; i < raw.length; i++) {
      if (raw[i] === "{") depth++;
      else if (raw[i] === "}") {
        depth--;
        if (depth === 0) {
          try {
            return JSON.parse(raw.slice(start, i + 1));
          } catch {
            return null;
          }
        }
      }
    }
    return null;
  }
}

function extractJsonStringField(raw: string, fieldName: string): string | null {
  const key = `"${fieldName}"`;
  const idx = raw.indexOf(key);
  if (idx === -1) return null;

  let i = idx + key.length;
  while (i < raw.length && /\s/.test(raw[i])) i++;
  if (raw[i] !== ":") return null;
  i++;
  while (i < raw.length && /\s/.test(raw[i])) i++;
  if (raw[i] !== '"') return null;
  i++;

  let result = "";
  while (i < raw.length) {
    const ch = raw[i];
    if (ch === "\\") {
      i++;
      if (i >= raw.length) break;
      const esc = raw[i];
      const map: Record<string, string> = { n: "\n", r: "\r", t: "\t", '"': '"', "\\": "\\" };
      result += map[esc] ?? esc;
    } else if (ch === '"') {
      return result;
    } else {
      result += ch;
    }
    i++;
  }

  return result || null;
}
