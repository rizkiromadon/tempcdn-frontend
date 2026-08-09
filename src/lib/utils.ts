import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function msUntil(iso: string): number {
  return new Date(iso).getTime() - Date.now();
}

export function formatCountdown(ms: number): string {
  if (ms <= 0) return "expired";
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function truncateMiddle(str: string, front = 8, back = 6): string {
  if (str.length <= front + back + 3) return str;
  return `${str.slice(0, front)}...${str.slice(-back)}`;
}

export type FileKind = "image" | "video" | "audio" | "pdf" | "text" | "archive" | "other";

export function getFileKind(contentType: string): FileKind {
  if (contentType.startsWith("image/")) return "image";
  if (contentType.startsWith("video/")) return "video";
  if (contentType.startsWith("audio/")) return "audio";
  if (contentType === "application/pdf") return "pdf";
  if (
    contentType.startsWith("text/") ||
    contentType === "application/json" ||
    contentType === "application/xml"
  )
    return "text";
  if (
    /zip|tar|rar|7z|gzip|compressed/.test(contentType)
  )
    return "archive";
  return "other";
}

export function isPreviewable(contentType: string): boolean {
  const kind = getFileKind(contentType);
  return kind === "image";
}

/** True if `mime` matches a pattern from allowed_mime_types (supports "type/*" wildcards). */
function matchesMimePattern(mime: string, pattern: string): boolean {
  if (pattern === mime) return true;
  if (pattern.endsWith("/*")) {
    return mime.startsWith(pattern.slice(0, -1));
  }
  return false;
}

export interface FileValidationConfig {
  max_upload_size_bytes: number;
  allowed_mime_types: string[];
  blocked_extensions: string[];
}

export interface FileValidationResult {
  valid: boolean;
  reason?: string;
}

/**
 * Validates a File against server-provided upload config before it's sent
 * over the wire: max size, blocked extensions, and allowed mime types
 * (empty allowed_mime_types means "no restriction").
 */
export function validateFileAgainstConfig(
  file: File,
  config: FileValidationConfig
): FileValidationResult {
  if (config.max_upload_size_bytes > 0 && file.size > config.max_upload_size_bytes) {
    return {
      valid: false,
      reason: `File exceeds the ${formatBytes(config.max_upload_size_bytes)} limit`
    };
  }

  const dotIndex = file.name.lastIndexOf(".");
  const ext = dotIndex >= 0 ? file.name.slice(dotIndex).toLowerCase() : "";
  if (ext && config.blocked_extensions.some((b) => b.toLowerCase() === ext)) {
    return { valid: false, reason: `Files with "${ext}" extension aren't allowed` };
  }

  if (config.allowed_mime_types.length > 0 && file.type) {
    const allowed = config.allowed_mime_types.some((pattern) =>
      matchesMimePattern(file.type, pattern)
    );
    if (!allowed) {
      return { valid: false, reason: `File type "${file.type}" isn't supported` };
    }
  }

  return { valid: true };
}

/** Fraction of TTL remaining, clamped 0..1. Used to drive burn-state color/animation. */
export function fractionRemaining(createdAt: string, expiresAt: string, now = Date.now()): number {
  const created = new Date(createdAt).getTime();
  const expires = new Date(expiresAt).getTime();
  const total = expires - created;
  if (total <= 0) return 0;
  const remaining = expires - now;
  return Math.max(0, Math.min(1, remaining / total));
}
