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
  if (ms <= 0) return "EXPIRED";
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

/** Fraction of TTL remaining, clamped 0..1. Used to drive burn-state color/animation. */
export function fractionRemaining(createdAt: string, expiresAt: string, now = Date.now()): number {
  const created = new Date(createdAt).getTime();
  const expires = new Date(expiresAt).getTime();
  const total = expires - created;
  if (total <= 0) return 0;
  const remaining = expires - now;
  return Math.max(0, Math.min(1, remaining / total));
}
