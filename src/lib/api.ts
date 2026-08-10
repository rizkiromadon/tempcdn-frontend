import type { UploadedFile, TempCdnConfig } from "@/types/tempcdn";

/**
 * Round-robin + failover across multiple backend instances.
 *
 * Set NEXT_PUBLIC_TEMPCDN_API_BASES to a comma-separated list of API base
 * URLs (e.g. "https://srv1.tempcdn.eu.cc/api/v1,https://srv2.tempcdn.eu.cc/api/v1,https://srv3.tempcdn.eu.cc/api/v1")
 * to spread requests across several servers. Falls back to the single
 * NEXT_PUBLIC_TEMPCDN_API_BASE for backward compatibility when only one
 * server is configured (or in local dev).
 *
 * This only works correctly when every base points at instances sharing
 * one metadata store (see backend README "Running Multiple Instances") —
 * otherwise a request that round-robins to a different server than the one
 * that handled an earlier request (e.g. upload then get-info) won't find
 * the record it's looking for.
 */
const API_BASES: readonly string[] = (() => {
  const multi = process.env.NEXT_PUBLIC_TEMPCDN_API_BASES;
  if (multi && multi.trim() !== "") {
    const bases = multi
      .split(",")
      .map((base) => base.trim().replace(/\/+$/, ""))
      .filter((base) => base !== "");
    if (bases.length > 0) return bases;
  }
  const single = process.env.NEXT_PUBLIC_TEMPCDN_API_BASE ?? "http://localhost:8080/api/v1";
  return [single.replace(/\/+$/, "")];
})();

/**
 * All configured backend bases, in the order they were declared (not
 * rotation order). Exposed mainly so the docs page can note when more than
 * one server is in play.
 */
export { API_BASES };

/**
 * The first configured base, exposed for call sites that just need *a*
 * representative base URL to display (e.g. the docs page's curl examples)
 * rather than to actually make a load-balanced request.
 */
export const API_BASE = API_BASES[0];

/**
 * Module-level rotation cursor. Each call to nextBaseOrder() advances this
 * by one and returns all configured bases reordered to start from the next
 * one in sequence, so successive top-level requests (not retries within
 * the same request - see fetchWithFailover) are spread round-robin across
 * every configured server. Plain module state (not e.g. localStorage) is
 * intentional: rotation only needs to be fair within one page session, and
 * resetting on reload is harmless.
 */
let rotationCursor = 0;
function nextBaseOrder(): readonly string[] {
  const start = rotationCursor % API_BASES.length;
  rotationCursor = (rotationCursor + 1) % API_BASES.length;
  if (start === 0) return API_BASES;
  return [...API_BASES.slice(start), ...API_BASES.slice(0, start)];
}

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

/** Default timeout for read-only calls (config/file-info/health/stats). */
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
 * Returns true for failures worth retrying against a different backend
 * instance: network-level errors/timeouts (status 0, see
 * fetchWithTimeout) and 5xx server errors. 4xx responses are the server
 * correctly rejecting the request (bad input, missing auth, not found,
 * etc.) - retrying those against another instance would waste a round
 * trip and can never change the outcome, since the same request would be
 * rejected the same way everywhere.
 */
function isRetryableStatus(status: number): boolean {
  return status === 0 || status >= 500;
}

/**
 * Issues a read-only GET-style request against each configured backend in
 * round-robin order, advancing the shared rotation cursor once per call
 * (not once per retry), and falling over to the next backend when one
 * fails with a retryable error (see isRetryableStatus). Returns the first
 * response, retryable or not - callers still handle non-ok responses via
 * parseError as before, since a non-retryable 4xx from the last-tried
 * backend is the real answer to return.
 */
async function fetchWithFailover(
  path: string,
  init: RequestInit = {},
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<Response> {
  const bases = nextBaseOrder();
  let lastError: unknown;

  for (let i = 0; i < bases.length; i++) {
    const isLastAttempt = i === bases.length - 1;
    try {
      const res = await fetchWithTimeout(`${bases[i]}${path}`, init, timeoutMs);
      if (res.ok || !isRetryableStatus(res.status) || isLastAttempt) {
        return res;
      }
      // Retryable (5xx) and another backend remains - try the next one.
    } catch (err) {
      lastError = err;
      if (isLastAttempt) throw err;
      // Network error/timeout and another backend remains - try the next one.
    }
  }

  // Unreachable in practice (API_BASES always has at least one entry, and
  // the loop above always returns or throws on the last attempt), but
  // keeps the function's return type honest for the type checker.
  throw lastError instanceof Error
    ? lastError
    : new TempCdnError("All backend servers are unreachable", 0);
}

/**
 * Upload timeout is intentionally much longer than the read-only timeout
 * above (5 min vs 10s): large files on slow connections are a legitimate,
 * lengthy use case, not a hang. This still guards against a truly stuck
 * request (e.g. server accepted the connection but never responds).
 */
const UPLOAD_TIMEOUT_MS = 5 * 60 * 1000;

/**
 * Runs a single upload attempt against one backend base using
 * XMLHttpRequest (needed for upload progress events, which fetch doesn't
 * expose). Resolves/rejects like the old single-attempt uploadFile did;
 * retry-across-bases is handled by the caller (uploadFile below).
 */
function uploadAttempt(
  base: string,
  file: File,
  onProgress: (percent: number) => void
): { promise: Promise<UploadedFile>; xhr: XMLHttpRequest } {
  const xhr = new XMLHttpRequest();
  const formData = new FormData();
  formData.append("file", file);

  const promise = new Promise<UploadedFile>((resolve, reject) => {
    xhr.open("POST", `${base}/upload`);
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

  return { promise, xhr };
}

/**
 * Uploads a file, round-robin across configured backends with failover to
 * the next backend on a retryable error (see isRetryableStatus).
 *
 * A retry after progress has already started means restarting the upload
 * from 0% against the next backend - there's no way to resume a partial
 * multipart POST on a different server. This is still preferable to
 * surfacing a hard failure the moment one instance has a bad moment, but
 * it does mean onProgress can visibly jump backward to 0 on a retry; this
 * is expected, not a bug.
 */
export function uploadFile(
  file: File,
  onProgress: (percent: number) => void
): { promise: Promise<UploadedFile>; abort: () => void } {
  const bases = nextBaseOrder();
  let currentXhr: XMLHttpRequest | null = null;
  let aborted = false;

  const promise = (async () => {
    let lastError: unknown;

    for (let i = 0; i < bases.length; i++) {
      if (aborted) throw new TempCdnError("Upload cancelled", 0);

      const isLastAttempt = i === bases.length - 1;
      const attempt = uploadAttempt(bases[i], file, onProgress);
      currentXhr = attempt.xhr;

      try {
        return await attempt.promise;
      } catch (err) {
        lastError = err;
        const status = err instanceof TempCdnError ? err.status : 0;
        if (aborted || !isRetryableStatus(status) || isLastAttempt) {
          throw err;
        }
        // Retryable (network error/timeout/5xx) and another backend
        // remains - reset progress and try the next one.
        onProgress(0);
      }
    }

    // Unreachable (bases always has at least one entry, and the loop above
    // always returns or throws on the last attempt), but keeps the
    // function's return type honest for the type checker.
    throw lastError instanceof Error
      ? lastError
      : new TempCdnError("All backend servers are unreachable", 0);
  })();

  return {
    promise,
    abort: () => {
      aborted = true;
      currentXhr?.abort();
    }
  };
}

/**
 * Fetches server-driven upload constraints (max size, allowed mime types,
 * blocked extensions, retention TTL) from GET /api/v1/config.
 */
export async function getConfig(): Promise<TempCdnConfig> {
  const res = await fetchWithFailover("/config", { cache: "no-store" });
  if (!res.ok) return parseError(res);
  return res.json();
}

export async function getFileInfo(id: string): Promise<UploadedFile> {
  const res = await fetchWithFailover(`/files/${id}`, { cache: "no-store" });
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
  const res = await fetchWithFailover(
    `/files/${id}`,
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
  const bases = nextBaseOrder();
  let lastError: unknown;

  for (let i = 0; i < bases.length; i++) {
    const isLastAttempt = i === bases.length - 1;
    const healthUrl = bases[i].replace(/\/api\/v1$/, "") + "/healthz";
    try {
      const res = await fetchWithTimeout(healthUrl, { cache: "no-store" });
      if (res.ok || !isRetryableStatus(res.status) || isLastAttempt) {
        if (!res.ok) return parseError(res);
        return res.json();
      }
    } catch (err) {
      lastError = err;
      if (isLastAttempt) throw err;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new TempCdnError("All backend servers are unreachable", 0);
}

export interface TempCdnStats {
  activeFileCount: number;
  activeBytes: number;
  averageFileBytes: number;
  contentTypeBreakdown: Record<string, number>;
  uploadsTotal: number;
  uploadBytesTotal: number;
  uploadErrorsTotal: number;
  generatedAt: string;
}

/**
 * Fetches JSON stats from GET /api/v1/stats.
 *
 * Replaces the old Prometheus text-format /metrics endpoint (removed).
 * Numeric fields default to 0 and contentTypeBreakdown defaults to {}
 * when absent, so a partial/older server shape doesn't throw.
 */
export async function getTempCdnStats(): Promise<TempCdnStats> {
  const res = await fetchWithFailover("/stats", { cache: "no-store" });
  if (!res.ok) return parseError(res);
  const body = await res.json();

  return {
    activeFileCount: body?.active_file_count ?? 0,
    activeBytes: body?.active_bytes ?? 0,
    averageFileBytes: body?.average_file_bytes ?? 0,
    contentTypeBreakdown: body?.content_type_breakdown ?? {},
    uploadsTotal: body?.lifetime_uploads_total ?? 0,
    uploadBytesTotal: body?.lifetime_upload_bytes_total ?? 0,
    uploadErrorsTotal: body?.lifetime_upload_errors_total ?? 0,
    generatedAt: body?.generated_at ?? ""
  };
}
