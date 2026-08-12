"use client";

import { useCallback, useEffect, useState } from "react";
import { adminMe, adminLogout, TempCdnError } from "@/lib/api";
import { getAdminSession, setAdminSession, clearAdminSession, onAdminSessionChanged } from "@/lib/admin-auth";
import type { AdminSession } from "@/types/tempcdn";

export type AdminSessionStatus = "checking" | "authenticated" | "unauthenticated";

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
      if (me.username !== stored.username) {
        const refreshed: AdminSession = { ...stored, username: me.username };
        setAdminSession(refreshed);
        setSession(refreshed);
      } else {
        setSession(stored);
      }
      setStatus("authenticated");
    } catch (err) {
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
      }
    }
    clearAdminSession();
  }, []);

  return { status, session, logout };
}
