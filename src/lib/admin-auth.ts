"use client";

import type { AdminSession } from "@/types/tempcdn";

const STORAGE_KEY = "tempcdn.admin_session";

const SESSION_CHANGED_EVENT = "tempcdn:admin-session-changed";

function isBrowser() {
  return typeof window !== "undefined";
}

function notifyChanged() {
  if (!isBrowser()) return;
  window.dispatchEvent(new Event(SESSION_CHANGED_EVENT));
}

export function getAdminSession(): AdminSession | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AdminSession;
    if (!parsed?.token || !parsed?.username || !parsed?.expiresAt) return null;
    if (new Date(parsed.expiresAt).getTime() <= Date.now()) {
      clearAdminSession();
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function setAdminSession(session: AdminSession) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    notifyChanged();
  } catch {
  }
}

export function clearAdminSession() {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
  } finally {
    notifyChanged();
  }
}

export function onAdminSessionChanged(callback: () => void): () => void {
  if (!isBrowser()) return () => {};
  window.addEventListener(SESSION_CHANGED_EVENT, callback);
  return () => window.removeEventListener(SESSION_CHANGED_EVENT, callback);
}
