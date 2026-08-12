import { TempCdnError } from "./errors";
import { nextBaseOrder, invalidateNodesCache } from "./nodes";

export const DEFAULT_TIMEOUT_MS = 10_000;
export const DELETE_TIMEOUT_MS = 15_000;

export async function fetchWithTimeout(
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

export function isRetryableStatus(status: number): boolean {
  return status === 0 || status >= 500;
}

export async function fetchWithFailover(
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
