"use client";

import type { UploadedFile } from "@/types/tempcdn";

const STORAGE_KEY = "tempcdn.recent";
const MAX_ENTRIES = 12;

export interface RecentEntry {
  id: string;
  original_name: string;
  content_type: string;
  size_bytes: number;
  cdn_url: string;
  created_at: string;
  expires_at: string;
  /**
   * Delete authorization secret, captured from the upload response and
   * kept only in this device's localStorage — the API never returns it
   * again afterwards. Absent for entries saved before this field existed;
   * those files can no longer be deleted manually (see UploadedFile).
   */
  delete_token?: string;
}

function isBrowser() {
  return typeof window !== "undefined";
}

export function getRecentEntries(): RecentEntry[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RecentEntry[];
    // Drop anything already past expiry so the list stays relevant.
    const now = Date.now();
    return parsed.filter((entry) => new Date(entry.expires_at).getTime() > now);
  } catch {
    return [];
  }
}

export function pushRecentEntry(file: UploadedFile) {
  if (!isBrowser()) return;
  try {
    const existing = getRecentEntries().filter((entry) => entry.id !== file.id);
    const next: RecentEntry[] = [
      {
        id: file.id,
        original_name: file.original_name,
        content_type: file.content_type,
        size_bytes: file.size_bytes,
        cdn_url: file.cdn_url,
        created_at: file.created_at,
        expires_at: file.expires_at,
        delete_token: file.delete_token
      },
      ...existing
    ].slice(0, MAX_ENTRIES);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // localStorage unavailable (private mode, quota, etc.) — fail silently
  }
}

/**
 * Looks up a single recent entry by id, primarily so pages that only have
 * the id (e.g. /files/[id], loaded from a shared link) can recover the
 * delete token if this browser is the one that originally uploaded it.
 */
export function getRecentEntry(id: string): RecentEntry | undefined {
  return getRecentEntries().find((entry) => entry.id === id);
}

export function removeRecentEntry(id: string) {
  if (!isBrowser()) return;
  try {
    const next = getRecentEntries().filter((entry) => entry.id !== id);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

export function clearRecentEntries() {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
