import type {
  UploadedFile,
  TempCdnConfig,
  NodesResponse,
  AdminLoginResponse,
  AdminMeResponse,
  ApiKey,
  CreateApiKeyResponse,
  UploadSettings,
  UpdateUploadSettingsRequest
} from "@/types/tempcdn";

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

const NODES_CACHE_TTL_MS = 30_000;
const NODES_TIMEOUT_MS = 5_000;

let cachedOnlineBases: readonly string[] | null = null;
let cacheExpiresAt = 0;
let discoveryInFlight: Promise<readonly string[]> | null = null;

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

async function discoverNodes(): Promise<readonly string[]> {
  let lastError: unknown;
  for (const seedId of BOOTSTRAP_NODE_IDS) {
    try {
      return await fetchNodesFrom(nodeBase(seedId));
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("node discovery failed");
}

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
        if (cachedOnlineBases) return cachedOnlineBases;
        throw err;
      })
      .finally(() => {
        discoveryInFlight = null;
      });
  }
  return discoveryInFlight;
}

export async function getApiBases(): Promise<readonly string[]> {
  return getOnlineBases();
}

export function invalidateNodesCache(): void {
  cachedOnlineBases = null;
  cacheExpiresAt = 0;
}

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
  }
  throw new TempCdnError(message, res.status);
}

const DEFAULT_TIMEOUT_MS = 10_000;
const DELETE_TIMEOUT_MS = 15_000;

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

function isRetryableStatus(status: number): boolean {
  return status === 0 || status >= 500;
}

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
    } catch (err) {
      lastError = err;
      sawRetryableFailure = true;
      if (isLastAttempt) throw err;
    }
  }

  if (sawRetryableFailure) invalidateNodesCache();

  throw lastError instanceof Error
    ? lastError
    : new TempCdnError("All backend servers are unreachable", 0);
}

const UPLOAD_TIMEOUT_MS = 5 * 60 * 1000;

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
        onProgress(0);
      }
    }

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

export async function getNodes(): Promise<NodesResponse> {
  const res = await fetchWithFailover("/nodes", { cache: "no-store" });
  if (!res.ok) return parseError(res);
  return res.json();
}

export async function adminLogin(username: string, password: string): Promise<AdminLoginResponse> {
  const res = await fetchWithFailover("/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });
  if (res.status === 401) {
    return parseError(res, "Invalid username or password.");
  }
  if (!res.ok) return parseError(res);
  return res.json();
}

export async function adminLogout(token: string): Promise<void> {
  const res = await fetchWithFailover("/admin/logout", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) return parseError(res);
}

export async function adminMe(token: string): Promise<AdminMeResponse> {
  const res = await fetchWithFailover("/admin/me", {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store"
  });
  if (!res.ok) return parseError(res);
  return res.json();
}

export async function createApiKey(token: string, name: string): Promise<CreateApiKeyResponse> {
  const res = await fetchWithFailover("/admin/api-keys", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ name })
  });
  if (!res.ok) return parseError(res);
  return res.json();
}

export async function listApiKeys(token: string): Promise<ApiKey[]> {
  const res = await fetchWithFailover("/admin/api-keys", {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store"
  });
  if (!res.ok) return parseError(res);
  return res.json();
}

export async function revokeApiKey(token: string, id: string): Promise<void> {
  const res = await fetchWithFailover(`/admin/api-keys/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) return parseError(res);
}

export async function getUploadSettings(token: string): Promise<UploadSettings> {
  const res = await fetchWithFailover("/admin/upload-settings", {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store"
  });
  if (!res.ok) return parseError(res);
  return res.json();
}

export async function updateUploadSettings(
  token: string,
  input: UpdateUploadSettingsRequest
): Promise<UploadSettings> {
  const res = await fetchWithFailover("/admin/upload-settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(input)
  });
  if (!res.ok) return parseError(res);
  return res.json();
}
