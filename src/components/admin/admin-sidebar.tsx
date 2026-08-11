"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { LayoutDashboard, KeyRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAdminSidebar } from "@/lib/use-admin-sidebar";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/api-keys", label: "API Keys", icon: KeyRound }
] as const;

/**
 * Collapsible sidebar for /dashboard pages. Holds the brand mark (moved
 * here from AdminHeader, which is now just a thin top bar) and the admin
 * nav. Open/closed state lives in AdminSidebarProvider so AdminHeader's
 * toggle button and this component stay in sync, and persists to
 * localStorage so it survives navigation between dashboard pages.
 */
export function AdminSidebar() {
  const pathname = usePathname();
  const { isOpen, close } = useAdminSidebar();

  // The login page isn't behind AdminGuard and has no session yet, so
  // showing admin nav there would be misleading - skip rendering entirely.
  if (pathname === "/dashboard/login") return null;

  return (
    <>
      {/* Backdrop on small screens when the sidebar is open */}
      {isOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={close}
          className="fixed inset-0 z-20 bg-ink/20 backdrop-blur-[1px] lg:hidden"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-line bg-paper transition-transform duration-200 ease-out lg:sticky lg:top-0 lg:h-svh lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center gap-2.5 border-b border-line px-5 py-4">
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
              <span className="text-[11px] text-ink-faint">admin dashboard</span>
            </div>
          </Link>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4" aria-label="Admin navigation">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={close}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200",
                  isActive
                    ? "bg-bloom-soft text-bloom-strong"
                    : "text-ink-soft hover:bg-paper-sunk hover:text-ink"
                )}
              >
                <Icon className="h-4 w-4" strokeWidth={1.75} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
