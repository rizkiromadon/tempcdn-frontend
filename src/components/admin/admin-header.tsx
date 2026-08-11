"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { adminLogout } from "@/lib/api";
import { getAdminSession, clearAdminSession } from "@/lib/admin-auth";
import { useAdminSession } from "@/lib/use-admin-session";

/**
 * Header for every /dashboard page - deliberately separate from the
 * public SiteHeader (see app/(site)/layout.tsx): no public nav links
 * (Upload, API docs), and shows a logout action once signed in. The logo
 * links to /dashboard instead of / so admins don't accidentally leave the
 * admin area via the brand mark.
 */
export function AdminHeader() {
  const { status, session } = useAdminSession();
  const router = useRouter();

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
      <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
        <Link
          href="/dashboard"
          className="group flex items-center gap-2.5 rounded-full focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-bloom/15"
        >
          <Image
            src="/icons/logo-mark.png"
            alt="TempCDN logo"
            width={36}
            height={36}
            priority
            className="h-9 w-9 rounded-full transition-transform duration-200 group-hover:scale-105"
          />
          <div className="flex flex-col leading-none">
            <span className="font-display text-sm font-bold text-ink">TempCDN</span>
            <span className="hidden text-[11px] text-ink-faint sm:inline">admin dashboard</span>
          </div>
        </Link>
        <nav className="flex items-center gap-4" aria-label="Admin">
          {status === "authenticated" && session && (
            <>
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
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
