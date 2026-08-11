"use client";

import { useCallback, useEffect, useState } from "react";
import { adminMe, adminLogout, TempCdnError } from "@/lib/api";
import { getAdminSession, setAdminSession, clearAdminSession, onAdminSessionChanged } from "@/lib/admin-auth";
import type { AdminSession } from "@/types/tempcdn";

export type AdminSessionStatus = "checking" | "authenticated" | "unauthenticated";

/**
 * Tracks the current admin session for a component tree: reads the stored
 * token on mount, verifies it against GET /api/v1/admin/me (a token can be
 * present in localStorage but already expired or revoked server-side,
 * e.g. from a logout on another device), and stays in sync with
 * login/logout events fired elsewhere in this tab (see
 * lib/admin-auth.ts onAdminSessionChanged).
 *
 * "checking" is the initial state while the /me verification is in
 * flight (or before it's started) - callers rendering a protected page
 * should treat this the same as "not yet known" and avoid flashing
 * either the login form or the dashboard content until it resolves.
 */
export function useAdminSession(): {
  status: AdminSessionStatus;
  session: AdminSession | null;
  logout: () => Promise<void>;
} {
  const [status, setStatus] = useState<AdminSessionStatus>("checking");
  const [session, setSession] = useState<AdminSession | null>(null);

  const verify = useCallback(async () => {
    const stored = getAdminSession();
    if (!stored) {
      setSession(null);
      setStatus("unauthenticated");
      return;
    }
    try {
      const me = await adminMe(stored.token);
      // The /me call is also how we detect the token still being valid.
      // Only rewrite localStorage (and fire the change event) if the
      // username actually diverged from what's stored - otherwise this
      // would re-notify on every verify() call, including the one
      // triggered by onAdminSessionChanged below, causing an infinite
      // verify -> notify -> verify loop.
      if (me.username !== stored.username) {
        const refreshed: AdminSession = { ...stored, username: me.username };
        setAdminSession(refreshed);
        setSession(refreshed);
      } else {
        setSession(stored);
      }
      setStatus("authenticated");
    } catch (err) {
      // 401 means the token is invalid/expired/revoked - treat as logged
      // out. A network-level failure (status 0) or 5xx means we couldn't
      // confirm either way; still fall back to "unauthenticated" rather
      // than trusting an unverified token, since a protected page acting
      // on stale/unverifiable auth is worse than an extra login prompt.
      if (err instanceof TempCdnError && err.status === 401) {
        clearAdminSession();
      }
      setSession(null);
      setStatus("unauthenticated");
    }
  }, []);

  useEffect(() => {
    verify();
    return onAdminSessionChanged(verify);
  }, [verify]);

  const logout = useCallback(async () => {
    const stored = getAdminSession();
    if (stored) {
      try {
        await adminLogout(stored.token);
      } catch {
        // Best-effort: even if the network call fails, clear the local
        // session below so the UI reflects "logged out" immediately -
        // matching the backend's own idempotent-logout semantics.
      }
    }
    clearAdminSession();
  }, []);

  return { status, session, logout };
}
