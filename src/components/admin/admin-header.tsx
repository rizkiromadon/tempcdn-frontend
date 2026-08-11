"use client";

import { useRouter, usePathname } from "next/navigation";
import { LogOut, PanelLeft } from "lucide-react";
import { toast } from "sonner";
import { adminLogout } from "@/lib/api";
import { getAdminSession, clearAdminSession } from "@/lib/admin-auth";
import { useAdminSession } from "@/lib/use-admin-session";
import { useAdminSidebar } from "@/lib/use-admin-sidebar";

/**
 * Thin top bar for every /dashboard page - deliberately separate from the
 * public SiteHeader (see app/(site)/layout.tsx). The brand mark used to
 * live here but now lives in AdminSidebar; this bar only holds the
 * sidebar toggle and the logout action once signed in.
 */
export function AdminHeader() {
  const { status, session } = useAdminSession();
  const { toggle } = useAdminSidebar();
  const router = useRouter();
  const pathname = usePathname();
  const isLoginPage = pathname === "/dashboard/login";

  async function handleLogout() {
    const stored = getAdminSession();
    if (stored) {
      try {
        await adminLogout(stored.token);
      } catch {
        // Best-effort - clear the local session below regardless, same
        // reasoning as the logout button on the dashboard page itself.
      }
    }
    clearAdminSession();
    toast.success("Logged out");
    router.push("/dashboard/login");
  }

  return (
    <header className="sticky top-0 z-10 border-b border-line bg-mist/80 backdrop-blur-md">
      <div className="flex items-center justify-between px-4 py-3">
        {isLoginPage ? (
          <span />
        ) : (
          <button
            type="button"
            onClick={toggle}
            aria-label="Toggle sidebar"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-ink-soft transition-colors duration-200 hover:bg-paper-sunk hover:text-ink focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-bloom/15"
          >
            <PanelLeft className="h-4.5 w-4.5" strokeWidth={1.75} />
          </button>
        )}

        {status === "authenticated" && session && (
          <div className="flex items-center gap-4">
            <span className="hidden font-mono text-xs text-ink-faint sm:inline">
              {session.username}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-full border border-line px-3.5 py-1.5 text-xs font-medium text-ink-soft transition-colors duration-200 hover:border-coral/40 hover:text-coral focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-bloom/15"
            >
              <LogOut className="h-3.5 w-3.5" />
              Log out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
