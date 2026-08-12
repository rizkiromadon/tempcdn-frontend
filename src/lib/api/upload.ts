import type { UploadedFile } from "@/types/tempcdn";
import { TempCdnError } from "./errors";
import { isRetryableStatus } from "./http";
import { nextBaseOrder } from "./nodes";

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
