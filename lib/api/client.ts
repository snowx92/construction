import { auth } from "@/lib/firebase";
import type { ApiErrorBody, ApiSuccess } from "./types";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://us-central1-tender-ai-system.cloudfunctions.net/api";

export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(body: ApiErrorBody) {
    super(body.message);
    this.status = body.status;
    this.code = body.code;
  }
}

async function getIdToken(): Promise<string | null> {
  const u = auth.currentUser;
  return u ? u.getIdToken() : null;
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  body?: unknown;
  auth?: boolean;
  query?: Record<string, string | number | boolean | undefined>;
}

export async function apiFetch<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, auth: requireAuth = true, query } = opts;

  let url = BASE_URL + path;
  if (query) {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined) qs.append(k, String(v));
    }
    const s = qs.toString();
    if (s) url += `?${s}`;
  }

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (requireAuth) {
    const token = await getIdToken();
    if (!token) throw new ApiError({ status: 401, message: "Not signed in", code: "unauthenticated" });
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let json: ApiSuccess<T> | ApiErrorBody;
  try {
    json = await res.json();
  } catch {
    throw new ApiError({ status: res.status, message: res.statusText || "Network error" });
  }

  if (!res.ok || (json as ApiErrorBody).code !== undefined && !(json as ApiSuccess<T>).data) {
    const err = json as ApiErrorBody;
    throw new ApiError({ status: err.status ?? res.status, message: err.message, code: err.code });
  }

  return (json as ApiSuccess<T>).data;
}
