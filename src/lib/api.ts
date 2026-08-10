import type { UploadedFile, TempCdnConfig } from "@/types/tempcdn";

export const API_BASE =
  process.env.NEXT_PUBLIC_TEMPCDN_API_BASE ?? "http://localhost:8080/api/v1";

export class TempCdnError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "TempCdnError";
  }
}

async function parseError(res: Response, fallbackMessage?: string): Promise<never> {
  let message = fallbackMessage ?? `Request failed with status ${res.status}`;
  try {
    const body = await res.json();
    if (body?.error) message = body.error;
  } catch {
    // response had no JSON body
  }
  throw new TempCdnError(message, res.status);
}

/** Default timeout for read-only calls (config/file-info/health/metrics). */
const DEFAULT_TIMEOUT_MS = 10_000;
/** Deletes get a little more headroom than reads. */
const DELETE_TIMEOUT_MS = 15_000;

/**
 * Wraps `fetch` with an AbortController-based timeout so a hung backend
 * can't leave the UI waiting forever. Timeouts surface as a TempCdnError
 * with status 0, matching the convention used for network-level failures
 * elsewhere in this file (e.g. xhr.onerror).
 */
async function fetchWithTimeout(
  url: string,
  init: RequestInit = {},
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new TempCdnError("Request timed out — check your connection and try again", 0);
    }
    throw new TempCdnError("Network error — check your connection and try again", 0);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Upload timeout is intentionally much longer than the read-only timeout
 * above (5 min vs 10s): large files on slow connections are a legitimate,
 * lengthy use case, not a hang. This still guards against a truly stuck
 * request (e.g. server accepted the connection but never responds).
 */
const UPLOAD_TIMEOUT_MS = 5 * 60 * 1000;

export function uploadFile(
  file: File,
  onProgress: (percent: number) => void
): { promise: Promise<UploadedFile>; abort: () => void } {
  const xhr = new XMLHttpRequest();
  const formData = new FormData();
  formData.append("file", file);

  const promise = new Promise<UploadedFile>((resolve, reject) => {
    xhr.open("POST", `${API_BASE}/upload`);
    xhr.timeout = UPLOAD_TIMEOUT_MS;

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      try {
        const body = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(body as UploadedFile);
        } else {
          reject(new TempCdnError(body?.error ?? "Upload failed", xhr.status));
        }
      } catch {
        reject(new TempCdnError("Malformed response from server", xhr.status));
      }
    };

    xhr.onerror = () => reject(new TempCdnError("Network error during upload", 0));
    xhr.onabort = () => reject(new TempCdnError("Upload cancelled", 0));
    xhr.ontimeout = () => reject(new TempCdnError("Upload timed out — try again", 0));

    xhr.send(formData);
  });

  return { promise, abort: () => xhr.abort() };
}

/**
 * Fetches server-driven upload constraints (max size, allowed mime types,
 * blocked extensions, retention TTL) from GET /api/v1/config.
 */
export async function getConfig(): Promise<TempCdnConfig> {
  const res = await fetchWithTimeout(`${API_BASE}/config`, { cache: "no-store" });
  if (!res.ok) return parseError(res);
  return res.json();
}

export async function getFileInfo(id: string): Promise<UploadedFile> {
  const res = await fetchWithTimeout(`${API_BASE}/files/${id}`, { cache: "no-store" });
  if (res.status === 410) {
    const body = await res.json();
    return body as UploadedFile;
  }
  if (!res.ok) return parseError(res);
  return res.json();
}

/**
 * Deletes a file before its TTL expires.
 *
 * Requires the `delete_token` issued in the original /upload response —
 * the API only accepts it via the `X-Delete-Token` header now, since a
 * bare file id is guessable/shareable and previously let anyone who knew
 * (or could enumerate) an id delete it. Callers without a token for this
 * id (shared links, older entries saved before this field existed, or
 * files uploaded before this rollout) should not call this at all; the
 * server rejects those with 403 and there's no way to recover a missing
 * token after the fact.
 */
export async function deleteFile(
  id: string,
  deleteToken: string
): Promise<{ deleted: boolean }> {
  const res = await fetchWithTimeout(
    `${API_BASE}/files/${id}`,
    { method: "DELETE", headers: { "X-Delete-Token": deleteToken } },
    DELETE_TIMEOUT_MS
  );
  if (res.status === 403) {
    return parseError(res, "This link can no longer be deleted from here — the delete token is missing or invalid.");
  }
  if (!res.ok) return parseError(res);
  return res.json();
}

export async function checkHealth(): Promise<{ status: string }> {
  const base = API_BASE.replace(/\/api\/v1$/, "");
  const res = await fetchWithTimeout(`${base}/healthz`, { cache: "no-store" });
  if (!res.ok) return parseError(res);
  return res.json();
}

export interface TempCdnMetrics {
  uploadsTotal: number;
  uploadBytesTotal: number;
  uploadErrorsTotal: number;
}

/**
 * Fetches the Prometheus text-format /metrics endpoint and extracts the
 * tempcdn_* counters. Any metric not present in the response is left
 * undefined-safe by defaulting to 0.
 */
export async function getTempCdnMetrics(): Promise<TempCdnMetrics> {
  const base = API_BASE.replace(/\/api\/v1$/, "");
  const res = await fetchWithTimeout(`${base}/metrics`, { cache: "no-store" });
  if (!res.ok) return parseError(res);
  const text = await res.text();

  const readMetric = (name: string): number => {
    // Tolerates an optional label block after the metric name, e.g.
    // `tempcdn_uploads_total{status="ok"} 42`, matching Prometheus text
    // format in general rather than only the current unlabeled-counter
    // shape shown in docs/page.tsx. If the backend later adds labels to
    // these counters, this keeps reading them instead of silently
    // returning 0.
    const match = text.match(new RegExp(`^${name}(\\{[^}]*\\})?\\s+([0-9eE+.-]+)$`, "m"));
    return match ? Number(match[2]) : 0;
  };

  return {
    uploadsTotal: readMetric("tempcdn_uploads_total"),
    uploadBytesTotal: readMetric("tempcdn_upload_bytes_total"),
    uploadErrorsTotal: readMetric("tempcdn_upload_errors_total")
  };
}
