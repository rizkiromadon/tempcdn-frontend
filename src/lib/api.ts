import type { UploadedFile, TempCdnConfig, NodesResponse } from "@/types/tempcdn";

/**
 * Dynamic node discovery + round-robin + failover across multiple backend
 * instances.
 *
 * Backends are no longer hardcoded via env. Instead, set
 * NEXT_PUBLIC_TEMPCDN_DOMAIN to the production domain (e.g.
 * "productiondomain.com"). Each backend node is reachable at
 * "https://{node_id}.{domain}/api/v1", and the live set of nodes (plus
 * their online/offline status) is discovered by calling GET /api/v1/nodes
 * against a bootstrap node.
 *
 * Bootstrapping: since there's no base URL before discovery has run, the
 * very first /nodes call is made against a seed node
 * (NEXT_PUBLIC_TEMPCDN_BOOTSTRAP_NODE, default "srv1"). Once that call
 * succeeds we have a full node list and no longer need the seed - it's
 * only a bootstrap, not treated specially afterwards. If the seed itself
 * is offline/unreachable, discovery falls back to trying a few other
 * well-known node ids (srv2..srv6) before giving up.
 *
 * The discovered list is cached for NODES_CACHE_TTL_MS and shared by all
 * callers; only nodes reporting status "online" are used for actual API
 * traffic. This only works correctly when every online node shares one
 * metadata store (see backend README "Running Multiple Instances") -
 * otherwise a request that round-robins to a different node than the one
 * that handled an earlier request (e.g. upload then get-info) won't find
 * the record it's looking for.
 *
 * For local dev (or if NEXT_PUBLIC_TEMPCDN_DOMAIN isn't set), this falls
 * back to the old static env-based configuration:
 * NEXT_PUBLIC_TEMPCDN_API_BASES (comma-separated) or
 * NEXT_PUBLIC_TEMPCDN_API_BASE (single).
 */
const PRODUCTION_DOMAIN = process.env.NEXT_PUBLIC_TEMPCDN_DOMAIN?.trim().replace(/\/+$/, "");
const BOOTSTRAP_NODE_IDS: readonly string[] = (
  process.env.NEXT_PUBLIC_TEMPCDN_BOOTSTRAP_NODE?.trim() || "srv1"
)
  .split(",")
  .map((id) => id.trim())
  .filter(Boolean)
  .concat(["srv2", "srv3", "srv4", "srv5", "srv6"]);

function nodeBase(nodeId: string): string {
  return `https://${nodeId}.${PRODUCTION_DOMAIN}/api/v1`;
}

const STATIC_BASES: readonly string[] = (() => {
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

/** How long a discovered node list is trusted before re-fetching /nodes. */
const NODES_CACHE_TTL_MS = 30_000;
/** Short timeout for the /nodes discovery call itself. */
const NODES_TIMEOUT_MS = 5_000;

let cachedOnlineBases: readonly string[] | null = null;
let cacheExpiresAt = 0;
/** In-flight discovery promise, so concurrent callers share one request. */
let discoveryInFlight: Promise<readonly string[]> | null = null;

/**
 * Calls GET /api/v1/nodes against the given base and returns the base URLs
 * of every node reporting status "online". Throws on network error, non-ok
 * response, or a payload with no online nodes (all treated as discovery
 * failure by the caller, which tries the next seed).
 */
async function fetchNodesFrom(base: string): Promise<readonly string[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), NODES_TIMEOUT_MS);
  try {
    const res = await fetch(`${base}/nodes`, { cache: "no-store", signal: controller.signal });
    if (!res.ok) throw new Error(`nodes discovery failed with status ${res.status}`);
    const body = (await res.json()) as NodesResponse;
    const online = (body.nodes ?? [])
      .filter((n) => n.status === "online")
      .map((n) => nodeBase(n.node_id));
    if (online.length === 0) throw new Error("nodes discovery returned no online nodes");
    return online;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Discovers the current set of online node base URLs by trying the
 * bootstrap seed node(s) in order (see BOOTSTRAP_NODE_IDS) until one
 * responds with a usable node list. Result is cached for
 * NODES_CACHE_TTL_MS.
 */
async function discoverNodes(): Promise<readonly string[]> {
  let lastError: unknown;
  for (const seedId of BOOTSTRAP_NODE_IDS) {
    try {
      return await fetchNodesFrom(nodeBase(seedId));
    } catch (err) {
      lastError = err;
      // Try the next well-known seed node.
    }
  }
  throw lastError instanceof Error ? lastError : new Error("node discovery failed");
}

/**
 * Returns the current list of online backend bases, using the cache when
 * fresh. When the domain-based discovery mode isn't configured
 * (NEXT_PUBLIC_TEMPCDN_DOMAIN unset), returns the static env-configured
 * bases instead and skips discovery entirely - this is what keeps local
 * dev working unchanged.
 *
 * On cache miss, concurrent callers share a single in-flight discovery
 * call rather than each firing their own /nodes request. If discovery
 * fails and we have a (possibly stale) cached list, we fall back to it
 * rather than failing outright - stale node info is still likely usable,
 * and normal per-request failover handles any node that's since gone
 * offline.
 */
async function getOnlineBases(): Promise<readonly string[]> {
  if (!PRODUCTION_DOMAIN) return STATIC_BASES;

  const now = Date.now();
  if (cachedOnlineBases && now < cacheExpiresAt) return cachedOnlineBases;

  if (!discoveryInFlight) {
    discoveryInFlight = discoverNodes()
      .then((bases) => {
        cachedOnlineBases = bases;
        cacheExpiresAt = Date.now() + NODES_CACHE_TTL_MS;
        return bases;
      })
      .catch((err) => {
        if (cachedOnlineBases) return cachedOnlineBases; // serve stale on failure
        throw err;
      })
      .finally(() => {
        discoveryInFlight = null;
      });
  }
  return discoveryInFlight;
}

/**
 * Public accessor for the current set of backend bases (discovered online
 * nodes in domain mode, or the static env list otherwise), in the order
 * they were last seen (not rotation order). Exposed so call sites like the
 * docs page can display *a* representative base URL (e.g. for curl
 * examples) and note when more than one server is in play, without making
 * an actual load-balanced request.
 */
export async function getApiBases(): Promise<readonly string[]> {
  return getOnlineBases();
}

/**
 * Forces a fresh /nodes discovery call on next use, bypassing the cache.
 * Useful after a run of failovers suggests the cached node list is stale.
 */
export function invalidateNodesCache(): void {
  cachedOnlineBases = null;
  cacheExpiresAt = 0;
}

/**
 * Module-level rotation cursor. Each call to nextBaseOrder() advances this
 * by one and returns all online bases reordered to start from the next one
 * in sequence, so successive top-level requests (not retries within the
 * same request - see fetchWithFailover) are spread round-robin across
 * every online server. Plain module state (not e.g. localStorage) is
 * intentional: rotation only needs to be fair within one page session, and
 * resetting on reload is harmless.
 */
let rotationCursor = 0;
function rotate(bases: readonly string[]): readonly string[] {
  if (bases.length === 0) return bases;
  const start = rotationCursor % bases.length;
  rotationCursor = (rotationCursor + 1) % bases.length;
  if (start === 0) return bases;
  return [...bases.slice(start), ...bases.slice(0, start)];
}

async function nextBaseOrder(): Promise<readonly string[]> {
  const bases = await getOnlineBases();
  return rotate(bases);
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
  const bases = await nextBaseOrder();
  let lastError: unknown;
  let sawRetryableFailure = false;

  for (let i = 0; i < bases.length; i++) {
    const isLastAttempt = i === bases.length - 1;
    try {
      const res = await fetchWithTimeout(`${bases[i]}${path}`, init, timeoutMs);
      if (res.ok || !isRetryableStatus(res.status) || isLastAttempt) {
        return res;
      }
      sawRetryableFailure = true;
      // Retryable (5xx) and another backend remains - try the next one.
    } catch (err) {
      lastError = err;
      sawRetryableFailure = true;
      if (isLastAttempt) throw err;
      // Network error/timeout and another backend remains - try the next one.
    }
  }

  // A node we thought was online just failed - the cached node list is
  // likely stale (node went offline since the last /nodes poll). Refresh
  // it in the background so the *next* request gets an up-to-date set.
  if (sawRetryableFailure) invalidateNodesCache();

  // Unreachable in practice (bases always has at least one entry when
  // discovery/static config succeeded, and the loop above always returns
  // or throws on the last attempt), but keeps the function's return type
  // honest for the type checker.
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
  let currentXhr: XMLHttpRequest | null = null;
  let aborted = false;

  const promise = (async () => {
    const bases = await nextBaseOrder();
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
  const bases = await nextBaseOrder();
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

/**
 * Fetches the live cluster node list from GET /api/v1/nodes, for display
 * purposes (e.g. an admin/status page showing which nodes are online).
 * This goes through the normal failover machinery like any other read, so
 * it also benefits from - and reports on - whichever node currently
 * answers first.
 *
 * Not to be confused with the internal discovery machinery above (see
 * discoverNodes/getOnlineBases), which calls the bootstrap seed node
 * directly rather than going through fetchWithFailover, since it's what
 * *builds* the list fetchWithFailover uses.
 */
export async function getNodes(): Promise<NodesResponse> {
  const res = await fetchWithFailover("/nodes", { cache: "no-store" });
  if (!res.ok) return parseError(res);
  return res.json();
}
