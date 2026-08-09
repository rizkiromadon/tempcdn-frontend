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

async function parseError(res: Response): Promise<never> {
  let message = `Request failed with status ${res.status}`;
  try {
    const body = await res.json();
    if (body?.error) message = body.error;
  } catch {
    // response had no JSON body
  }
  throw new TempCdnError(message, res.status);
}

export function uploadFile(
  file: File,
  onProgress: (percent: number) => void
): { promise: Promise<UploadedFile>; abort: () => void } {
  const xhr = new XMLHttpRequest();
  const formData = new FormData();
  formData.append("file", file);

  const promise = new Promise<UploadedFile>((resolve, reject) => {
    xhr.open("POST", `${API_BASE}/upload`);

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

    xhr.send(formData);
  });

  return { promise, abort: () => xhr.abort() };
}

/**
 * Fetches server-driven upload constraints (max size, allowed mime types,
 * blocked extensions, retention TTL) from GET /api/v1/config.
 */
export async function getConfig(): Promise<TempCdnConfig> {
  const res = await fetch(`${API_BASE}/config`, { cache: "no-store" });
  if (!res.ok) return parseError(res);
  return res.json();
}

export async function getFileInfo(id: string): Promise<UploadedFile> {
  const res = await fetch(`${API_BASE}/files/${id}`, { cache: "no-store" });
  if (res.status === 410) {
    const body = await res.json();
    return body as UploadedFile;
  }
  if (!res.ok) return parseError(res);
  return res.json();
}

export async function deleteFile(id: string): Promise<{ deleted: boolean }> {
  const res = await fetch(`${API_BASE}/files/${id}`, { method: "DELETE" });
  if (!res.ok) return parseError(res);
  return res.json();
}

export async function checkHealth(): Promise<{ status: string }> {
  const base = API_BASE.replace(/\/api\/v1$/, "");
  const res = await fetch(`${base}/healthz`, { cache: "no-store" });
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
  const res = await fetch(`${base}/metrics`, { cache: "no-store" });
  if (!res.ok) return parseError(res);
  const text = await res.text();

  const readMetric = (name: string): number => {
    const match = text.match(new RegExp(`^${name}\\s+([0-9eE+.-]+)$`, "m"));
    return match ? Number(match[1]) : 0;
  };

  return {
    uploadsTotal: readMetric("tempcdn_uploads_total"),
    uploadBytesTotal: readMetric("tempcdn_upload_bytes_total"),
    uploadErrorsTotal: readMetric("tempcdn_upload_errors_total")
  };
}
