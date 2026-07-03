import { apiFetch } from "./client";
import type {
  ConfirmUploadBody,
  CreateUploadSessionsBody,
  CreateUploadSessionsResponse,
  DocumentRecord,
  DownloadUrlResponse,
  RetryDocumentBody,
} from "./types";

export function listDocuments(companyId: string, projectId: string, limit = 200) {
  return apiFetch<{ documents: (DocumentRecord & { id?: string })[] }>("/api/documents", {
    query: { companyId, projectId, limit },
  }).then((d) =>
    (d.documents ?? []).map((doc) => ({
      ...doc,
      documentId: doc.documentId ?? doc.id ?? "",
      companyId,
      projectId,
    }))
  );
}

export function createUploadSessions(body: CreateUploadSessionsBody) {
  return apiFetch<CreateUploadSessionsResponse>("/api/documents/upload-sessions", {
    method: "POST",
    body,
  });
}

export function confirmUpload(documentId: string, body: ConfirmUploadBody) {
  return apiFetch<{ documentId: string; status: string }>(`/api/documents/${documentId}/confirm`, {
    method: "POST",
    body,
  });
}

export function retryDocument(documentId: string, body: RetryDocumentBody) {
  return apiFetch<{ documentId: string; reprocessing: boolean; fromStep: string }>(
    `/api/documents/${documentId}/retry`,
    { method: "POST", body }
  );
}

export function deleteDocument(documentId: string, body: { companyId: string; projectId: string }) {
  return apiFetch<{ documentId: string; deleted: boolean }>(`/api/documents/${documentId}`, {
    method: "DELETE",
    body,
  });
}

export function getDownloadUrl(documentId: string, companyId: string, projectId: string) {
  return apiFetch<DownloadUrlResponse>(`/api/documents/${documentId}/download-url`, {
    query: { companyId, projectId },
  });
}

/* ── CRC32 (IEEE, S3 flexible checksum) ─────────────────────────── */

let CRC_TABLE: Uint32Array | null = null;

function crcTable(): Uint32Array {
  if (CRC_TABLE) return CRC_TABLE;
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  CRC_TABLE = t;
  return t;
}

function crc32(bytes: Uint8Array): number {
  const t = crcTable();
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) crc = (crc >>> 8) ^ t[(crc ^ bytes[i]) & 0xff];
  return (crc ^ 0xffffffff) >>> 0;
}

function crc32Base64(bytes: Uint8Array): string {
  const c = crc32(bytes);
  const buf = new Uint8Array([(c >>> 24) & 0xff, (c >>> 16) & 0xff, (c >>> 8) & 0xff, c & 0xff]);
  let bin = "";
  for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i]);
  return btoa(bin);
}

/**
 * Uploads a file to a presigned R2 URL.
 *
 * The backend presigns with SDK v3 "flexibleChecksums" mode, which puts
 *   x-amz-checksum-crc32=AAAAAA==  (placeholder)
 *   x-amz-sdk-checksum-algorithm=CRC32
 * in the query string and signs them. R2 (Cloudflare) enforces the checksum
 * strictly: the client MUST send a matching x-amz-checksum-crc32 header with
 * the real body CRC, otherwise R2 rejects with XAmzContentChecksumMismatch.
 *
 * SignedHeaders=content-length;host means we cannot set Content-Type (it
 * would still be tolerated by S3, but for safety we use ArrayBuffer so the
 * browser doesn't auto-add one).
 *
 * If R2 CORS blocks x-amz-checksum-crc32, the fetch will throw a TypeError
 * with no HTTP status — we surface that clearly so the backend team can add
 * the header to R2's CORS allow-list.
 */
export async function uploadFileToR2(uploadUrl: string, file: File): Promise<void> {
  const buffer = await file.arrayBuffer();

  // Only include the checksum header if the URL was presigned with the
  // flexibleChecksums placeholder — otherwise we'd send a header not
  // signed by the URL and R2 might reject it.
  const headers: Record<string, string> = {};
  try {
    const u = new URL(uploadUrl);
    if (u.searchParams.get("x-amz-checksum-crc32") != null) {
      headers["x-amz-checksum-crc32"] = crc32Base64(new Uint8Array(buffer));
    }
  } catch { /* leave as-is */ }

  let res: Response;
  try {
    res = await fetch(uploadUrl, {
      method: "PUT",
      body: buffer,
      headers,
    });
  } catch (err) {
    // TypeError from fetch usually means CORS or network failure. Give a
    // targeted hint since this is the most common R2 config issue.
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(
      `Network/CORS error uploading to R2 — the storage bucket may not allow ` +
      `the required headers. Please ensure the R2 CORS policy allows PUT with ` +
      `headers: content-length, x-amz-checksum-crc32. (${msg})`
    );
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    // Try to pull the R2 error <Code> and <Message> out of the XML
    const codeMatch   = /<Code>([^<]+)<\/Code>/.exec(detail);
    const msgMatch    = /<Message>([^<]+)<\/Message>/.exec(detail);
    const short = codeMatch || msgMatch
      ? `${codeMatch?.[1] ?? ""}${codeMatch && msgMatch ? ": " : ""}${msgMatch?.[1] ?? ""}`
      : detail.slice(0, 300);
    throw new Error(`R2 upload failed (${res.status}) ${short}`);
  }
}
