"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAdminSession } from "@/lib/use-admin-session";
import type { AdminSession } from "@/types/tempcdn";

/**
 * Wraps a protected admin page: redirects to /dashboard/login when there's
 * no valid session, and only renders children once a session has been
 * verified against the server (see useAdminSession). Renders a loading
 * state in between rather than the login page or the protected content,
 * so a page reload doesn't flash the wrong screen while /me is in flight.
 */
export function AdminGuard({
  children
}: {
  children: (session: AdminSession) => React.ReactNode;
}) {
  const { status, session } = useAdminSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/dashboard/login");
    }
  }, [status, router]);

  if (status === "authenticated" && session) {
    return <>{children(session)}</>;
  }

  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-ink-faint" aria-label="Checking session…" />
    </div>
  );
}
