"use client";

import type { AdminSession } from "@/types/tempcdn";

const STORAGE_KEY = "tempcdn.admin_session";

/**
 * Fired on window whenever the stored admin session changes (login,
 * logout, or expiry cleanup), so components in different parts of the
 * tree (e.g. a header badge and the dashboard page) can stay in sync
 * without prop drilling or a context provider. Storage events don't fire
 * in the same tab that made the change, so we dispatch this ourselves
 * rather than relying on the native "storage" event.
 */
const SESSION_CHANGED_EVENT = "tempcdn:admin-session-changed";

function isBrowser() {
  return typeof window !== "undefined";
}

function notifyChanged() {
  if (!isBrowser()) return;
  window.dispatchEvent(new Event(SESSION_CHANGED_EVENT));
}

/**
 * Returns the current admin session from localStorage, or null if absent,
 * malformed, or already expired (an expired session is also proactively
 * cleared as a side effect, so callers don't have to remember to do it).
 */
export function getAdminSession(): AdminSession | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AdminSession;
    if (!parsed?.token || !parsed?.username || !parsed?.expiresAt) return null;
    if (new Date(parsed.expiresAt).getTime() <= Date.now()) {
      // Side effect in a "getter": intentional. An expired session found
      // here is garbage that should never be returned to a caller, so we
      // clean it up on the way out rather than requiring every call site
      // to remember to do it. clearAdminSession also fires the change
      // event; that's fine even from inside a change-event listener,
      // since a second read of an already-cleared session just hits the
      // `!raw` branch above and returns null without recursing further.
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
    // localStorage unavailable (private mode, quota, etc.) — the session
    // simply won't persist across reloads; the caller's in-memory state
    // for this page load still works.
  }
}

export function clearAdminSession() {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  } finally {
    notifyChanged();
  }
}

/**
 * Subscribes to admin session changes (login/logout in this tab). Returns
 * an unsubscribe function, matching the useEffect cleanup convention.
 */
export function onAdminSessionChanged(callback: () => void): () => void {
  if (!isBrowser()) return () => {};
  window.addEventListener(SESSION_CHANGED_EVENT, callback);
  return () => window.removeEventListener(SESSION_CHANGED_EVENT, callback);
}
