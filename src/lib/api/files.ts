import type { UploadedFile, TempCdnConfig, NodesResponse } from "@/types/tempcdn";
import { parseError, TempCdnError } from "./errors";
import { fetchWithFailover, fetchWithTimeout, isRetryableStatus, DELETE_TIMEOUT_MS } from "./http";
import { nextBaseOrder } from "./nodes";

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

export async function getNodes(): Promise<NodesResponse> {
  const res = await fetchWithFailover("/nodes", { cache: "no-store" });
  if (!res.ok) return parseError(res);
  return res.json();
}
